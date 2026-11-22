/**
 * @file Gera o rascunho `.tmj` (formato Tiled) de uma Fase a partir da sua descrição em
 * `scripts/fases/<id>.js`: camadas `fundo`, `colisao`, `frente` e `objetos`, mapa finito,
 * tileset embutido e sem compressão, para que abrir e salvar no Tiled seja opcional.
 *
 * Na camada `objetos` ficam pontos: `inicio`, cada `checkpoint` (no chão) e cada `item`
 * (o id do Item no tipo do objeto) e cada `samambaia` (a chave do Fato no tipo), além da
 * área `fim`. A Samambaia-prateada escondida ganha um arbusto na camada `frente` por cima.
 *
 * Recusa vãos, degraus, plataformas e Itens além das constantes do pulo, e recusa sobrescrever
 * um `.tmj` existente sem `--force` (o arquivo pode ter sido enfeitado no Tiled).
 *
 * Uso: `npm run gerar:fase -- <id> [--force] [--saida <arquivo>]`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PULO, TILE } from '../src/logica/pulo.js';
import { COLUNAS, IMAGEM, NOME, QUANTIDADE, TILES, UMA_MAO } from './tileset.js';

const RAIZ_REPO = fileURLToPath(new URL('..', import.meta.url));
const PRIMEIRO_GID = 1;
/** Colunas entre o começo do primeiro chão e o início do Kiwi. */
const COLUNA_INICIO = 2;
/** Colunas entre o fim do último chão e a bandeira de chegada. */
const RECUO_FIM = 3;
const ALTURA_FIM = 3;

/**
 * @typedef {{ chao: number, altura: number } | { vao: number }} Trecho
 * Um trecho de chão (largura e altura em tiles) ou um vão (largura em tiles).
 */

/**
 * @typedef {Object} Plataforma
 * @property {number} coluna - Primeira coluna da plataforma.
 * @property {number} largura - Em tiles.
 * @property {number} alturaSobreChao - Tiles entre o topo do chão e o topo da plataforma.
 */

/**
 * @typedef {Object} ItemNoMapa
 * @property {number} coluna - Coluna do Item; precisa ter chão.
 * @property {string} item - Id do Item no catálogo.
 * @property {number} alturaSobreChao - Tile do Item contado do chão: 1 é o tile logo acima.
 */

/**
 * @typedef {Object} SamambaiaNoMapa
 * @property {number} coluna - Coluna da Samambaia-prateada; precisa ter chão.
 * @property {string} chave - Chave do Fato que ela revela.
 * @property {number} alturaSobreChao - Tile contado do chão: 1 é o tile logo acima.
 * @property {boolean} [escondida] - Se fica atrás de um arbusto da camada `frente`.
 */

/**
 * @typedef {Object} DescricaoFase
 * @property {number} altura - Altura do mapa, em tiles.
 * @property {Trecho[]} trechos - Da esquerda para a direita; o primeiro e o último são chão.
 * @property {Plataforma[]} plataformas - Plataformas de mão única.
 * @property {ItemNoMapa[]} [itens] - Itens a coletar.
 * @property {number[]} [checkpoints] - Colunas dos Checkpoints, além do início.
 * @property {SamambaiaNoMapa[]} [samambaias] - As Samambaias-prateadas da Fase.
 */

/**
 * Alcance do pulo segurado até pousar `subida` tiles acima da decolagem.
 *
 * O pulo é uma parábola de altura e alcance `PULO.segurado`: pousar mais alto corta a
 * descida, e o alcance cai até a metade quando o pouso fica no ápice. Pousar na mesma
 * altura ou abaixo vale o alcance cheio (a descida extra fica de folga).
 *
 * @param {number} subida - Tiles entre o chão da decolagem e o do pouso.
 * @returns {number} Distância horizontal, em tiles, que o pulo cobre até esse pouso.
 */
function alcanceSubindo(subida) {
  const { altura, alcance } = PULO.segurado;
  if (subida <= 0) return alcance;
  return (alcance / 2) * (1 + Math.sqrt(1 - subida / altura));
}

/**
 * Calcula a altura do chão em cada coluna, recusando o que o pulo não vence.
 *
 * @param {Trecho[]} trechos - Os trechos da Fase.
 * @returns {number[]} Altura do chão por coluna, em tiles; 0 num vão.
 * @throws {Error} Se um vão é mais largo que o alcance até o chão seguinte, ou um degrau
 *   mais alto que o pulo.
 */
