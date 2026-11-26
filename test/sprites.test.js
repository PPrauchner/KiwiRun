/**
 * @file Os PNGs do jogo estão na grade de 18×18 que o mapa e a cena esperam: o tileset do
 * Kenney (CC0, com a licença versionada) e os sprites do Kiwi e dos Itens gerados por script.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TILE } from '../src/logica/pulo.js';
import { COLUNAS, IMAGEM, LICENCA, QUANTIDADE } from '../scripts/tileset.js';
import { IMAGEM_BOTOES, IMAGEM_OVELHA, IMAGEM_SAMAMBAIA, QUADROS_KIWI } from '../scripts/gerar-sprites.js';
import { BOTOES, BOTOES_DA_ACAO } from '../src/logica/placa.js';
import { MUNDOS, PREDADORES, imagemItem, imagemPredador } from '../src/logica/catalogo.js';

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

test('todo Item que o catálogo declara tem seu sprite 18×18 gerado', async () => {
  const itens = MUNDOS.flatMap((mundo) => mundo.fases).flatMap((fase) => fase.itens);

  for (const item of itens) {
    const { largura, altura } = await dimensoes(imagemItem(item));
    assert.deepEqual([largura, altura], [TILE, TILE], item);
  }
});

test('a Samambaia-prateada tem seu sprite 18×18 gerado', async () => {
  const { largura, altura } = await dimensoes(IMAGEM_SAMAMBAIA);

  assert.deepEqual([largura, altura], [TILE, TILE]);
});

test('toda espécie de Predador do catálogo tem seu sprite 18×18 gerado', async () => {
  for (const especie of PREDADORES) {
    const { largura, altura } = await dimensoes(imagemPredador(especie));
    assert.deepEqual([largura, altura], [TILE, TILE], especie);
  }
});

test('a Ovelha tem seu sprite 18×18 gerado', async () => {
  const { largura, altura } = await dimensoes(IMAGEM_OVELHA);

  assert.deepEqual([largura, altura], [TILE, TILE]);
});

test('os ícones de botão das Placas são uma faixa de quadros 18×18, um por botão', async () => {
  const { largura, altura } = await dimensoes(IMAGEM_BOTOES);

  assert.deepEqual([largura, altura], [BOTOES.length * TILE, TILE]);
  for (const botoes of Object.values(BOTOES_DA_ACAO)) {
    for (const botao of botoes) assert.ok(BOTOES.includes(botao), botao);
  }
});
