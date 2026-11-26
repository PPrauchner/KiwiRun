/**
 * @file Gera o rascunho `.tmj` (formato Tiled) de uma Fase a partir da sua descrição em
 * `scripts/fases/<id>.js`: camadas `fundo`, `colisao`, `frente` e `objetos`, mapa finito,
 * tileset embutido e sem compressão, para que abrir e salvar no Tiled seja opcional.
 *
 * Na camada `objetos` ficam pontos: `inicio`, cada `checkpoint` (no chão) e cada `item`
 * (o id do Item no tipo do objeto), cada `samambaia` (a chave do Fato no tipo) e cada
 * `placa` (a chave do texto no tipo e a ação na propriedade `acao`, sobre um tile de placa
 * na camada `fundo`), além das
 * áreas `fim` e `predador` (a espécie no tipo; o Predador patrulha de uma ponta à outra) e `ovelha` (a
 * Ovelha anda de uma ponta à outra, plataforma móvel de mão única) e `esteira` (o tile de cima
 * do chão, com o sentido na propriedade `sentido`). A Samambaia-prateada escondida ganha uma folhagem na camada `frente` por cima.
 * No piso de cais, o chão é concreto, o mar aparece no fundo dos vãos e as pilhas de contêiner
 * ficam sólidas na camada `colisao`, com o tileset do Porto embutido depois do Kenney.
 *
 * Recusa vãos, degraus, plataformas, pilhas de contêiner e Itens além das constantes do pulo,
 * trajetos de Ovelha com vão de esmagamento, esteiras sem sentido, e recusa sobrescrever
 * um `.tmj` existente sem `--force` (o arquivo pode ter sido enfeitado no Tiled).
 *
 * Uso: `npm run gerar:fase -- <id> [--force] [--saida <arquivo>]`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PULO, TILE } from '../src/logica/pulo.js';
import { SENTIDOS_ESTEIRA } from '../src/logica/esteira.js';
import { COLUNAS, IMAGEM, NOME, QUANTIDADE, TILES, TILES_PORTO, TILESET_PORTO, UMA_MAO } from './tileset.js';

const RAIZ_REPO = fileURLToPath(new URL('..', import.meta.url));
const PRIMEIRO_GID = 1;
/** O tileset do Porto vem logo depois do Kenney: seus tiles são contados a partir daqui. */
const INICIO_PORTO = QUANTIDADE;
/** Linhas de mar no fundo de cada vão do cais. */
const LINHAS_MAR = 2;
/** Contêineres da pilha, alternados por coluna e andar. */
const CORES_CONTEINER = Object.freeze([TILES_PORTO.conteinerVermelho, TILES_PORTO.conteinerAzul, TILES_PORTO.conteinerVerde]);
/** Colunas entre o começo do primeiro chão e o início do Kiwi. */
const COLUNA_INICIO = 2;
/** Colunas entre o fim do último chão e a bandeira de chegada. */
const RECUO_FIM = 3;
const ALTURA_FIM = 3;
/** Tiles acima do trajeto da Ovelha que ficam livres: a Ovelha e o Kiwi montado nela. */
const ALTURA_LIVRE_OVELHA = 2;

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
 * @property {boolean} [escondida] - Se fica atrás de uma folhagem da camada `frente`.
 */

/**
 * @typedef {Object} PredadorNoMapa
 * @property {string} especie - Espécie de Predador do catálogo.
 * @property {number} de - Primeira coluna da patrulha.
 * @property {number} ate - Última coluna da patrulha; de `de` a `ate` o chão é plano.
 */

/**
 * @typedef {Object} OvelhaNoMapa
 * @property {number} de - Primeira coluna do trajeto.
 * @property {number} ate - Última coluna do trajeto; de `de` a `ate` o chão é plano e,
 *   acima dele e nas colunas vizinhas, nada sólido onde o Kiwi montado seria prensado.
 */

/**
 * @typedef {Object} PlacaNoMapa
 * @property {number} coluna - Coluna da Placa; precisa ter chão.
 * @property {string} chave - Chave do texto da Placa nos Textos.
 * @property {string} acao - A ação que a Placa ensina, cujos botões ela mostra.
 */

/**
 * @typedef {Object} ConteineresNoMapa
 * @property {number} coluna - Primeira coluna da pilha; de `coluna` em diante o chão é plano.
 * @property {number} largura - Em tiles.
 * @property {number} altura - Contêineres empilhados sobre o chão; o pulo precisa vencê-los.
 */