function alturasDoChao(trechos) {
  const alturas = [];
  let alturaAnterior = null;
  let vaoAnterior = 0;

  for (const trecho of trechos) {
    if ('vao' in trecho) {
      if (trecho.vao > PULO.segurado.alcance) {
        throw new Error(`vão de ${trecho.vao} tiles na coluna ${alturas.length}: o alcance do pulo é ${PULO.segurado.alcance}`);
      }
      alturas.push(...Array(trecho.vao).fill(0));
      vaoAnterior = trecho.vao;
      continue;
    }
    const subida = alturaAnterior === null ? 0 : trecho.altura - alturaAnterior;
    if (subida > PULO.segurado.altura) {
      throw new Error(`degrau de ${subida} tiles na coluna ${alturas.length}: o pulo sobe ${PULO.segurado.altura}`);
    }
    const alcance = alcanceSubindo(subida);
    if (vaoAnterior > alcance) {
      throw new Error(`vão de ${vaoAnterior} tiles subindo ${subida} antes da coluna ${alturas.length}: o pulo alcança ${alcance.toFixed(1)}`);
    }
    alturas.push(...Array(trecho.chao).fill(trecho.altura));
    alturaAnterior = trecho.altura;
    vaoAnterior = 0;
  }
  return alturas;
}

/**
 * Cria uma camada de tiles vazia do tamanho do mapa.
 *
 * @param {number} id - Id da camada no mapa.
 * @param {string} nome - Nome da camada.
 * @param {number} largura - Em tiles.
 * @param {number} altura - Em tiles.
 * @returns {{ camada: object, pintar: (coluna: number, linha: number, tile: number) => void }}
 *   A camada no formato Tiled e uma função que põe um tile (id base 0) numa célula.
 */
function camadaDeTiles(id, nome, largura, altura) {
  const data = Array(largura * altura).fill(0);
  const camada = { data, height: altura, id, name: nome, opacity: 1, type: 'tilelayer', visible: true, width: largura, x: 0, y: 0 };
  const pintar = (coluna, linha, tile) => {
    data[linha * largura + coluna] = PRIMEIRO_GID + tile;
  };
  return { camada, pintar };
}

/**
 * Monta o tileset embutido, com a imagem relativa ao `.tmj` em `assets/mapas/`.
 *
 * @returns {object} O tileset no formato Tiled.
 */
function tilesetEmbutido() {
  const linhas = Math.ceil(QUANTIDADE / COLUNAS);
  return {
    columns: COLUNAS,
    firstgid: PRIMEIRO_GID,
    image: relative('assets/mapas', IMAGEM).replaceAll('\\', '/'),
    imageheight: linhas * TILE,
    imagewidth: COLUNAS * TILE,
    margin: 0,
    name: NOME,
    spacing: 0,
    tilecount: QUANTIDADE,
    tileheight: TILE,
    tilewidth: TILE,
    tiles: UMA_MAO.map((id) => ({ id, properties: [{ name: 'umaMao', type: 'bool', value: true }] })),
  };
}

/**
 * Gera o mapa Tiled de uma Fase a partir da sua descrição.
 *
 * @param {DescricaoFase} descricao - A Fase em trechos e plataformas.
 * @returns {object} O mapa no formato Tiled JSON, pronto para gravar como `.tmj`.
 * @throws {Error} Se algum vão, degrau ou plataforma passa das constantes do pulo.
 */
