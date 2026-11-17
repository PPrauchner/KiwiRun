/**
 * @file Os PNGs do jogo estão na grade de 18×18 que o mapa e a cena esperam: o tileset do
 * Kenney (CC0, com a licença versionada) e o sprite do Kiwi gerado por script.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TILE } from '../src/logica/pulo.js';
import { COLUNAS, IMAGEM, LICENCA, QUANTIDADE } from '../scripts/tileset.js';
import { QUADROS_KIWI } from '../scripts/gerar-sprites.js';

/**
 * Lê largura e altura do cabeçalho de um PNG.
 *
 * @param {string} caminho - Caminho a partir da raiz do repositório.
 * @returns {Promise<{ largura: number, altura: number }>} As dimensões.
 */
async function dimensoes(caminho) {
  const png = await readFile(new URL(`../${caminho}`, import.meta.url));
  return { largura: png.readUInt32BE(16), altura: png.readUInt32BE(20) };
}

test('o tileset tem todas as colunas e linhas de tiles 18×18 que o mapa declara', async () => {
  const { largura, altura } = await dimensoes(IMAGEM);

  assert.equal(largura, COLUNAS * TILE);
  assert.equal(altura, Math.ceil(QUANTIDADE / COLUNAS) * TILE);
});

test('o tileset Kenney vem com a licença CC0 versionada', async () => {
  const licenca = await readFile(new URL(`../${LICENCA}`, import.meta.url), 'utf8');

  assert.match(licenca, /Kenney/);
  assert.match(licenca, /CC0/);
});

test('o sprite do Kiwi é uma faixa de quadros 18×18', async () => {
  const { largura, altura } = await dimensoes('assets/sprites/kiwi.png');

  assert.equal(altura, TILE);
  assert.equal(largura, QUADROS_KIWI.length * TILE);
});
