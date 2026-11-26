/**
 * @file Silêncio, sem Phaser: o estado em que todo som do jogo está desligado, escolha do
 * Apresentador que persiste entre Visitantes e aberturas, sobre um armazenamento injetável
 * (`localStorage` no jogo). A Volta por inatividade não o toca.
 *
 * O armazenamento pode estar vazio, corrompido ou indisponível: um valor ilegível conta como
 * som ligado, e sem armazenamento o Silêncio vale só enquanto a página está aberta.
 */

const CHAVE = 'kiwirun:v1:silencio';
const LIGADO = '1';
const DESLIGADO = '0';

/**
 * @typedef {Object} Silencio
 * @property {boolean} ligado - Se todo som está desligado.
 * @property {() => boolean} alternar - Liga ou desliga, grava e diz se ficou ligado.
 */

/**
 * Cria o Silêncio no estado gravado.
 *
 * @param {Storage | null} armazenamento - Onde o estado fica; `null` se indisponível.
 * @returns {Silencio} O Silêncio.
 */
export function criarSilencio(armazenamento) {
  let ligado = false;
  try {
    ligado = armazenamento?.getItem(CHAVE) === LIGADO;
  } catch {
    // Indisponível: começa com som.
  }

  return {
    get ligado() {
      return ligado;
    },
    alternar() {
      ligado = !ligado;
      try {
        armazenamento?.setItem(CHAVE, ligado ? LIGADO : DESLIGADO);
      } catch {
        // Indisponível ou cheio: o estado fica só em memória.
      }
      return ligado;
    },
  };
}
