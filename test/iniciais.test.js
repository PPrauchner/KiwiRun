/**
 * @file Iniciais de um Novo Recorde: 3 letras A–Z, sem Phaser.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarDigitacao, criarIniciais, separarDigitacao } from '../src/logica/iniciais.js';
import { criarInput, SEGUNDOS_BLOQUEIO } from '../src/logica/input.js';

/** Ações de um quadro sem nada apertado, no formato do Input unificado. */
const PARADO = Object.freeze({ horizontal: 0, vertical: 0, confirmar: false, voltar: false, silenciar: false });

/**
 * Um quadro com o aperto seguido de um quadro solto: um toque.
 *
 * @param {ReturnType<typeof criarIniciais>} iniciais - As Iniciais.
 * @param {Partial<typeof PARADO>} acoes - O que muda no quadro do toque.
 * @param {string[]} [digitadas] - Letras digitadas no quadro do toque.
 * @returns {string | null} As Iniciais gravadas no toque, se gravou.
 */
function tocar(iniciais, acoes, digitadas = []) {
  const gravadas = iniciais.atualizar({ ...PARADO, ...acoes }, digitadas);
  iniciais.atualizar(PARADO, []);
  return gravadas;
}

test('as Iniciais começam em "AAA" com o cursor na primeira letra', () => {
  const iniciais = criarIniciais();

  assert.equal(iniciais.letras, 'AAA');
  assert.equal(iniciais.posicao, 0);
});

test('cima e baixo trocam a letra sob o cursor, dando a volta entre A e Z', () => {
  const iniciais = criarIniciais();

  tocar(iniciais, { vertical: -1 });
  tocar(iniciais, { vertical: -1 });
  assert.equal(iniciais.letras, 'CAA');
  tocar(iniciais, { vertical: 1 });
  tocar(iniciais, { vertical: 1 });
  tocar(iniciais, { vertical: 1 });
  assert.equal(iniciais.letras, 'ZAA');
  tocar(iniciais, { vertical: -1 });
  assert.equal(iniciais.letras, 'AAA');
});

test('segurar a direção troca a letra uma vez só', () => {
  const iniciais = criarIniciais();

  for (let quadro = 0; quadro < 10; quadro += 1) iniciais.atualizar({ ...PARADO, vertical: -1 }, []);

  assert.equal(iniciais.letras, 'BAA');
});

test('esquerda e direita movem o cursor entre as três posições, sem passar das pontas', () => {
  const iniciais = criarIniciais();

  tocar(iniciais, { horizontal: -1 });
  assert.equal(iniciais.posicao, 0);
  tocar(iniciais, { horizontal: 1 });
  tocar(iniciais, { horizontal: 1 });
  tocar(iniciais, { horizontal: 1 });
  assert.equal(iniciais.posicao, 2);
  tocar(iniciais, { vertical: -1 });
  assert.equal(iniciais.letras, 'AAB');
});

test('confirmar aceita a letra atual e avança; na terceira, grava as Iniciais', () => {
  const iniciais = criarIniciais();

  tocar(iniciais, { vertical: -1 });
  assert.equal(tocar(iniciais, { confirmar: true }), null);
  assert.equal(iniciais.posicao, 1);
  assert.equal(tocar(iniciais, { confirmar: true }), null);
  tocar(iniciais, { vertical: 1 });
  assert.equal(tocar(iniciais, { confirmar: true }), 'BAZ');
  assert.equal(iniciais.concluidas, true);
});

test('Esc volta uma letra, e na primeira fica nela: não há como pular a tela', () => {
  const iniciais = criarIniciais();

  tocar(iniciais, { confirmar: true });
  tocar(iniciais, { confirmar: true });
  tocar(iniciais, { voltar: true });
  assert.equal(iniciais.posicao, 1);
  tocar(iniciais, { voltar: true });
  tocar(iniciais, { voltar: true });
  assert.equal(iniciais.posicao, 0);
  assert.equal(iniciais.concluidas, false);
});

test('digitar uma letra A–Z preenche a posição e avança; na terceira, grava', () => {
  const iniciais = criarIniciais();

  assert.equal(tocar(iniciais, {}, ['K']), null);
  assert.equal(iniciais.letras, 'KAA');
  assert.equal(iniciais.posicao, 1);
  tocar(iniciais, {}, ['I']);
  assert.equal(tocar(iniciais, {}, ['W']), 'KIW');
});

test('depois de gravadas, as Iniciais não mudam mais', () => {
  const iniciais = criarIniciais();
  tocar(iniciais, {}, ['K', 'I', 'W']);

  assert.equal(iniciais.letras, 'KIW');
  assert.equal(tocar(iniciais, { confirmar: true }, ['X']), null);
  assert.equal(iniciais.letras, 'KIW');
});

/** Um quadro só de teclado, no formato do estado bruto do Input. */
const teclado = (...teclas) => ({ teclas: new Set(teclas), gamepads: [] });

test('na digitação, as letras saem do estado do Input: WASD não move e M não silencia', () => {
  const input = criarInput();
  input.atualizar(teclado(), SEGUNDOS_BLOQUEIO);
  const { estado, letras } = separarDigitacao(teclado('KeyD', 'KeyW', 'KeyM', 'ArrowUp', 'Enter'));

  assert.deepEqual([...letras].sort(), ['KeyD', 'KeyM', 'KeyW']);
  const acoes = input.atualizar(estado, 0.1);
  assert.equal(acoes.horizontal, 0);
  assert.equal(acoes.vertical, -1, 'as setas seguem valendo');
  assert.equal(acoes.silenciar, false);
  assert.equal(acoes.confirmar, true);
});

test('Select do controle segue silenciando na digitação', () => {
  const input = criarInput();
  input.atualizar(teclado(), SEGUNDOS_BLOQUEIO);
  const botoes = Array.from({ length: 17 }, (_, numero) => ({ pressed: numero === 8 }));
  const { estado } = separarDigitacao({ teclas: new Set(), gamepads: [{ mapping: 'standard', axes: [0, 0], buttons: botoes }] });

  assert.equal(input.atualizar(estado, 0.1).silenciar, true);
});

test('a digitação devolve cada letra uma vez, ao apertar', () => {
  const digitacao = criarDigitacao();
  digitacao.atualizar(new Set(), SEGUNDOS_BLOQUEIO);

  assert.deepEqual(digitacao.atualizar(new Set(['KeyK']), 0.1), ['K']);
  assert.deepEqual(digitacao.atualizar(new Set(['KeyK']), 0.1), []);
  assert.deepEqual(digitacao.atualizar(new Set(['KeyK', 'KeyI']), 0.1), ['I']);
  assert.deepEqual(digitacao.atualizar(new Set(), 0.1), []);
  assert.deepEqual(digitacao.atualizar(new Set(['KeyK']), 0.1), ['K']);
});

test('a letra que já vinha segurada ao abrir a tela (o D de andar) só vale depois de solta', () => {
  const digitacao = criarDigitacao();

  assert.deepEqual(digitacao.atualizar(new Set(['KeyD']), 0.1), []);
  assert.deepEqual(digitacao.atualizar(new Set(['KeyD']), SEGUNDOS_BLOQUEIO), []);
  assert.deepEqual(digitacao.atualizar(new Set(['KeyD']), 0.1), []);
  digitacao.atualizar(new Set(), 0.1);
  assert.deepEqual(digitacao.atualizar(new Set(['KeyD']), 0.1), ['D']);
});