export function gerarMapa(descricao) {
  const chao = alturasDoChao(descricao.trechos);
  const largura = chao.length;
  const { altura } = descricao;
  const fundo = camadaDeTiles(1, 'fundo', largura, altura);
  const colisao = camadaDeTiles(2, 'colisao', largura, altura);
  const frente = camadaDeTiles(3, 'frente', largura, altura);
  const topo = (coluna) => altura - chao[coluna];

  chao.forEach((alturaChao, coluna) => {
    if (alturaChao === 0) return;
    colisao.pintar(coluna, topo(coluna), TILES.grama);
    for (let linha = topo(coluna) + 1; linha < altura; linha += 1) colisao.pintar(coluna, linha, TILES.terra);
    if (coluna % 7 === 3) fundo.pintar(coluna, topo(coluna) - 1, TILES.arbusto);
    if (coluna % 11 === 6) fundo.pintar(coluna, 3 + (coluna % 3), TILES.nuvem);
  });

  for (const { coluna, largura: larguraPlataforma, alturaSobreChao } of descricao.plataformas) {
    if (!chao[coluna]) throw new Error(`plataforma na coluna ${coluna} sem chão embaixo`);
    if (alturaSobreChao > PULO.segurado.altura) {
      throw new Error(`plataforma ${alturaSobreChao} tiles acima do chão na coluna ${coluna}: o pulo sobe ${PULO.segurado.altura}`);
    }
    const linha = topo(coluna) - alturaSobreChao;
    for (let i = 0; i < larguraPlataforma; i += 1) colisao.pintar(coluna + i, linha, TILES.plataforma);
  }

  const colunaFim = largura - RECUO_FIM;
  for (let i = 1; i < ALTURA_FIM; i += 1) frente.pintar(colunaFim, topo(colunaFim) - i, TILES.mastro);
  frente.pintar(colunaFim, topo(colunaFim) - ALTURA_FIM, TILES.bandeira);

  const ponto = (name, type, coluna, y) => ({ height: 0, name, point: true, rotation: 0, type, visible: true, width: 0, x: (coluna + 0.5) * TILE, y });
  const objetos = [
    ponto('inicio', '', COLUNA_INICIO, topo(COLUNA_INICIO) * TILE),
    { height: ALTURA_FIM * TILE, name: 'fim', rotation: 0, type: '', visible: true, width: TILE, x: colunaFim * TILE, y: (topo(colunaFim) - ALTURA_FIM) * TILE },
  ];

  for (const coluna of descricao.checkpoints ?? []) {
    if (!chao[coluna]) throw new Error(`checkpoint na coluna ${coluna} sem chão embaixo`);
    objetos.push(ponto('checkpoint', '', coluna, topo(coluna) * TILE));
  }

  // O pulo segurado tira os pés do Kiwi `altura` tiles do chão: o corpo alcança um tile acima.
  const alturaMaximaItem = PULO.segurado.altura + 1;
  for (const { coluna, item, alturaSobreChao } of descricao.itens ?? []) {
    if (!chao[coluna]) throw new Error(`item ${item} na coluna ${coluna} sem chão embaixo`);
    if (alturaSobreChao < 1 || alturaSobreChao > alturaMaximaItem) {
      throw new Error(`item ${item} ${alturaSobreChao} tiles acima do chão na coluna ${coluna}: o Kiwi alcança ${alturaMaximaItem}`);
    }
    objetos.push(ponto('item', item, coluna, (topo(coluna) - alturaSobreChao + 0.5) * TILE));
  }

  for (const { coluna, chave, alturaSobreChao, escondida } of descricao.samambaias ?? []) {
    if (!chao[coluna]) throw new Error(`samambaia ${chave} na coluna ${coluna} sem chão embaixo`);
    if (alturaSobreChao < 1 || alturaSobreChao > alturaMaximaItem) {
      throw new Error(`samambaia ${chave} ${alturaSobreChao} tiles acima do chão na coluna ${coluna}: o Kiwi alcança ${alturaMaximaItem}`);
    }
    const linha = topo(coluna) - alturaSobreChao;
    if (escondida) frente.pintar(coluna, linha, TILES.arbusto);
    objetos.push(ponto('samambaia', chave, coluna, (linha + 0.5) * TILE));
  }
  objetos.forEach((objeto, indice) => { objeto.id = indice + 1; });

  return {
    compressionlevel: -1,
    height: altura,
    infinite: false,
    layers: [
      fundo.camada,
      colisao.camada,
      frente.camada,
      { draworder: 'topdown', id: 4, name: 'objetos', objects: objetos, opacity: 1, type: 'objectgroup', visible: true, x: 0, y: 0 },
    ],
    nextlayerid: 5,
    nextobjectid: objetos.length + 1,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.11.0',
    tileheight: TILE,
    tilesets: [tilesetEmbutido()],
    tilewidth: TILE,
    type: 'map',
    version: '1.10',
    width: largura,
  };
}

/**
 * Lê os argumentos da linha de comando.
 *
 * @param {string[]} argumentos - `process.argv` sem o node e o script.
 * @returns {{ id: string, forcar: boolean, saida: string }} A Fase, o --force e o destino.
 * @throws {Error} Se falta o id da Fase.
 */
function lerArgumentos(argumentos) {
  const [id] = argumentos.filter((argumento, i) => !argumento.startsWith('--') && argumentos[i - 1] !== '--saida');
  if (!id) throw new Error('uso: gerar-fase <id> [--force] [--saida <arquivo>]');
  const indiceSaida = argumentos.indexOf('--saida');
  const saida = indiceSaida >= 0 ? argumentos[indiceSaida + 1] : `${RAIZ_REPO}assets/mapas/${id}.tmj`;
  return { id, forcar: argumentos.includes('--force'), saida };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { id, forcar, saida } = lerArgumentos(process.argv.slice(2));
    const { default: descricao } = await import(`./fases/${id}.js`);
    const mapa = gerarMapa(descricao);
    await mkdir(dirname(saida), { recursive: true });
    await writeFile(saida, `${JSON.stringify(mapa)}\n`, { flag: forcar ? 'w' : 'wx' });
    console.log(`Fase ${id} gerada em ${saida}`);
  } catch (erro) {
    const mensagem = erro.code === 'EEXIST' ? `${erro.path} já existe; use --force para sobrescrever` : erro.message;
    console.error(`gerar-fase: ${mensagem}`);
    process.exit(1);
  }
}
