/**
 * @file Cronômetro do Tempo gasto: começa no primeiro input, pausa, para no fim e zera.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarCronometro, formatarTempo } from '../src/logica/cronometro.js';

test('antes do primeiro input o cronômetro fica em zero', () => {
  const cronometro = criarCronometro();

  cronometro.avancar(1.5);

  assert.equal(cronometro.segundos, 0);
  assert.equal(cronometro.iniciado, false);
});

test('o primeiro input dá a partida e o tempo passa a contar', () => {
  const cronometro = criarCronometro();

  cronometro.avancar(3);
  cronometro.registrarInput();
  cronometro.avancar(0.5);
  cronometro.registrarInput();
  cronometro.avancar(0.25);

  assert.equal(cronometro.iniciado, true);
  assert.equal(cronometro.segundos, 0.75);
});

test('pausado, o cronômetro não conta; ao retomar, segue de onde parou', () => {
  const cronometro = criarCronometro();
  cronometro.registrarInput();
  cronometro.avancar(1);

  cronometro.pausar();
  cronometro.avancar(5);
  cronometro.retomar();
  cronometro.avancar(1);

  assert.equal(cronometro.segundos, 2);
});

test('ao tocar o fim, o cronômetro para e nem um novo input o faz voltar a contar', () => {
  const cronometro = criarCronometro();
  cronometro.registrarInput();
  cronometro.avancar(4);

  cronometro.parar();
  cronometro.avancar(2);
  cronometro.registrarInput();
  cronometro.retomar();
  cronometro.avancar(2);

  assert.equal(cronometro.segundos, 4);
});

test('ao reiniciar, o cronômetro zera e espera de novo o primeiro input', () => {
  const cronometro = criarCronometro();
  cronometro.registrarInput();
  cronometro.avancar(4);
  cronometro.parar();

  cronometro.zerar();
  cronometro.avancar(1);

  assert.equal(cronometro.segundos, 0);
  assert.equal(cronometro.iniciado, false);
  cronometro.registrarInput();
  cronometro.avancar(1);
  assert.equal(cronometro.segundos, 1);
});

test('o Tempo gasto aparece em segundos abaixo de 60 s e em minutos depois, truncado no décimo', () => {
  assert.equal(formatarTempo(0), '0.0 s');
  assert.equal(formatarTempo(7.49), '7.4 s');
  assert.equal(formatarTempo(59.99), '59.9 s');
  assert.equal(formatarTempo(65.99), '1:05.9');
});

test('o Tempo gasto pode sair com o separador decimal do idioma', () => {
  assert.equal(formatarTempo(65.99, ','), '1:05,9');
  assert.equal(formatarTempo(65.99, '.'), '1:05.9');
});
