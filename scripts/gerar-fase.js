/**
 * @file Gera o rascunho `.tmj` (formato Tiled) de uma Fase a partir da sua descrição em
 * `scripts/fases/<id>.js`: camadas `fundo`, `colisao`, `frente` e `objetos`, mapa finito,
 * tileset embutido e sem compressão, para que abrir e salvar no Tiled seja opcional.
 *
 * Recusa vãos, degraus e plataformas além das constantes do pulo, e recusa sobrescrever
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
 * @typedef {Object} DescricaoFase
 * @property {number} altura - Altura do mapa, em tiles.
 * @property {Trecho[]} trechos - Da esquerda para a direita; o primeiro e o último são chão.
 * @property {Plataforma[]} plataformas - Plataformas de mão única.
 */

/**
 * Calcula a altura do chão em cada coluna, recusando o que o pulo não vence.
 *
 * @param {Trecho[]} trechos - Os trechos da Fase.
 * @returns {number[]} Altura do chão por coluna, em tiles; 0 num vão.
 * @throws {Error} Se um vão é mais largo que o alcance ou um degrau mais alto que o pulo.
 */
function alturasDoChao(trechos) {
  const alturas = [];
  let alturaAnterior = null;

  for (const trecho of trechos) {
    if ('vao' in trecho) {
      if (trecho.vao > PULO.segurado.alcance) {
        throw new Error(`vão de ${trecho.vao} tiles na coluna ${alturas.length}: o alcance do pulo é ${PULO.segurado.alcance}`);
      }
      alturas.push(...Array(trecho.vao).fill(0));
      continue;
    }
    if (alturaAnterior !== null && trecho.altura - alturaAnterior > PULO.segurado.altura) {
      throw new Error(`degrau de ${trecho.altura - alturaAnterior} tiles na coluna ${alturas.length}: o pulo sobe ${PULO.segurado.altura}`);
    }
    alturas.push(...Array(trecho.chao).fill(trecho.altura));
    alturaAnterior = trecho.altura;
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

  const objetos = [
    { height: 0, id: 1, name: 'inicio', point: true, rotation: 0, type: '', visible: true, width: 0, x: (COLUNA_INICIO + 0.5) * TILE, y: topo(COLUNA_INICIO) * TILE },
    { height: ALTURA_FIM * TILE, id: 2, name: 'fim', rotation: 0, type: '', visible: true, width: TILE, x: colunaFim * TILE, y: (topo(colunaFim) - ALTURA_FIM) * TILE },
  ];

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
