/**
 * @file Guindaste: o Kiwi que estava montado numa viga e foi atravessado por ela (prensado
 * contra um teto) conta como esmagado e volta ao Checkpoint; pular por ela de baixo não conta.
 * A viga vira nas pontas do trajeto e, segurada no meio dele, fica travada e volta.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esmagadoNoGuindaste, moverViga, SEGUNDOS_MONTADO } from '../src/logica/guindaste.js';

/** Um corpo retangular, em pixels. */
function corpo(left, top, largura, altura) {
  return { left, top, right: left + largura, bottom: top + altura };
}

const VIGA = corpo(100, 200, 54, 8);
/** O Kiwi, 10×11, de pé sobre a viga. */
const MONTADO = corpo(120, 189, 10, 11);
/** O Kiwi com a viga entrando nele por baixo: algo o segurou enquanto ela subia. */
const ATRAVESSADO = corpo(120, 194, 10, 11);

test('o Kiwi de pé sobre a viga não está esmagado', () => {
  assert.equal(esmagadoNoGuindaste(MONTADO, [VIGA], 0), false);
});

test('a viga entrando no Kiwi que estava montado nela o esmaga', () => {
  assert.equal(esmagadoNoGuindaste(ATRAVESSADO, [VIGA], 0), true);
  assert.equal(esmagadoNoGuindaste(ATRAVESSADO, [VIGA], SEGUNDOS_MONTADO / 2), true);
});

test('atravessar a viga num pulo, sem ter montado nela, não esmaga', () => {
  assert.equal(esmagadoNoGuindaste(ATRAVESSADO, [VIGA], Infinity), false);
  assert.equal(esmagadoNoGuindaste(ATRAVESSADO, [VIGA], SEGUNDOS_MONTADO * 2), false);
});

test('a viga de outra coluna não esmaga o Kiwi', () => {
  const aoLado = corpo(200, 194, 10, 11);

  assert.equal(esmagadoNoGuindaste(aoLado, [VIGA], 0), false);
});

test('a viga segue no sentido em que anda e vira nas pontas do trajeto', () => {
  const trajeto = { minY: 100, maxY: 200 };

  assert.deepEqual(moverViga({ ...trajeto, y: 150, sentido: -1, parada: false }), { sentido: -1, travada: false });
  assert.deepEqual(moverViga({ ...trajeto, y: 100, sentido: -1, parada: false }), { sentido: 1, travada: false });
  assert.deepEqual(moverViga({ ...trajeto, y: 200, sentido: 1, parada: false }), { sentido: -1, travada: false });
});

test('a viga parada no meio do trajeto foi segurada por algo: está travada e volta', () => {
  assert.deepEqual(moverViga({ minY: 100, maxY: 200, y: 150, sentido: -1, parada: true }), { sentido: 1, travada: true });
});
