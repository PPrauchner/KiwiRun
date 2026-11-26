/**
 * @file Captura: o contato do Kiwi com um Predador vira Captura (caindo por cima), volta ao
 * Checkpoint (de lado ou por baixo) ou nada (de lado, invulnerável).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolverContato } from '../src/logica/captura.js';

const TOPO = 100;

test('caindo sobre o Predador, com os pés acima do topo dele, é Captura', () => {
  assert.equal(resolverContato({ vy: 200, baseAnterior: TOPO - 2, topoPredador: TOPO, invulneravel: false }), 'captura');
});

test('encostar de lado devolve o Kiwi ao Checkpoint', () => {
  assert.equal(resolverContato({ vy: 0, baseAnterior: TOPO + 10, topoPredador: TOPO, invulneravel: false }), 'checkpoint');
});

test('caindo mas já abaixo do topo do Predador é contato lateral, não Captura', () => {
  assert.equal(resolverContato({ vy: 200, baseAnterior: TOPO + 10, topoPredador: TOPO, invulneravel: false }), 'checkpoint');
});

test('subindo por baixo do Predador devolve o Kiwi ao Checkpoint', () => {
  assert.equal(resolverContato({ vy: -300, baseAnterior: TOPO + 20, topoPredador: TOPO, invulneravel: false }), 'checkpoint');
});

test('invulnerável, o contato lateral atravessa sem efeito', () => {
  assert.equal(resolverContato({ vy: 0, baseAnterior: TOPO + 10, topoPredador: TOPO, invulneravel: true }), 'nada');
});

test('invulnerável, cair sobre o Predador ainda é Captura', () => {
  assert.equal(resolverContato({ vy: 200, baseAnterior: TOPO, topoPredador: TOPO, invulneravel: true }), 'captura');
});
