/**
 * @file Gera os PNGs próprios na grade de 18×18: o sprite do Kiwi (faixa de quadros),
 * um sprite por Item, o da Samambaia-prateada, um por espécie de Predador, o da Ovelha, os ícones de botão das Placas e o do Silêncio (som cortado), desenhados por código numa paleta de pixel art. Os tiles vêm do Kenney Pixel
 * Platformer (CC0). Sem dependências além do Node.
 *
 * Uso: `npm run gerar:sprites`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codificarPng } from './png.js';
import { TILE } from '../src/logica/pulo.js';
import { imagemItem, imagemPredador } from '../src/logica/catalogo.js';
import { BOTOES } from '../src/logica/placa.js';

const RAIZ_REPO = fileURLToPath(new URL('..', import.meta.url));
export const IMAGEM_KIWI = 'assets/sprites/kiwi.png';

/** Paleta do Kiwi. */
const COR = Object.freeze({
  plumagem: 0x8f563b,
  plumagemEscura: 0x45283c,
  bico: 0xeec39a,
  olho: 0x222034,
  perna: 0xd9a066,
});

/**
 * Um desenho de 18×18: devolve a cor de cada pixel, ou null para transparente.
 *
 * @typedef {(x: number, y: number) => number | null} Desenho
 */

/**
 * Desenha um quadro do Kiwi virado para a direita: corpo redondo, bico longo e pernas.
 *
 * @param {number[]} pernas - Deslocamento horizontal de cada perna; vazio recolhe as pernas.
 * @returns {Desenho} O quadro.
 */
function quadroKiwi(pernas) {
  return (x, y) => {
    const corpo = ((x - 7.5) / 6.5) ** 2 + ((y - 10) / 5) ** 2;
    if (x === 12 && y === 8) return COR.olho;
    if (corpo <= 0.75) return COR.plumagem;
    if (corpo <= 1) return COR.plumagemEscura;
    const bico = x >= 14 && x <= 17 && y === 9 + Math.floor((x - 14) / 2);
    if (bico) return COR.bico;
    const perna = pernas.some((dx) => x === 6 + dx || x === 10 + dx);
    if (perna && y >= 15) return COR.perna;
    return null;
  };
}

/** Quadros do Kiwi, na ordem da faixa: parado, andando (2) e no ar. */
export const QUADROS_KIWI = Object.freeze([
  { nome: 'parado', desenho: quadroKiwi([0]) },
  { nome: 'andar1', desenho: quadroKiwi([-1]) },
  { nome: 'andar2', desenho: quadroKiwi([1]) },
  { nome: 'pulo', desenho: quadroKiwi([]) },
]);

/** Paleta dos Itens. */
const COR_ITEM = Object.freeze({
  contorno: 0x595652,
  branco: 0xffffff,
  sombra: 0xcbdbfc,
  vidro: 0x9badb7,
  tampa: 0x5b6ee1,
});

/** Círculos que formam o tufo de lã: centro e raio, em pixels. */
const TUFOS_LA = Object.freeze([[6, 9, 4], [11, 7, 4], [12, 12, 4], [7, 13, 3.5]]);

/**
 * Tufo de lã: nuvem de círculos brancos, com sombra embaixo e contorno.
 *
 * @type {Desenho}
 */
function desenhoLa(x, y) {
  const folga = Math.min(...TUFOS_LA.map(([cx, cy, raio]) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - raio));
  if (folga > 0) return null;
  if (folga > -1) return COR_ITEM.contorno;
  return y >= 12 ? COR_ITEM.sombra : COR_ITEM.branco;
}

/**
 * Garrafa de leite: tampa azul, gargalo de vidro e corpo cheio de leite.
 *
 * @type {Desenho}
 */
function desenhoLeite(x, y) {
  const gargalo = x >= 7 && x <= 10 && y >= 1 && y <= 5;
  const corpo = x >= 5 && x <= 12 && y >= 6 && y <= 16;
  if (!gargalo && !corpo) return null;
  const borda = gargalo
    ? x === 7 || x === 10 || y === 1
    : x === 5 || x === 12 || y === 16 || (y === 6 && (x < 7 || x > 10));
  if (borda) return COR_ITEM.contorno;
  if (y <= 2) return COR_ITEM.tampa;
  if (y <= 6) return COR_ITEM.vidro;
  if (y === 11) return COR_ITEM.tampa;
  return x === 6 ? COR_ITEM.sombra : COR_ITEM.branco;
}

