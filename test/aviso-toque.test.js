/**
 * @file Aviso de toque, sem Phaser: aparece só quando nenhum ponteiro fino está disponível.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONSULTA_PONTEIRO_FINO, deveAvisarToque } from '../src/logica/aviso-toque.js';

/**
 * Um `matchMedia` que responde só à consulta do ponteiro fino.
 *
 * @param {boolean} temPonteiroFino - Se há mouse ou touchpad.
 * @returns {(consulta: string) => { matches: boolean }} O `matchMedia`.
 */
function matchMediaCom(temPonteiroFino) {
  return (consulta) => ({ matches: consulta === CONSULTA_PONTEIRO_FINO && temPonteiroFino });
}

test('a consulta é a de algum ponteiro fino', () => {
  assert.equal(CONSULTA_PONTEIRO_FINO, '(any-pointer: fine)');
});

test('num aparelho de toque, sem ponteiro fino, o aviso aparece', () => {
  assert.equal(deveAvisarToque(matchMediaCom(false)), true);
});

test('no computador, com mouse ou touchpad, o aviso não aparece', () => {
  assert.equal(deveAvisarToque(matchMediaCom(true)), false);
});

test('sem matchMedia, o aviso não aparece', () => {
  assert.equal(deveAvisarToque(undefined), false);
});
