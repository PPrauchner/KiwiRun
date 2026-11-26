/**
 * @file Navegação do Menu: cursor sobre os Mundos e as Fases do Catálogo, sem Phaser.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chaveOpcao, criarMenu, OPCOES } from '../src/logica/menu.js';
import { DICIONARIOS } from '../src/logica/textos.js';
import { MUNDOS } from '../src/logica/catalogo.js';

/** Ações de um quadro sem nada apertado, no formato do Input unificado. */
const PARADO = Object.freeze({ horizontal: 0, vertical: 0, confirmar: false, voltar: false });

/**
 * Um quadro com a direção segurada seguido de um quadro solto: um toque.
 *
 * @param {ReturnType<typeof criarMenu>} menu - O Menu.
 * @param {Partial<typeof PARADO>} acoes - O que muda no quadro do toque.
 * @returns {import('../src/logica/menu.js').Destino | null} O destino do toque.
 */
function tocar(menu, acoes) {
  const destino = menu.atualizar({ ...PARADO, ...acoes });
  menu.atualizar(PARADO);
  return destino;
}

/**
 * @param {string} id - Id do Mundo.
 * @param {Array<[string, boolean]>} fases - Id e "em breve" de cada Fase.
 * @param {boolean} [emBreve] - Se o Mundo está em breve.
 * @returns {import('../src/logica/catalogo.js').Mundo} Um Mundo de teste.
 */
function mundo(id, fases, emBreve = false) {
  return {
    id,
    chaveNome: `mundo.${id}`,
    emBreve,
    fases: fases.map(([faseId, faseEmBreve]) => ({
      id: faseId, chaveNome: `fase.${faseId}`, emBreve: faseEmBreve, mapa: null, itens: [], chavesFato: [], tempoReferencia: null,
    })),
  };
}

test('o Menu abre com o cursor em Economia/Tecnologia › Pecuária', () => {
  const menu = criarMenu(MUNDOS);

  assert.equal(menu.coluna, 'fases');
  assert.equal(menu.mundo.id, 'economia-tecnologia');
  assert.equal(menu.fase.id, 'pecuaria');
});

test('confirmar com o cursor numa Fase abre essa Fase', () => {
  const menu = criarMenu(MUNDOS);

  assert.deepEqual(tocar(menu, { confirmar: true }), { tela: 'fase', faseId: 'pecuaria' });
});

test('voltar (Esc) leva à Tela inicial', () => {
  const menu = criarMenu(MUNDOS);

  assert.deepEqual(tocar(menu, { voltar: true }), { tela: 'tela-inicial' });
});

test('sem aperto novo, o Menu não leva a lugar nenhum', () => {
  const menu = criarMenu(MUNDOS);

  assert.equal(menu.atualizar(PARADO), null);
});

test('na coluna de Fases, cima e baixo pulam as Fases em breve', () => {
  const menu = criarMenu([mundo('m', [['a', false], ['b', true], ['c', false]])]);

  tocar(menu, { vertical: 1 });
  assert.equal(menu.fase.id, 'c');
  tocar(menu, { vertical: 1 });
  assert.equal(menu.fase.id, 'c');
  tocar(menu, { vertical: -1 });
  assert.equal(menu.fase.id, 'a');
});

test('segurar uma direção move o cursor uma vez só', () => {
  const menu = criarMenu([mundo('m', [['a', false], ['b', false], ['c', false]])]);

  menu.atualizar({ ...PARADO, vertical: 1 });
  menu.atualizar({ ...PARADO, vertical: 1 });

  assert.equal(menu.fase.id, 'b');
});

test('esquerda leva o cursor aos Mundos, que pulam os em breve e trocam o Mundo selecionado', () => {
  const menu = criarMenu([mundo('m1', [['a', false]]), mundo('m2', [], true), mundo('m3', [['b', true], ['c', false]])]);

  tocar(menu, { horizontal: -1 });
  assert.equal(menu.coluna, 'mundos');
  tocar(menu, { vertical: 1 });
  assert.equal(menu.mundo.id, 'm3');
  tocar(menu, { horizontal: 1 });
  assert.equal(menu.coluna, 'fases');
  assert.equal(menu.fase.id, 'c');
});

test('confirmar num Mundo leva o cursor às Fases dele', () => {
  const menu = criarMenu([mundo('m1', [['a', false]]), mundo('m2', [['b', false]])]);

  tocar(menu, { horizontal: -1 });
  tocar(menu, { vertical: 1 });

  assert.equal(tocar(menu, { confirmar: true }), null);
  assert.equal(menu.coluna, 'fases');
  assert.equal(menu.fase.id, 'b');
});

test('um Mundo sem Fase jogável não deixa o cursor entrar nas Fases', () => {
  const menu = criarMenu([mundo('m1', [['a', false]]), mundo('m2', [['b', true]])]);

  tocar(menu, { horizontal: -1 });
  tocar(menu, { vertical: 1 });
  tocar(menu, { horizontal: 1 });

  assert.equal(menu.coluna, 'mundos');
  assert.equal(menu.fase, null);
});

test('abaixo dos Mundos, Créditos abre os Créditos e Voltar leva à Tela inicial', () => {
  const menu = criarMenu(MUNDOS);

  tocar(menu, { horizontal: -1 });
  tocar(menu, { vertical: -1 });
  assert.equal(menu.mundo.id, 'economia-tecnologia', 'os Mundos em breve não são selecionáveis');
  tocar(menu, { vertical: 1 });
  assert.equal(menu.opcao, 'creditos');
  assert.equal(menu.mundo.id, 'economia-tecnologia', 'as Fases mostradas seguem as do último Mundo');
  assert.deepEqual(tocar(menu, { confirmar: true }), { tela: 'creditos' });

  tocar(menu, { vertical: 1 });
  assert.equal(menu.opcao, 'voltar');
  tocar(menu, { vertical: -1 });
  tocar(menu, { vertical: -1 });
  assert.equal(menu.opcao, null);

  tocar(menu, { vertical: 1 });
  tocar(menu, { vertical: 1 });
  assert.deepEqual(tocar(menu, { confirmar: true }), { tela: 'tela-inicial' });
});

test('o Menu lista as opções Créditos e Voltar, ambas habilitadas', () => {
  assert.deepEqual(OPCOES.map(({ id, desabilitada }) => [id, desabilitada]), [['creditos', false], ['voltar', false]]);
});

test('o título, as opções, o "em breve" e o Recorde do Menu têm texto nos dois idiomas', () => {
  const chaves = ['menu.titulo', 'menu.em_breve', 'menu.recorde', 'menu.sem_recorde', ...OPCOES.map(chaveOpcao)];

  for (const [idioma, dicionario] of Object.entries(DICIONARIOS)) {
    for (const chave of chaves) assert.ok(Object.hasOwn(dicionario, chave), `${idioma} sem ${chave}`);
  }
  assert.equal(DICIONARIOS.pt['menu.titulo'], 'Aotearoa');
  assert.equal(DICIONARIOS.pt['menu.sem_recorde'], '—');
});
