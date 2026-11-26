/**
 * @file Seletor de idioma da Tela inicial: PT | EN, sem Phaser e só em memória.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarSeletorIdioma } from '../src/logica/seletor-idioma.js';
import { criarTextos } from '../src/logica/textos.js';

/** Ações de um quadro sem nada apertado, no formato do Input unificado. */
const PARADO = Object.freeze({ horizontal: 0, vertical: 0 });

/**
 * Um quadro com a direção segurada seguido de um quadro solto: um toque.
 *
 * @param {ReturnType<typeof criarSeletorIdioma>} seletor - O seletor.
 * @param {number} horizontal - -1 (esquerda) ou 1 (direita).
 */
function tocar(seletor, horizontal) {
  seletor.atualizar({ ...PARADO, horizontal });
  seletor.atualizar(PARADO);
}

test('um toque para a direita troca de PT para EN', () => {
  const textos = criarTextos();
  const seletor = criarSeletorIdioma(textos);

  tocar(seletor, 1);

  assert.equal(textos.idioma, 'en');
});

test('um toque para qualquer lado alterna PT | EN', () => {
  const textos = criarTextos();
  const seletor = criarSeletorIdioma(textos);

  tocar(seletor, -1);
  assert.equal(textos.idioma, 'en');
  tocar(seletor, -1);
  assert.equal(textos.idioma, 'pt');
  tocar(seletor, 1);
  tocar(seletor, 1);
  assert.equal(textos.idioma, 'pt');
});

test('segurar a direção troca uma vez só', () => {
  const textos = criarTextos();
  const seletor = criarSeletorIdioma(textos);

  for (let quadro = 0; quadro < 30; quadro += 1) seletor.atualizar({ ...PARADO, horizontal: 1 });

  assert.equal(textos.idioma, 'en');
});

test('atualizar diz se o idioma mudou no quadro', () => {
  const seletor = criarSeletorIdioma(criarTextos());

  assert.equal(seletor.atualizar(PARADO), false);
  assert.equal(seletor.atualizar({ ...PARADO, horizontal: 1 }), true);
  assert.equal(seletor.atualizar({ ...PARADO, horizontal: 1 }), false);
});

test('as opções são as siglas de cada idioma, PT antes de EN, com a atual marcada', () => {
  const textos = criarTextos();
  const seletor = criarSeletorIdioma(textos);

  assert.deepEqual(seletor.opcoes, [
    { idioma: 'pt', sigla: 'PT', atual: true },
    { idioma: 'en', sigla: 'EN', atual: false },
  ]);
  tocar(seletor, 1);
  assert.deepEqual(seletor.opcoes.map((opcao) => opcao.atual), [false, true]);
});

test('o seletor começa no idioma em que os Textos estão', () => {
  const textos = criarTextos();
  textos.definirIdioma('en');

  const seletor = criarSeletorIdioma(textos);

  assert.deepEqual(seletor.opcoes.map((opcao) => opcao.atual), [false, true]);
});

test('"Kia ora!" e "Aotearoa" são iguais nos dois idiomas', () => {
  const textos = criarTextos();
  const emPt = [textos.t('tela_inicial.saudacao'), textos.t('menu.titulo')];

  textos.definirIdioma('en');

  assert.deepEqual([textos.t('tela_inicial.saudacao'), textos.t('menu.titulo')], emPt);
  assert.deepEqual(emPt, ['Kia ora!', 'Aotearoa']);
});