/** Desenho de cada Item, pelo id do catálogo. */
export const DESENHOS_ITENS = Object.freeze({ la: desenhoLa, leite: desenhoLeite });

export const IMAGEM_SAMAMBAIA = 'assets/sprites/samambaia.png';

/** Paleta da Samambaia-prateada: o verso prateado da folha, que dá nome à planta. */
const COR_SAMAMBAIA = Object.freeze({
  folha: 0xe4ecf2,
  borda: 0x9badb7,
  haste: 0x6a8a3a,
});

/** Colunas da haste e linhas onde a fronde começa e termina. */
const HASTE_X = 9;
const FRONDE_TOPO = 1;
const FRONDE_BASE = 15;

/**
 * Samambaia-prateada: uma fronde de haste reta com folíolos que sobem em diagonal e
 * encurtam para a ponta, prateados com a ponta mais escura.
 *
 * @type {Desenho}
 */
function desenhoSamambaia(x, y) {
  const distancia = Math.abs(x - HASTE_X);
  if (distancia === 0) return y >= FRONDE_TOPO && y <= 17 ? COR_SAMAMBAIA.haste : null;
  // O folíolo sobe um pixel a cada dois que se afasta da haste.
  const linha = y + Math.floor(distancia / 2);
  if (linha % 2 === 0 || linha < FRONDE_TOPO + 2 || linha > FRONDE_BASE) return null;
  const comprimento = Math.min(6, Math.floor((linha - FRONDE_TOPO) / 2));
  if (distancia > comprimento) return null;
  return distancia === comprimento ? COR_SAMAMBAIA.borda : COR_SAMAMBAIA.folha;
}

/**
 * @typedef {Object} FormaPredador
 * Um Predador visto de lado, virado para a direita: elipses em pixels (centro e raios).
 * @property {{ pelo: number, barriga: number, escura: number, nariz: number, cauda: number }} cores
 * @property {[number, number, number, number]} corpo - cx, cy, rx, ry.
 * @property {[number, number, number, number]} cabeca - cx, cy, rx, ry.
 * @property {[number, number, number]} orelha - cx, cy, raio.
 * @property {[number, number]} olho
 * @property {[number, number]} nariz
 * @property {number[]} pernas - Colunas das pernas, que descem até a base do quadro.
 * @property {number} topoPernas - Linha onde as pernas começam.
 * @property {(x: number, y: number) => boolean} cauda - Se o pixel é da cauda.
 */

/**
 * Se o centro do pixel está dentro da elipse.
 *
 * @param {number} x
 * @param {number} y
 * @param {number[]} elipse - cx, cy, rx, ry.
 * @returns {boolean} Se está dentro.
 */
function naElipse(x, y, [cx, cy, rx, ry]) {
  return ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
}

/**
 * Desenha um Predador a partir da sua forma: corpo e cabeça de pelo, barriga clara embaixo,
 * orelha, olho, nariz, pernas e cauda.
 *
 * @param {FormaPredador} forma - A forma da espécie.
 * @returns {Desenho} O desenho.
 */
function desenhoPredador(forma) {
  const { cores, corpo, cabeca, orelha, olho, nariz, pernas, topoPernas, cauda } = forma;
  return (x, y) => {
    if (x === olho[0] && y === olho[1]) return COR.olho;
    if (x === nariz[0] && y === nariz[1]) return cores.nariz;
    if (naElipse(x, y, cabeca)) return cores.pelo;
    if (naElipse(x, y, corpo)) return y + 0.5 > corpo[1] + corpo[3] / 3 ? cores.barriga : cores.pelo;
    if (naElipse(x, y, [orelha[0], orelha[1], orelha[2], orelha[2]])) return cores.escura;
    if (pernas.includes(x) && y >= topoPernas) return cores.escura;
    if (cauda(x, y)) return cores.cauda;
    return null;
  };
}

