/**
 * @file A versão mostrada na Tela inicial bate com a do package.json.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { VERSAO } from '../src/logica/versao.js';

test('a constante de versão bate com o package.json', async () => {
  const url = new URL('../package.json', import.meta.url);
  const pkg = JSON.parse(await readFile(url, 'utf8'));

  assert.equal(VERSAO, pkg.version);
});
