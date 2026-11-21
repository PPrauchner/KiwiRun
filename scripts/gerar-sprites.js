/**
 * @file Gera os PNGs próprios na grade de 18×18: o sprite do Kiwi (faixa de quadros) e
 * um sprite por Item, desenhados por código numa paleta de pixel art. Os tiles vêm do Kenney Pixel
 * Platformer (CC0). Sem dependências além do Node.
 *
 * Uso: `npm run gerar:sprites`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codificarPng } from './png.js';
import { TILE } from '../src/logica/pulo.js';
import { imagemItem } from '../src/logica/catalogo.js';

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
}