/**
 * @typedef {Object} EsteiraNoMapa
 * @property {number} de - Primeira coluna da esteira.
 * @property {number} ate - Última coluna; de `de` a `ate` o chão é plano.
 * @property {1 | -1} sentido - Para onde ela empurra o Kiwi: 1 à direita, -1 à esquerda.
 */

/**
 * @typedef {Object} DescricaoFase
 * @property {number} altura - Altura do mapa, em tiles.
 * @property {'pasto' | 'cais'} [piso] - O chão: grama e terra (o padrão) ou o concreto do
 *   cais, com o mar no fundo dos vãos e o tileset do Porto embutido.
 * @property {ConteineresNoMapa[]} [conteineres] - Pilhas sólidas de contêineres sobre o chão.
 * @property {EsteiraNoMapa[]} [esteiras] - As esteiras e seus sentidos.
 * @property {Trecho[]} trechos - Da esquerda para a direita; o primeiro e o último são chão.
 * @property {Plataforma[]} plataformas - Plataformas de mão única.
 * @property {ItemNoMapa[]} [itens] - Itens a coletar.
 * @property {number[]} [checkpoints] - Colunas dos Checkpoints, além do início.
 * @property {SamambaiaNoMapa[]} [samambaias] - As Samambaias-prateadas da Fase.
 * @property {PredadorNoMapa[]} [predadores] - Os Predadores e suas patrulhas.
 * @property {OvelhaNoMapa[]} [ovelhas] - As Ovelhas e seus trajetos.
 * @property {PlacaNoMapa[]} [placas] - As Placas que ensinam um controle.
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
 * Monta um tileset embutido, com a imagem relativa ao `.tmj` em `assets/mapas/`.
 *
 * @param {{ nome: string, imagem: string, colunas: number, quantidade: number, firstgid: number }} tileset
 *   - O PNG, a grade e o primeiro gid do tileset.
 * @returns {object} O tileset no formato Tiled.
 */
function tilesetEmbutido({ nome, imagem, colunas, quantidade, firstgid }) {
  const linhas = Math.ceil(quantidade / colunas);
  return {
    columns: colunas,
    firstgid,
    image: relative('assets/mapas', imagem).replaceAll('\\', '/'),
    imageheight: linhas * TILE,
    imagewidth: colunas * TILE,
    margin: 0,
    name: nome,
    spacing: 0,
    tilecount: quantidade,
    tileheight: TILE,
    tilewidth: TILE,
  };
}

/**
 * Os tilesets embutidos no mapa: o Kenney, com as plataformas de mão única, e, no cais, o do
 * Porto logo depois dele.
 *
 * @param {boolean} comPorto - Se o mapa usa o tileset do Porto.
 * @returns {object[]} Os tilesets no formato Tiled.
 */
