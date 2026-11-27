/**
 * @file Pulinho: o arminho dá um pulinho quando o Kiwi chega perto, um por aproximação.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarPulinho } from '../src/logica/pulinho.js';

const PULINHO = { alcance: 50, altura: 10, segundos: 0.4 };
const PASSO = 1 / 60;
const LONGE = 200;
const PERTO = 30;

/**
 * Avança o pulinho por vários passos com o Kiwi à mesma distância.
 *
 * @param {ReturnType<typeof criarPulinho>} pulinho - O pulinho.
 * @param {number} distancia - Distância horizontal até o Kiwi, em pixels.
 * @param {number} segundos - Por quanto tempo.
 * @returns {number[]} A altura a cada passo.
 */
function avancarPor(pulinho, distancia, segundos) {
  const alturas = [];
  for (let t = 0; t < segundos; t += PASSO) alturas.push(pulinho.avancar(distancia, PASSO));
  return alturas;
}

test('com o Kiwi longe, o arminho fica no chão', () => {
  assert.ok(avancarPor(criarPulinho(PULINHO), LONGE, 1).every((altura) => altura === 0));
});

test('quando o Kiwi chega perto, o arminho sobe até a altura do pulinho e volta ao chão', () => {
  const alturas = avancarPor(criarPulinho(PULINHO), PERTO, PULINHO.segundos + 0.1);
  const maxima = Math.max(...alturas);
  assert.ok(maxima > PULINHO.altura * 0.9 && maxima <= PULINHO.altura, `subiu ${maxima}`);
  assert.equal(alturas.at(-1), 0);
});

test('o Kiwi parado perto não faz o arminho pular de novo', () => {
  const pulinho = criarPulinho(PULINHO);
  avancarPor(pulinho, PERTO, PULINHO.segundos + 0.1);
  assert.ok(avancarPor(pulinho, PERTO, 1).every((altura) => altura === 0));
});

test('o Kiwi que se afasta e volta faz o arminho pular de novo', () => {
  const pulinho = criarPulinho(PULINHO);
  avancarPor(pulinho, PERTO, PULINHO.segundos + 0.1);
  avancarPor(pulinho, LONGE, 0.1);
  assert.ok(Math.max(...avancarPor(pulinho, PERTO, PULINHO.segundos)) > 0);
});

test('o Kiwi do outro lado conta pela distância, não pelo sinal', () => {
  assert.ok(Math.max(...avancarPor(criarPulinho(PULINHO), -PERTO, PULINHO.segundos)) > 0);
});
