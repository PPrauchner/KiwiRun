/**
 * @file Créditos: as fontes dos Fatos agrupadas por Fase, lidas do arquivo de fontes, e os
 * textos da tela nos dois idiomas, sem Phaser.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CHAVES_TELA_CREDITOS, fontesPorFase, SECOES_CREDITOS } from '../src/logica/creditos.js';
import { MUNDOS } from '../src/logica/catalogo.js';
import { DICIONARIOS } from '../src/logica/textos.js';

const URL_FONTE = new URL('../assets/fonte/kiwirun.xml', import.meta.url);

/**
 * @param {string} id - Id da Fase.
 * @param {string[]} chavesFato - Chaves dos Fatos da Fase.
 * @param {boolean} [emBreve] - Se a Fase está em breve.
 * @returns {import('../src/logica/catalogo.js').Fase} Uma Fase de teste.
 */
function fase(id, chavesFato, emBreve = false) {
  return { id, chaveNome: `fase.${id}`, emBreve, mapa: null, itens: [], chavesFato, tempoReferencia: null };
}

test('a Pecuária e o Porto creditam a fonte dos seus Fatos uma vez só, lida do arquivo de fontes', () => {
  assert.deepEqual(fontesPorFase(MUNDOS), [
    { chaveNome: 'fase.pecuaria', fontes: ['Anúncio da Série E da Halter (mar/2026)'] },
    { chaveNome: 'fase.porto', fontes: ['MPI, SOPI de junho de 2026'] },
  ]);
});

test('cada Fase com Fatos lista as suas fontes distintas, na ordem dos Fatos', () => {
  const mundos = [
    { id: 'm1', chaveNome: 'mundo.m1', emBreve: false, fases: [fase('a', ['f1', 'f2', 'f3']), fase('b', [], true)] },
    { id: 'm2', chaveNome: 'mundo.m2', emBreve: false, fases: [fase('c', ['f4'])] },
  ];
  const fontes = {
    f1: { fonte: 'Stats NZ', provisorio: false },
    f2: { fonte: 'MPI', provisorio: false },
    f3: { fonte: 'Stats NZ', provisorio: false },
    f4: { fonte: 'Rocket Lab', provisorio: true },
  };

  assert.deepEqual(fontesPorFase(mundos, fontes), [
    { chaveNome: 'fase.a', fontes: ['Stats NZ', 'MPI'] },
    { chaveNome: 'fase.c', fontes: ['Rocket Lab'] },
  ]);
});

test('as seções creditam o grupo, os pacotes Kenney versionados, a música do projeto e o Phaser, nessa ordem', () => {
  assert.deepEqual(SECOES_CREDITOS.map((secao) => secao.chaveTitulo), ['creditos.grupo', 'creditos.arte_som', 'creditos.codigo']);
  const [grupo, arteSom, codigo] = SECOES_CREDITOS;
  assert.equal(DICIONARIOS.pt[grupo.chavesLinhas[0]], 'Grupo da apresentação sobre a Nova Zelândia');
  const arteSomPt = arteSom.chavesLinhas.map((chave) => DICIONARIOS.pt[chave]);
  assert.deepEqual(arteSomPt, [
    'Kenney — Pixel Platformer 1.2 (CC0)',
    'Kenney — Digital Audio (CC0)',
    'Música chiptune gerada por script do projeto',
  ]);
  assert.match(DICIONARIOS.pt[codigo.chavesLinhas[0]], /^Phaser 3\.90 /);
});

test('todo texto dos Créditos existe nos dois idiomas', () => {
  const chaves = [...CHAVES_TELA_CREDITOS, ...SECOES_CREDITOS.flatMap((secao) => [secao.chaveTitulo, ...secao.chavesLinhas])];

  for (const [idioma, dicionario] of Object.entries(DICIONARIOS)) {
    for (const chave of chaves) assert.ok(Object.hasOwn(dicionario, chave), `${idioma} sem ${chave}`);
  }
});

test('todo caractere das fontes dos Fatos existe na fonte bitmap', async () => {
  const xml = await readFile(URL_FONTE, 'utf8');
  const naFonte = new Set([...xml.matchAll(/<char id="(\d+)"/g)].map(([, id]) => String.fromCodePoint(Number(id))));
  const faltando = fontesPorFase(MUNDOS).flatMap(({ fontes }) => fontes).flatMap((fonte) => [...fonte]).filter((caractere) => !naFonte.has(caractere));

  assert.deepEqual(faltando, []);
});
