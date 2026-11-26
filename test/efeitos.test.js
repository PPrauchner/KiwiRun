/**
 * @file Os efeitos sonoros do jogo estão versionados, um `.ogg` por ação, com a licença CC0
 * do pacote Kenney ao lado.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { EFEITOS, LICENCA_EFEITOS } from '../src/logica/efeitos.js';

const raiz = (caminho) => new URL(`../${caminho}`, import.meta.url);

test('pular, coletar, capturar e achar uma Samambaia-prateada têm cada um seu efeito', () => {
  assert.deepEqual(Object.keys(EFEITOS).sort(), ['capturar', 'coletar', 'pular', 'samambaia']);
});

test('todo efeito é um .ogg versionado', async () => {
  for (const [acao, caminho] of Object.entries(EFEITOS)) {
    assert.match(caminho, /^assets\/sons\/.+\.ogg$/, acao);
    const audio = await readFile(raiz(caminho));
    assert.equal(audio.subarray(0, 4).toString('latin1'), 'OggS', acao);
  }
});

test('os sons vêm com a licença CC0 do Kenney e só os .ogg usados são versionados', async () => {
  const licenca = await readFile(raiz(LICENCA_EFEITOS), 'utf8');
  assert.match(licenca, /Kenney/);
  assert.match(licenca, /CC0/);

  const oggs = (await readdir(raiz('assets/sons'))).filter((nome) => nome.endsWith('.ogg'));
  const usados = Object.values(EFEITOS).map((caminho) => caminho.split('/').pop());
  assert.deepEqual(oggs.sort(), [...new Set(usados)].sort());
});
