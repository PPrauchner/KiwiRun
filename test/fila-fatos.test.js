/**
 * @file Fila de Fatos: ordem, duração de cada Fato e parada enquanto pausada.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarFilaDeFatos, DURACAO_FATO } from '../src/logica/fila-fatos.js';

test('a fila vazia não mostra Fato', () => {
  assert.equal(criarFilaDeFatos().atual, null);
});

test('um Fato enfileirado aparece na hora', () => {
  const fila = criarFilaDeFatos();

  fila.enfileirar('fato.a');

  assert.equal(fila.atual, 'fato.a');
});

test('o Fato fica na tela pela duração e some depois dela', () => {
  const fila = criarFilaDeFatos({ duracao: 4 });
  fila.enfileirar('fato.a');

  fila.avancar(3.9);
  assert.equal(fila.atual, 'fato.a');

  fila.avancar(0.1);
  assert.equal(fila.atual, null);
});

test('a duração padrão é de cerca de 4 s', () => {
  assert.equal(DURACAO_FATO, 4);
});

test('dois Fatos seguidos aparecem um depois do outro, cada um pela duração inteira', () => {
  const fila = criarFilaDeFatos({ duracao: 4 });
  fila.enfileirar('fato.a');
  fila.avancar(1);
  fila.enfileirar('fato.b');

  fila.avancar(2.9);
  assert.equal(fila.atual, 'fato.a');

  fila.avancar(0.1);
  assert.equal(fila.atual, 'fato.b');

  fila.avancar(3.9);
  assert.equal(fila.atual, 'fato.b');
  fila.avancar(0.1);
  assert.equal(fila.atual, null);
});

test('um passo longo troca um Fato só; o seguinte começa do zero', () => {
  const fila = criarFilaDeFatos({ duracao: 4 });
  fila.enfileirar('fato.a');
  fila.enfileirar('fato.b');
  fila.enfileirar('fato.c');

  fila.avancar(5);

  assert.equal(fila.atual, 'fato.b');
  fila.avancar(4);
  assert.equal(fila.atual, 'fato.c');
});

test('pausada, a fila não corre; retomada, continua de onde parou', () => {
  const fila = criarFilaDeFatos({ duracao: 4 });
  fila.enfileirar('fato.a');
  fila.avancar(3);

  fila.pausar();
  fila.avancar(10);
  assert.equal(fila.atual, 'fato.a');

  fila.retomar();
  fila.avancar(1);
  assert.equal(fila.atual, null);
});
