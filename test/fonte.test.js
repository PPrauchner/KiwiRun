/**
 * @file Todo caractere dos Textos existe na fonte bitmap que o jogo carrega.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { criarTextos, DICIONARIOS } from '../src/logica/textos.js';
import { VERSAO } from '../src/logica/versao.js';

const URL_FONTE = new URL('../assets/fonte/kiwirun.xml', import.meta.url);

/**
 * Lê os caracteres declarados num arquivo de fonte bitmap (formato BMFont XML).
 *
 * @param {URL} url - O arquivo `.xml` da fonte.
 * @returns {Promise<Set<string>>} Os caracteres que a fonte desenha.
 */
async function caracteresDaFonte(url) {
  const xml = await readFile(url, 'utf8');
  const ids = [...xml.matchAll(/<char id="(\d+)"/g)].map(([, id]) => Number(id));
  return new Set(ids.map((id) => String.fromCodePoint(id)));
}

test('todo caractere dos textos, nos dois idiomas, existe na fonte bitmap', async () => {
  const naFonte = await caracteresDaFonte(URL_FONTE);
  const textos = criarTextos();
  const faltando = new Set();

  for (const idioma of Object.keys(DICIONARIOS)) {
    textos.definirIdioma(idioma);
    for (const chave of Object.keys(DICIONARIOS[idioma])) {
      for (const caractere of textos.t(chave, { versao: VERSAO })) {
        if (!naFonte.has(caractere)) faltando.add(caractere);
      }
    }
  }

  assert.deepEqual([...faltando], []);
});

test('a fonte desenha os acentos do português e o ā do māori', async () => {
  const naFonte = await caracteresDaFonte(URL_FONTE);

  for (const caractere of 'áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇāĀ') {
    assert.ok(naFonte.has(caractere), `falta ${caractere}`);
  }
});
