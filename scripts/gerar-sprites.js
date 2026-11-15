/**
 * @file Gera os PNGs próprios na grade de 18×18: o sprite do Kiwi (faixa de quadros) e o
 * tileset provisório das Fases, desenhados por código numa paleta de pixel art.
 *
 * O tileset é provisório: dá lugar ao Kenney Pixel Platformer (CC0) quando o pacote
 * entrar no repositório. Sem dependências além do Node.
 *
 * Uso: `npm run gerar:sprites`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codificarPng } from './png.js';
import { COLUNAS, IMAGEM, QUANTIDADE, TILES } from './tileset.js';
import { TILE } from '../src/logica/pulo.js';

const RAIZ_REPO = fileURLToPath(new URL('..', import.meta.url));
export const IMAGEM_KIWI = 'assets/sprites/kiwi.png';

/** Paleta comum aos tiles e aos sprites. */
const COR = Object.freeze({
  grama: 0x6abe30,
  gramaEscura: 0x37946e,
  terra: 0x8f563b,
  terraEscura: 0x663931,
  madeira: 0xd9a066,
  vermelho: 0xd95763,
  cinza: 0xcbdbfc,
  branco: 0xffffff,
  folha: 0x4b692f,
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

/** @param {number} x @param {number} y @returns {boolean} Pinta um pontilhado irregular. */
const salpico = (x, y) => (x * 7 + y * 13) % 11 === 0;

/** @type {Record<keyof typeof TILES, Desenho>} */
const DESENHOS_TILES = {
  grama: (x, y) => {
    if (y < 4 || (y === 4 && x % 3 !== 0)) return y === 0 ? COR.grama : y < 3 ? COR.grama : COR.gramaEscura;
    return salpico(x, y) ? COR.terraEscura : COR.terra;
  },
  terra: (x, y) => (salpico(x, y) ? COR.terraEscura : COR.terra),
  plataforma: (x, y) => {
    if (y > 5) return null;
    if (y === 0 || y === 5 || x === 0 || x === TILE - 1) return COR.terra;
    return COR.madeira;
  },
  cerca: (x, y) => {
    const poste = (x >= 2 && x <= 3) || (x >= 14 && x <= 15);
    const travessa = y === 7 || y === 8 || y === 13 || y === 14;
    return y >= 4 && (poste || travessa) ? COR.madeira : null;
  },
  bandeira: (x, y) => {
    if (x >= 2 && x <= 3) return COR.cinza;
    if (y >= 1 && y <= 9 && x >= 4 && x - 4 <= 12 - Math.abs(y - 5) * 2) return COR.vermelho;
    return null;
  },
  nuvem: (x, y) => {
    const dentro = ((x - 9) / 8.5) ** 2 + ((y - 11) / 4.5) ** 2 <= 1 || ((x - 7) / 4.5) ** 2 + ((y - 7) / 4) ** 2 <= 1;
    return dentro ? (y > 13 ? COR.cinza : COR.branco) : null;
  },
  arbusto: (x, y) => {
    const dentro = ((x - 8.5) / 8) ** 2 + ((y - 18) / 9) ** 2 <= 1;
    return dentro ? (salpico(x, y) ? COR.grama : COR.folha) : null;
  },
  mastro: (x) => (x >= 2 && x <= 3 ? COR.cinza : null),
};

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
  const tiles = Object.entries(TILES).sort(([, a], [, b]) => a - b).map(([nome]) => DESENHOS_TILES[nome]);
  if (tiles.length !== QUANTIDADE) throw new Error(`o tileset declara ${QUANTIDADE} tiles e há ${tiles.length} desenhos`);
  await gravar(IMAGEM, montarGrade(tiles, COLUNAS));
  await gravar(IMAGEM_KIWI, montarGrade(QUADROS_KIWI.map((quadro) => quadro.desenho), QUADROS_KIWI.length));
  console.log(`Gerados ${IMAGEM} e ${IMAGEM_KIWI}`);
}
