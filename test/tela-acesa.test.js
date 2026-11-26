/**
 * @file Tela acesa (Screen Wake Lock), sem navegador: pede a trava, tolera a falta de suporte
 * e a recusa, e pede de novo quando a página volta a ficar visível.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { manterTelaAcesa } from '../src/logica/tela-acesa.js';

/**
 * Um `document` mínimo: estado de visibilidade e o evento `visibilitychange`.
 *
 * @returns {{ visibilityState: string, addEventListener: Function, mudar: (estado: string) => void }}
 *   O documento; `mudar` troca a visibilidade e dispara o evento.
 */
function documentoFalso() {
  const ouvintes = [];
  return {
    visibilityState: 'visible',
    addEventListener(evento, ouvinte) {
      if (evento === 'visibilitychange') ouvintes.push(ouvinte);
    },
    mudar(estado) {
      this.visibilityState = estado;
      for (const ouvinte of ouvintes) ouvinte();
    },
  };
}

/**
 * Um `navigator` com Wake Lock que conta os pedidos.
 *
 * @param {() => Promise<unknown>} [responder] - O que cada pedido devolve.
 * @returns {{ wakeLock: { request: (tipo: string) => Promise<unknown> }, pedidos: string[] }} O navegador.
 */
function navegadorCom(responder = async () => ({})) {
  const pedidos = [];
  return {
    pedidos,
    wakeLock: {
      request(tipo) {
        pedidos.push(tipo);
        return responder();
      },
    },
  };
}

test('pede a trava de tela ao começar', async () => {
  const navegador = navegadorCom();

  await manterTelaAcesa(navegador, documentoFalso());

  assert.deepEqual(navegador.pedidos, ['screen']);
});

test('sem suporte à Wake Lock, não quebra', async () => {
  await assert.doesNotReject(manterTelaAcesa({}, documentoFalso()));
  await assert.doesNotReject(manterTelaAcesa(undefined, undefined));
});

test('a recusa do navegador é engolida', async () => {
  const navegador = navegadorCom(() => Promise.reject(new Error('NotAllowedError')));

  await assert.doesNotReject(manterTelaAcesa(navegador, documentoFalso()));
});

test('um pedido que lança na hora também é engolido', async () => {
  const navegador = navegadorCom(() => {
    throw new Error('NotAllowedError');
  });

  await assert.doesNotReject(manterTelaAcesa(navegador, documentoFalso()));
});

test('ao voltar a ficar visível, pede a trava de novo', async () => {
  const navegador = navegadorCom();
  const documento = documentoFalso();
  await manterTelaAcesa(navegador, documento);

  documento.mudar('hidden');
  documento.mudar('visible');

  assert.deepEqual(navegador.pedidos, ['screen', 'screen']);
});
