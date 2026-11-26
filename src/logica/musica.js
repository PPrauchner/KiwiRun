/**
 * @file Música, sem Phaser: um tema chiptune, sintetizado por script em uma faixa `.wav` por
 * andamento. Tela inicial, Menu, Créditos, Iniciais e Placar tocam o andamento base; cada
 * Fase toca o andamento que o catálogo lhe dá. A música só reinicia ao trocar de andamento.
 */
import { MUNDOS } from './catalogo.js';

/** Andamento das telas fora da Fase, em batidas por minuto. */
export const ANDAMENTO_BASE = 120;

/**
 * @param {import('./catalogo.js').Fase} fase - A Fase.
 * @returns {number} O andamento da música na Fase; o base, se os dados não dão um.
 */
export function andamentoDaFase(fase) {
  return fase.andamento ?? ANDAMENTO_BASE;
}

/**
 * Os andamentos que têm faixa: o base e o de cada Fase jogável, sem repetir.
 *
 * @param {readonly import('./catalogo.js').Mundo[]} [mundos] - Os Mundos; o padrão é o catálogo do jogo.
 * @returns {number[]} Os andamentos, o base primeiro.
 */
export function andamentosDoJogo(mundos = MUNDOS) {
  const fases = mundos.flatMap((mundo) => mundo.fases).filter((fase) => !fase.emBreve);
  return [...new Set([ANDAMENTO_BASE, ...fases.map(andamentoDaFase)])];
}

/**
 * @param {number} andamento - Andamento, em batidas por minuto.
 * @returns {string} O caminho da faixa do tema nesse andamento, a partir da raiz do site.
 */
export function faixaMusica(andamento) {
  return `assets/musica/tema-${andamento}.wav`;
}

/**
 * @param {number} andamento - Andamento, em batidas por minuto.
 * @returns {string} A chave do áudio da faixa no Phaser.
 */
export function chaveMusica(andamento) {
  return `musica-${andamento}`;
}

/**
 * @typedef {Object} Trilha
 * @property {number | null} andamento - O andamento tocando; `null` antes da primeira tela.
 * @property {(andamento: number) => boolean} tocar - Pede o andamento de uma tela e diz se a
 *   música tem de (re)começar: só quando ele muda.
 */

/**
 * Cria a trilha do jogo, uma só para todas as telas.
 *
 * @returns {Trilha} A trilha, ainda sem música.
 */
export function criarTrilha() {
  /** @type {number | null} */
  let atual = null;
  return {
    get andamento() {
      return atual;
    },
    tocar(andamento) {
      if (andamento === atual) return false;
      atual = andamento;
      return true;
    },
  };
}