/** Forma de cada espécie de Predador, pelo id do catálogo. */
const FORMAS_PREDADORES = Object.freeze({
  // Arminho: comprido e baixo, dorso castanho, barriga creme e ponta da cauda preta.
  arminho: {
    cores: { pelo: 0x8a5a32, barriga: 0xf0dcb0, escura: 0x45283c, nariz: 0x222034, cauda: 0x222034 },
    corpo: [8, 12, 6.5, 2.8],
    cabeca: [14.5, 10.5, 3, 2.4],
    orelha: [13, 8, 1],
    olho: [15, 10],
    nariz: [17, 11],
    pernas: [4, 5, 11, 12],
    topoPernas: 14,
    cauda: (x, y) => x <= 2 && (y === 10 || y === 11),
  },
  // Gambá-australiano: redondo, cinza, orelhas grandes, nariz rosa e cauda cheia escura.
  gamba: {
    cores: { pelo: 0x8b8f99, barriga: 0xd8d8d8, escura: 0x3f3f4a, nariz: 0xd77bba, cauda: 0x3f3f4a },
    corpo: [9.5, 11.5, 6, 4],
    cabeca: [14.5, 9, 3, 2.8],
    orelha: [13, 5.5, 1.5],
    olho: [15, 8],
    nariz: [17, 9],
    pernas: [6, 7, 12, 13],
    topoPernas: 15,
    cauda: (x, y) => naElipse(x, y, [2.5, 9, 2.5, 3.5]),
  },
  // Rato: pequeno, pardo-acinzentado, orelha rosada e cauda fina e comprida.
  rato: {
    cores: { pelo: 0x6e6460, barriga: 0xb3a8a0, escura: 0xc98c8c, nariz: 0xd77bba, cauda: 0xc98c8c },
    corpo: [9.5, 12.5, 5, 3],
    cabeca: [14, 11, 3, 2.4],
    orelha: [12.5, 8.5, 1.5],
    olho: [15, 10],
    nariz: [17, 11],
    pernas: [7, 12],
    topoPernas: 15,
    cauda: (x, y) => x <= 4 && y === 13 + Math.floor((4 - x) / 2),
  },
});

/** Desenho de cada espécie de Predador, pelo id do catálogo. */
export const DESENHOS_PREDADORES = Object.freeze(
  Object.fromEntries(Object.entries(FORMAS_PREDADORES).map(([especie, forma]) => [especie, desenhoPredador(forma)])),
);

export const IMAGEM_OVELHA = 'assets/sprites/ovelha.png';

/** Paleta da Ovelha: lã clara com sombra, cara e patas escuras. */
const COR_OVELHA = Object.freeze({
  la: 0xf4f0e6,
  sombra: 0xcbc3b4,
  contorno: 0x595652,
  cara: 0x3f3f4a,
});

/** Círculos que formam o velo da Ovelha: centro e raio, em pixels. */
const VELO_OVELHA = Object.freeze([[5, 9, 4], [9, 8, 4.5], [12, 10, 3.5], [7, 12, 3.5], [11, 12, 3.5]]);

/**
 * Ovelha virada para a direita: velo de círculos com o topo plano onde o Kiwi pisa, cara
 * escura à frente e quatro patas.
 *
 * @type {Desenho}
 */
function desenhoOvelha(x, y) {
  if (x === 16 && y === 8) return COR.olho;
  if (naElipse(x, y, [15.5, 9.5, 2.5, 3])) return COR_OVELHA.cara;
  if ([4, 6, 10, 12].includes(x) && y >= 14) return COR_OVELHA.cara;
  const folga = Math.min(...VELO_OVELHA.map(([cx, cy, raio]) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - raio));
  if (folga > 0 || y < 5) return null;
  if (folga > -1 || y === 5) return COR_OVELHA.contorno;
  return y >= 12 ? COR_OVELHA.sombra : COR_OVELHA.la;
}

export const IMAGEM_BOTOES = 'assets/sprites/botoes.png';

/** Paleta dos ícones de botão das Placas. */
const COR_BOTAO = Object.freeze({
  contorno: 0x222034,
  tecla: 0xd8d8d8,
  teclaLado: 0x8b8f99,
  botao: 0xac3232,
  simbolo: 0xffffff,
});

/** A letra "A" em pixels, 5×6, para o botão do 8BitDo. */
const LETRA_A = Object.freeze(['.###.', '#...#', '#...#', '#####', '#...#', '#...#']);

/**
 * Tecla de espaço: tecla clara de lado escuro, com o símbolo ␣ no meio.
 *
 * @type {Desenho}
 */
function desenhoTeclaEspaco(x, y) {
  if (x < 1 || x > 16 || y < 3 || y > 15) return null;
  const canto = (x === 1 || x === 16) && (y === 3 || y === 15);
  if (canto) return null;
  if (x === 1 || x === 16 || y === 3 || y === 15) return COR_BOTAO.contorno;
  if (y >= 13) return COR_BOTAO.teclaLado;
  const simbolo = (y === 10 && x >= 5 && x <= 12) || ((x === 5 || x === 12) && y >= 8 && y <= 10);
  return simbolo ? COR_BOTAO.contorno : COR_BOTAO.tecla;
}

