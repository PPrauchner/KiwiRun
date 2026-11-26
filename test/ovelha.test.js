/**
 * @file Ovelha: o Kiwi prensado em cima de uma Ovelha por tempo demais volta ao Checkpoint.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarVigiaPreso, SEGUNDOS_PRESO } from '../src/logica/ovelha.js';

const PASSO = 1 / 60;

/** Avança o vigia `segundos` em passos de 1/60 s com o mesmo estado; diz se ficou preso em algum. */
function avancar(vigia, segundos, prensado) {
  let preso = false;
  for (let t = 0; t < segundos; t += PASSO) preso = vigia.atualizar(PASSO, prensado) || preso;
  return preso;
}

test('o Kiwi prensado sobre uma Ovelha por mais que o limite fica preso', () => {
  const vigia = criarVigiaPreso();

  assert.equal(avancar(vigia, SEGUNDOS_PRESO / 2, true), false);
  assert.equal(avancar(vigia, SEGUNDOS_PRESO, true), true);
});

test('soltar-se antes do limite zera a contagem', () => {
  const vigia = criarVigiaPreso();

  avancar(vigia, SEGUNDOS_PRESO * 0.8, true);
  vigia.atualizar(PASSO, false);

  assert.equal(avancar(vigia, SEGUNDOS_PRESO * 0.8, true), false);
});

test('depois de avisar que está preso, o vigia recomeça do zero', () => {
  const vigia = criarVigiaPreso();

  avancar(vigia, SEGUNDOS_PRESO * 1.1, true);

  assert.equal(vigia.atualizar(PASSO, true), false);
});
