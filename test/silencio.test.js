/**
 * @file Silêncio sobre um armazenamento injetável, sem Phaser.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarSilencio } from '../src/logica/silencio.js';

/**
 * Um armazenamento em memória com a interface do `localStorage` que o Silêncio usa.
 *
 * @param {Record<string, string>} [inicial] - Entradas já gravadas.
 * @returns {Storage} O armazenamento.
 */
function armazenamentoEmMemoria(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, String(valor)),
  };
}

test('sem nada gravado, o jogo começa com som', () => {
  assert.equal(criarSilencio(armazenamentoEmMemoria()).ligado, false);
});

test('ligar o Silêncio persiste para a próxima abertura do jogo', () => {
  const armazenamento = armazenamentoEmMemoria();

  assert.equal(criarSilencio(armazenamento).alternar(), true);

  assert.equal(criarSilencio(armazenamento).ligado, true);
});

test('alternar de novo devolve o som, também na próxima abertura', () => {
  const armazenamento = armazenamentoEmMemoria();
  const silencio = criarSilencio(armazenamento);
  silencio.alternar();

  assert.equal(silencio.alternar(), false);

  assert.equal(silencio.ligado, false);
  assert.equal(criarSilencio(armazenamento).ligado, false);
});

test('um valor gravado ilegível conta como som ligado', () => {
  assert.equal(criarSilencio(armazenamentoEmMemoria({ 'kiwirun:v1:silencio': 'talvez' })).ligado, false);
});

test('sem armazenamento, ou com um que recusa, o Silêncio vale só em memória', () => {
  const recusa = {
    getItem: () => {
      throw new Error('bloqueado');
    },
    setItem: () => {
      throw new Error('cheio');
    },
  };

  for (const armazenamento of [null, recusa]) {
    const silencio = criarSilencio(armazenamento);
    assert.equal(silencio.ligado, false);
    assert.equal(silencio.alternar(), true);
    assert.equal(silencio.ligado, true);
  }
});
