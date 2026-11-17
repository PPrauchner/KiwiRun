/**
 * @file Catálogo de Mundos: Economia/Tecnologia com Pecuária jogável e o resto "em breve".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MUNDOS, buscarFase } from '../src/logica/catalogo.js';
import { DICIONARIOS } from '../src/logica/textos.js';

const ASSUNTOS = ['geografia', 'culinaria', 'curiosidades', 'historia', 'economia-tecnologia', 'fauna-flora'];

test('existe um Mundo por Assunto', () => {
  assert.deepEqual(MUNDOS.map((mundo) => mundo.id).sort(), [...ASSUNTOS].sort());
});

test('Economia/Tecnologia é o único Mundo jogável; os outros estão em breve', () => {
  const jogaveis = MUNDOS.filter((mundo) => !mundo.emBreve).map((mundo) => mundo.id);

  assert.deepEqual(jogaveis, ['economia-tecnologia']);
});

test('em Economia/Tecnologia, Pecuária é jogável e Porto e Foguete estão em breve', () => {
  const mundo = MUNDOS.find((candidato) => candidato.id === 'economia-tecnologia');
  const estados = Object.fromEntries(mundo.fases.map((fase) => [fase.id, fase.emBreve]));

  assert.deepEqual(estados, { pecuaria: false, porto: true, foguete: true });
});

test('a Fase jogável declara mapa, Itens do tema, chaves de Fato e tempo de referência', () => {
  const pecuaria = buscarFase('pecuaria');

  assert.equal(pecuaria.mapa, 'assets/mapas/pecuaria.tmj');
  assert.ok(pecuaria.itens.length > 0);
  assert.ok(Array.isArray(pecuaria.chavesFato));
  assert.ok(pecuaria.tempoReferencia > 0);
});

test('Fase desconhecida é recusada', () => {
  assert.throws(() => buscarFase('lua'));
});

test('todo nome de Mundo e de Fase existe nos textos dos dois idiomas', () => {
  const chaves = MUNDOS.flatMap((mundo) => [mundo.chaveNome, ...mundo.fases.map((fase) => fase.chaveNome)]);

  for (const [idioma, dicionario] of Object.entries(DICIONARIOS)) {
    for (const chave of chaves) assert.ok(Object.hasOwn(dicionario, chave), `${idioma} sem ${chave}`);
  }
});