function tilesetsEmbutidos(comPorto) {
  const kenney = {
    ...tilesetEmbutido({ nome: NOME, imagem: IMAGEM, colunas: COLUNAS, quantidade: QUANTIDADE, firstgid: PRIMEIRO_GID }),
    tiles: UMA_MAO.map((id) => ({ id, properties: [{ name: 'umaMao', type: 'bool', value: true }] })),
  };
  if (!comPorto) return [kenney];
  return [kenney, tilesetEmbutido({ ...TILESET_PORTO, firstgid: PRIMEIRO_GID + INICIO_PORTO })];
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
  const cais = descricao.piso === 'cais';
  const porto = (tile) => INICIO_PORTO + tile;
  const piso = cais
    ? { topo: porto(TILES_PORTO.concreto), corpo: porto(TILES_PORTO.concretoBase) }
    : { topo: TILES.grama, corpo: TILES.terra };

  chao.forEach((alturaChao, coluna) => {
    if (alturaChao === 0) {
      if (!cais) return;
      fundo.pintar(coluna, altura - LINHAS_MAR, TILES.mar);
      for (let linha = altura - LINHAS_MAR + 1; linha < altura; linha += 1) fundo.pintar(coluna, linha, TILES.marFundo);
      return;
    }
    colisao.pintar(coluna, topo(coluna), piso.topo);
    for (let linha = topo(coluna) + 1; linha < altura; linha += 1) colisao.pintar(coluna, linha, piso.corpo);
    if (!cais && coluna % 7 === 3) fundo.pintar(coluna, topo(coluna) - 1, TILES.arbusto);
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

  for (const { coluna, largura: larguraPilha, altura: alturaPilha } of descricao.conteineres ?? []) {
    const colunas = chao.slice(coluna, coluna + larguraPilha);
    if (colunas.length !== larguraPilha || !colunas.every((alturaChao) => alturaChao > 0 && alturaChao === colunas[0])) {
      throw new Error(`contêineres entre as colunas ${coluna} e ${coluna + larguraPilha - 1}: a pilha pede chão plano, sem vão`);
    }
    if (alturaPilha > PULO.segurado.altura) {
      throw new Error(`contêineres de ${alturaPilha} tiles na coluna ${coluna}: o pulo sobe ${PULO.segurado.altura}`);
    }
    for (let i = 0; i < larguraPilha; i += 1) {
      for (let andar = 1; andar <= alturaPilha; andar += 1) {
        colisao.pintar(coluna + i, topo(coluna) - andar, porto(CORES_CONTEINER[(coluna + i + andar) % CORES_CONTEINER.length]));
      }
    }
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
    if (escondida) frente.pintar(coluna, linha, TILES.folhagem);
    objetos.push(ponto('samambaia', chave, coluna, (linha + 0.5) * TILE));
  }
  const plano = (de, ate) => {
    const colunas = chao.slice(de, ate + 1);
    return colunas.length === ate - de + 1 && colunas.every((alturaChao) => alturaChao > 0 && alturaChao === colunas[0]);
  };
  const areaSobreOChao = (name, type, de, ate) => ({
    height: TILE, name, rotation: 0, type, visible: true,
    width: (ate - de + 1) * TILE, x: de * TILE, y: (topo(de) - 1) * TILE,
  });
  for (const { coluna, chave, acao } of descricao.placas ?? []) {
    if (!chao[coluna]) throw new Error(`placa ${chave} na coluna ${coluna} sem chão embaixo`);
    fundo.pintar(coluna, topo(coluna) - 1, TILES.placa);
    objetos.push({
      ...ponto('placa', chave, coluna, topo(coluna) * TILE),
      properties: [{ name: 'acao', type: 'string', value: acao }],
    });
  }
  for (const { especie, de, ate } of descricao.predadores ?? []) {
    if (!plano(de, ate)) throw new Error(`predador ${especie} entre as colunas ${de} e ${ate}: a patrulha pede chão plano, sem vão`);
    objetos.push(areaSobreOChao('predador', especie, de, ate));
  }
  for (const { de, ate } of descricao.ovelhas ?? []) {
    if (!plano(de, ate)) throw new Error(`ovelha entre as colunas ${de} e ${ate}: o trajeto pede chão plano, sem vão`);
    // A Ovelha ocupa a linha logo acima do chão e o Kiwi montado nela, a de cima: nada sólido
    // ali, nem nas colunas vizinhas, para o Kiwi nunca ser prensado.
    for (let coluna = Math.max(0, de - 1); coluna <= Math.min(largura - 1, ate + 1); coluna += 1) {
      for (let linha = topo(de) - ALTURA_LIVRE_OVELHA; linha < topo(de); linha += 1) {
        if (colisao.camada.data[linha * largura + coluna] !== 0) {
          throw new Error(`ovelha entre as colunas ${de} e ${ate}: algo sólido na coluna ${coluna}, linha ${linha}, faz vão de esmagamento`);
        }
      }
    }
    objetos.push(areaSobreOChao('ovelha', '', de, ate));
  }
  for (const { de, ate, sentido } of descricao.esteiras ?? []) {
    if (!plano(de, ate)) throw new Error(`esteira entre as colunas ${de} e ${ate}: a esteira pede chão plano, sem vão`);
    if (!SENTIDOS_ESTEIRA.includes(sentido)) throw new Error(`esteira entre as colunas ${de} e ${ate}: sentido ${sentido}, e não 1 ou -1`);
    // A esteira é o tile de cima do chão: o Kiwi pisa nela.
    objetos.push({
      ...areaSobreOChao('esteira', '', de, ate),
      y: topo(de) * TILE,
      properties: [{ name: 'sentido', type: 'int', value: sentido }],
    });
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
    tilesets: tilesetsEmbutidos(cais),
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
