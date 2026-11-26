/**
 * @file Catálogo de Mundos: Economia/Tecnologia com Pecuária e Porto jogáveis e o resto "em breve".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MUNDOS, PREDADORES, buscarFase, chaveNomeItem, chaveNomePredador, proximaFase } from '../src/logica/catalogo.js';
import { DICIONARIOS } from '../src/logica/textos.js';

const ASSUNTOS = ['geografia', 'culinaria', 'curiosidades', 'historia', 'economia-tecnologia', 'fauna-flora'];

test('existe um Mundo por Assunto', () => {
  assert.deepEqual(MUNDOS.map((mundo) => mundo.id).sort(), [...ASSUNTOS].sort());
});

test('Economia/Tecnologia é o único Mundo jogável; os outros estão em breve', () => {
  const jogaveis = MUNDOS.filter((mundo) => !mundo.emBreve).map((mundo) => mundo.id);

  assert.deepEqual(jogaveis, ['economia-tecnologia']);
});

test('em Economia/Tecnologia, Pecuária e Porto são jogáveis e o Foguete está em breve', () => {
  const mundo = MUNDOS.find((candidato) => candidato.id === 'economia-tecnologia');
  const estados = Object.fromEntries(mundo.fases.map((fase) => [fase.id, fase.emBreve]));

  assert.deepEqual(estados, { pecuaria: false, porto: false, foguete: true });
});

test('cada Fase jogável declara mapa, Itens do tema, chaves de Fato e tempo de referência', () => {
  for (const id of ['pecuaria', 'porto']) {
    const fase = buscarFase(id);

    assert.equal(fase.mapa, `assets/mapas/${id}.tmj`);
    assert.ok(fase.itens.length > 0);
    assert.ok(Array.isArray(fase.chavesFato));
    assert.ok(fase.tempoReferencia > 0);
  }
});

test('os Itens do Porto são a Kiwifruta e a caixa de exportação', () => {
  assert.deepEqual(buscarFase('porto').itens, ['kiwifruta', 'caixa']);
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

test('toda espécie de Predador do catálogo tem nome nos textos dos dois idiomas', () => {
  for (const [idioma, dicionario] of Object.entries(DICIONARIOS)) {
    for (const especie of PREDADORES) {
      assert.ok(Object.hasOwn(dicionario, chaveNomePredador(especie)), `${idioma} sem o nome de ${especie}`);
    }
  }
});

test('a próxima Fase é a seguinte do mesmo Mundo, se jogável', () => {
  const fase = (id, emBreve) => ({ id, chaveNome: `fase.${id}`, emBreve, mapa: null, itens: [], chavesFato: [], tempoReferencia: null });
  const mundos = [
    { id: 'm1', chaveNome: 'mundo.m1', emBreve: false, fases: [fase('a', false), fase('b', false), fase('c', true)] },
    { id: 'm2', chaveNome: 'mundo.m2', emBreve: false, fases: [fase('d', false)] },
  ];

  assert.equal(proximaFase('a', mundos)?.id, 'b');
  assert.equal(proximaFase('b', mundos), null, 'a seguinte está em breve');
  assert.equal(proximaFase('d', mundos), null, 'última Fase do Mundo');
});

test('a "Próxima Fase" da Pecuária é o Porto; depois do Porto, o Foguete está em breve', () => {
  assert.equal(proximaFase('pecuaria')?.id, 'porto');
  assert.equal(proximaFase('porto'), null);
});

test('todo Item das Fases do catálogo tem nome nos textos dos dois idiomas', () => {
  const itens = new Set(MUNDOS.flatMap((mundo) => mundo.fases.flatMap((fase) => fase.itens)));

  for (const [idioma, dicionario] of Object.entries(DICIONARIOS)) {
    for (const item of itens) assert.ok(Object.hasOwn(dicionario, chaveNomeItem(item)), `${idioma} sem o nome de ${item}`);
  }
});