/**
 * Botão A do 8BitDo: botão redondo com a letra A clara.
 *
 * @type {Desenho}
 */
function desenhoBotaoA(x, y) {
  const distancia = Math.hypot(x + 0.5 - 9, y + 0.5 - 9);
  if (distancia > 8) return null;
  if (distancia > 7) return COR_BOTAO.contorno;
  const linhaLetra = LETRA_A[y - 6];
  return linhaLetra?.[x - 7] === '#' ? COR_BOTAO.simbolo : COR_BOTAO.botao;
}

/** Desenho de cada ícone de botão, pelo nome do quadro. */
const DESENHOS_BOTOES = Object.freeze({ espaco: desenhoTeclaEspaco, a: desenhoBotaoA });

export const IMAGEM_SILENCIO = 'assets/sprites/silencio.png';

/** Paleta do ícone do Silêncio: alto-falante claro de contorno escuro e um X vermelho. */
const COR_SILENCIO = Object.freeze({
  contorno: 0x222034,
  alto: 0xd8d8d8,
  corte: 0xac3232,
});

/**
 * @param {number} x
 * @param {number} y
 * @returns {boolean} Se o pixel é do alto-falante: a caixa e o cone que se abre à direita.
 */
function noAltoFalante(x, y) {
  const caixa = x >= 2 && x <= 5 && y >= 6 && y <= 11;
  const cone = x >= 6 && x <= 10 && y >= 11 - x && y <= x + 6;
  return caixa || cone;
}

/**
 * Som cortado: o alto-falante com um X vermelho à direita, onde sairiam as ondas.
 *
 * @type {Desenho}
 */
function desenhoSilencio(x, y) {
  if (noAltoFalante(x, y)) {
    const borda = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !noAltoFalante(x + dx, y + dy));
    return borda ? COR_SILENCIO.contorno : COR_SILENCIO.alto;
  }
  const naFaixa = x >= 12 && x <= 16 && y >= 6 && y <= 10;
  return naFaixa && (x - 12 === y - 6 || x - 12 === 10 - y) ? COR_SILENCIO.corte : null;
}

/**
 * Junta desenhos 18×18 numa grade, da esquerda para a direita e de cima para baixo.
 *
 * @param {Desenho[]} desenhos - Os quadros, em ordem.
 * @param {number} colunas - Quadros por linha.
 * @returns {Buffer} O PNG da grade.
 */
function montarGrade(desenhos, colunas) {
  const linhas = Math.ceil(desenhos.length / colunas);
  return codificarPng(colunas * TILE, linhas * TILE, (x, y) => {
    const desenho = desenhos[Math.floor(y / TILE) * colunas + Math.floor(x / TILE)];
    return desenho ? desenho(x % TILE, y % TILE) : null;
  });
}

/**
 * Grava um arquivo a partir da raiz do repositório, criando a pasta.
 *
 * @param {string} caminho - Caminho relativo à raiz.
 * @param {Buffer} conteudo - Os bytes.
 * @returns {Promise<void>}
 */
async function gravar(caminho, conteudo) {
  const destino = `${RAIZ_REPO}${caminho}`;
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, conteudo);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await gravar(IMAGEM_KIWI, montarGrade(QUADROS_KIWI.map((quadro) => quadro.desenho), QUADROS_KIWI.length));
  console.log(`Gerado ${IMAGEM_KIWI}`);
  for (const [item, desenho] of Object.entries(DESENHOS_ITENS)) {
    await gravar(imagemItem(item), montarGrade([desenho], 1));
    console.log(`Gerado ${imagemItem(item)}`);
  }
  await gravar(IMAGEM_SAMAMBAIA, montarGrade([desenhoSamambaia], 1));
  console.log(`Gerado ${IMAGEM_SAMAMBAIA}`);
  for (const [especie, desenho] of Object.entries(DESENHOS_PREDADORES)) {
    await gravar(imagemPredador(especie), montarGrade([desenho], 1));
    console.log(`Gerado ${imagemPredador(especie)}`);
  }
  await gravar(IMAGEM_OVELHA, montarGrade([desenhoOvelha], 1));
  console.log(`Gerado ${IMAGEM_OVELHA}`);
  await gravar(IMAGEM_BOTOES, montarGrade(BOTOES.map((botao) => DESENHOS_BOTOES[botao]), BOTOES.length));
  console.log(`Gerado ${IMAGEM_BOTOES}`);
  await gravar(IMAGEM_SILENCIO, montarGrade([desenhoSilencio], 1));
  console.log(`Gerado ${IMAGEM_SILENCIO}`);
}
