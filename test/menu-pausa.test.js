/**
 * @file Opções da Pausa: continuar, reiniciar a Fase, Controles e Menu, sem Phaser.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chaveOpcaoPausa, criarMenuPausa, LINHAS_CONTROLES } from '../src/logica/menu-pausa.js';
import { DICIONARIOS } from '../src/logica/textos.js';

/** Ações de um quadro sem nada apertado, no formato do Input unificado. */
const PARADO = Object.freeze({ horizontal: 0, vertical: 0, confirmar: false, voltar: false, pausar: false });

/**
 * Um quadro com o aperto seguido de um quadro solto: um toque.
 *
 * @param {ReturnType<typeof criarMenuPausa>} menu - As opções da Pausa.
 * @param {Partial<typeof PARADO>} acoes - O que muda no quadro do toque.
 * @returns {import('../src/logica/menu-pausa.js').DestinoPausa | null} O destino do toque.
 */
function tocar(menu, acoes) {
  const destino = menu.atualizar({ ...PARADO, ...acoes });
  menu.atualizar(PARADO);
  return destino;
}

test('a Pausa abre em "Continuar", e confirmar volta à Fase', () => {
  const menu = criarMenuPausa();

  assert.deepEqual(menu.opcoes, ['continuar', 'reiniciar', 'controles', 'menu']);
  assert.equal(menu.opcao, 'continuar');
  assert.equal(tocar(menu, { confirmar: true }), 'continuar');
});

test('Start ou Esc fecham a Pausa de qualquer opção', () => {
  const menu = criarMenuPausa();

  tocar(menu, { vertical: 1 });
  assert.equal(tocar(menu, { pausar: true }), 'continuar');
});

test('"Reiniciar a Fase" e "Menu" saem da Pausa para onde dizem', () => {
  const reiniciar = criarMenuPausa();
  tocar(reiniciar, { vertical: 1 });
  assert.equal(tocar(reiniciar, { confirmar: true }), 'reiniciar');

  const menu = criarMenuPausa();
  for (let i = 0; i < 5; i += 1) tocar(menu, { vertical: 1 });
  assert.equal(menu.opcao, 'menu');
  assert.equal(tocar(menu, { confirmar: true }), 'menu');
});

test('segurar uma direção move o cursor uma vez só', () => {
  const menu = criarMenuPausa();

  menu.atualizar({ ...PARADO, vertical: 1 });
  menu.atualizar({ ...PARADO, vertical: 1 });

  assert.equal(menu.opcao, 'reiniciar');
});

test('"Controles" mostra os controles sem sair da Pausa; confirmar ou voltar retorna às opções', () => {
  const menu = criarMenuPausa();
  tocar(menu, { vertical: 1 });
  tocar(menu, { vertical: 1 });

  assert.equal(tocar(menu, { confirmar: true }), null);
  assert.equal(menu.mostrandoControles, true);
  tocar(menu, { vertical: 1 });
  assert.equal(tocar(menu, { voltar: true }), null);
  assert.equal(menu.mostrandoControles, false);
  assert.equal(menu.opcao, 'controles', 'o cursor não andou com os Controles na tela');

  tocar(menu, { confirmar: true });
  tocar(menu, { confirmar: true });
  assert.equal(menu.mostrandoControles, false);
});

test('com os Controles na tela, Start ou Esc fecham a Pausa', () => {
  const menu = criarMenuPausa();
  tocar(menu, { vertical: 1 });
  tocar(menu, { vertical: 1 });
  tocar(menu, { confirmar: true });

  assert.equal(tocar(menu, { pausar: true, voltar: true }), 'continuar');
});

test('os Controles listam mover, pular, confirmar e pausar, no 8BitDo e no teclado', () => {
  assert.deepEqual(LINHAS_CONTROLES.map(({ chaveAcao }) => chaveAcao), [
    'controles.mover', 'controles.pular', 'controles.confirmar', 'controles.pausar',
  ]);
  for (const linha of LINHAS_CONTROLES) {
    assert.ok(linha.chave8BitDo.startsWith('controles.8bitdo.'));
    assert.ok(linha.chaveTeclado.startsWith('controles.teclado.'));
  }
});

test('as opções da Pausa e os Controles têm texto nos dois idiomas', () => {
  const chaves = [
    'pausa.titulo', 'controles.titulo', 'controles.8bitdo', 'controles.teclado', 'controles.fechar',
    ...['continuar', 'reiniciar', 'controles', 'menu'].map(chaveOpcaoPausa),
    ...LINHAS_CONTROLES.flatMap(({ chaveAcao, chave8BitDo, chaveTeclado }) => [chaveAcao, chave8BitDo, chaveTeclado]),
  ];

  for (const [idioma, dicionario] of Object.entries(DICIONARIOS)) {
    for (const chave of chaves) assert.ok(Object.hasOwn(dicionario, chave), `${idioma} sem ${chave}`);
  }
  assert.equal(DICIONARIOS.pt['controles.teclado.pausar'], 'Esc');
  assert.equal(DICIONARIOS.en['controles.8bitdo.pausar'], 'Start');
});
