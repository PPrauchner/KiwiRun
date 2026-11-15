/**
 * @file Prova que o runner do `node --test` acha os testes do projeto.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('package.json é lido e identifica o projeto como kiwirun', async () => {
  const url = new URL('../package.json', import.meta.url);
  const pkg = JSON.parse(await readFile(url, 'utf8'));

  assert.equal(pkg.name, 'kiwirun');
});
