/**
 * @file Textos (i18n): paridade PT/EN e lookup no idioma atual.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarTextos, DICIONARIOS } from '../src/logica/textos.js';

test('PT e EN têm exatamente o mesmo conjunto de chaves', () => {
  const chavesPt = Object.keys(DICIONARIOS.pt).sort();
  const chavesEn = Object.keys(DICIONARIOS.en).sort();

  assert.deepEqual(chavesEn, chavesPt);
});

test('nenhum texto de nenhum idioma é vazio', () => {
  for (const [idioma, dicionario] of Object.entries(DICIONARIOS)) {
    for (const [chave, valor] of Object.entries(dicionario)) {
      assert.ok(typeof valor === 'string' && valor.trim() !== '', `${idioma}.${chave} vazio`);
    }
  }
});

test('o idioma padrão é PT', () => {
  const textos = criarTextos();

  assert.equal(textos.idioma, 'pt');
  assert.equal(textos.t('tela_inicial.aperte'), DICIONARIOS.pt['tela_inicial.aperte']);
});

test('trocar o idioma muda o texto devolvido', () => {
  const textos = criarTextos();

  textos.definirIdioma('en');

  assert.equal(textos.t('tela_inicial.aperte'), DICIONARIOS.en['tela_inicial.aperte']);
});

test('parâmetros entre chaves são substituídos no texto', () => {
  const textos = criarTextos({ pt: { saudacao: 'Olá, {nome}!' } });

  assert.equal(textos.t('saudacao', { nome: 'Kiwi' }), 'Olá, Kiwi!');
});

test('idioma desconhecido é recusado', () => {
  const textos = criarTextos();

  assert.throws(() => textos.definirIdioma('fr'));
});
