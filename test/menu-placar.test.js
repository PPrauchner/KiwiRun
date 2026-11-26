/**
 * @file Opções do Placar: Próxima Fase (se houver), Jogar de novo e Menu, sem Phaser.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chaveOpcaoPlacar, criarMenuPlacar } from '../src/logica/menu-placar.js';
import { criarTextos, DICIONARIOS } from '../src/logica/textos.js';

/** Ações de um quadro sem nada apertado, no formato do Input unificado. */
const PARADO = Object.freeze({ horizontal: 0, vertical: 0, confirmar: false, voltar: false });

/**
 * Um quadro com o aperto seguido de um quadro solto: um toque.
 *
 * @param {ReturnType<typeof criarMenuPlacar>} menu - As opções do Placar.
 * @param {Partial<typeof PARADO>} acoes - O que muda no quadro do toque.
 * @returns {import('../src/logica/menu-placar.js').DestinoPlacar | null} O destino do toque.
 */
function tocar(menu, acoes) {
  const destino = menu.atualizar({ ...PARADO, ...acoes });
  menu.atualizar(PARADO);
  return destino;
}

test('"Jogar de novo" vem pré-selecionada e recomeça a mesma Fase', () => {
  const menu = criarMenuPlacar({ faseId: 'a', proximaFaseId: 'b' });

  assert.equal(menu.opcao, 'jogar_de_novo');
  assert.deepEqual(tocar(menu, { confirmar: true }), { tela: 'fase', faseId: 'a' });
});

test('com uma próxima Fase disponível, as opções são Próxima Fase, Jogar de novo e Menu', () => {
  const menu = criarMenuPlacar({ faseId: 'a', proximaFaseId: 'b' });

  assert.deepEqual(menu.opcoes, ['proxima', 'jogar_de_novo', 'menu']);
  tocar(menu, { horizontal: -1 });
  assert.deepEqual(tocar(menu, { confirmar: true }), { tela: 'fase', faseId: 'b' });
});

test('sem próxima Fase disponível, "Próxima Fase" some', () => {
  const menu = criarMenuPlacar({ faseId: 'a', proximaFaseId: null });

  assert.deepEqual(menu.opcoes, ['jogar_de_novo', 'menu']);
  tocar(menu, { vertical: -1 });
  assert.equal(menu.opcao, 'jogar_de_novo');
});

test('"Menu" leva ao Menu', () => {
  const menu = criarMenuPlacar({ faseId: 'a', proximaFaseId: null });

  tocar(menu, { vertical: 1 });
  assert.equal(menu.opcao, 'menu');
  assert.deepEqual(tocar(menu, { confirmar: true }), { tela: 'menu' });
});

test('Esc leva ao Menu de qualquer opção', () => {
  const menu = criarMenuPlacar({ faseId: 'a', proximaFaseId: 'b' });

  assert.deepEqual(tocar(menu, { voltar: true }), { tela: 'menu' });
});

test('segurar uma direção move o cursor uma vez só', () => {
  const menu = criarMenuPlacar({ faseId: 'a', proximaFaseId: 'b' });

  menu.atualizar({ ...PARADO, horizontal: 1 });
  menu.atualizar({ ...PARADO, horizontal: 1 });

  assert.equal(menu.opcao, 'menu');
  assert.equal(menu.atualizar(PARADO), null);
});

test('as opções e os rótulos do Placar têm texto nos dois idiomas', () => {
  const chaves = [
    'placar.titulo', 'placar.tempo_gasto', 'placar.desconto_itens', 'placar.desconto_capturas',
    'placar.desconto_samambaias', 'placar.tempo_final', 'placar.contagem', 'placar.capturas_especie',
    'placar.fatos', 'placar.fato_faltando', 'placar.convite', 'numero.separador_decimal',
    ...['proxima', 'jogar_de_novo', 'menu'].map(chaveOpcaoPlacar),
  ];

  for (const [idioma, dicionario] of Object.entries(DICIONARIOS)) {
    for (const chave of chaves) assert.ok(Object.hasOwn(dicionario, chave), `${idioma} sem ${chave}`);
  }
  assert.equal(DICIONARIOS.pt['placar.fato_faltando'], '???');
});

test('Itens por tipo saem como "Lã 5/8" e Capturas por espécie como "Arminho ×2"', () => {
  const textos = criarTextos();

  assert.equal(textos.t('placar.contagem', { nome: 'Lã', feitos: '5', total: '8' }), 'Lã 5/8');
  assert.equal(textos.t('placar.capturas_especie', { nome: 'Arminho', quantidade: '2' }), 'Arminho ×2');
});
