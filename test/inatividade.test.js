/**
 * @file Inatividade: o aviso nos últimos segundos e a Volta por inatividade, sem Phaser.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avaliarInatividade, SEGUNDOS_AVISO, SEGUNDOS_VOLTA } from '../src/logica/inatividade.js';
import { criarInput } from '../src/logica/input.js';

/** Um gamepad `standard` parado, com os eixos dados. */
function gamepadComEixos(eixos) {
  return { mapping: 'standard', axes: eixos, buttons: Array.from({ length: 16 }, () => ({ pressed: false })) };
}

/** Deixa o Input parado por `segundos`, em quadros de 1 s, com o estado dado. */
function esperar(input, segundos, { teclas = [], gamepads = [] } = {}) {
  for (let decorrido = 0; decorrido < segundos; decorrido += 1) input.atualizar({ teclas: new Set(teclas), gamepads }, 1);
}

test('a Volta é aos 60 s e o aviso, nos últimos 10', () => {
  assert.equal(SEGUNDOS_VOLTA, 60);
  assert.equal(SEGUNDOS_AVISO, 10);
});

test('antes dos 50 s sem input não há aviso nem Volta', () => {
  assert.deepEqual(avaliarInatividade(0), { contagem: null, volta: false });
  assert.deepEqual(avaliarInatividade(49.9), { contagem: null, volta: false });
});

test('aos 50 s o aviso aparece e conta 10, 9… até 1', () => {
  assert.deepEqual(avaliarInatividade(50), { contagem: 10, volta: false });
  assert.equal(avaliarInatividade(50.5).contagem, 10);
  assert.equal(avaliarInatividade(51).contagem, 9);
  assert.equal(avaliarInatividade(59.9).contagem, 1);
});

test('aos 60 s é a Volta, sem aviso', () => {
  assert.deepEqual(avaliarInatividade(60), { contagem: null, volta: true });
  assert.deepEqual(avaliarInatividade(75), { contagem: null, volta: true });
});

test('os tempos da Volta e do aviso são injetáveis', () => {
  const tempos = { segundosVolta: 3, segundosAviso: 2 };

  assert.equal(avaliarInatividade(0.9, tempos).contagem, null);
  assert.equal(avaliarInatividade(1, tempos).contagem, 2);
  assert.equal(avaliarInatividade(3, tempos).volta, true);
});

test('qualquer input cancela o aviso', () => {
  const input = criarInput();
  esperar(input, 55);
  assert.equal(avaliarInatividade(input.segundosSemInput).contagem, 5);

  input.atualizar({ teclas: new Set(['Space']), gamepads: [] }, 1 / 60);
  assert.deepEqual(avaliarInatividade(input.segundosSemInput), { contagem: null, volta: false });
});

test('deriva de analógico não conta como input: a Volta acontece', () => {
  const input = criarInput();
  esperar(input, SEGUNDOS_VOLTA, { gamepads: [gamepadComEixos([0.2, -0.15, 0, 0])] });

  assert.equal(avaliarInatividade(input.segundosSemInput).volta, true);
});
