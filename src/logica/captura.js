/**
 * @file Captura, sem Phaser: decide o que um contato entre o Kiwi e um Predador causa.
 *
 * Cair sobre o Predador é Captura (efeito de armadilha, nunca morte); qualquer outro contato
 * devolve o Kiwi ao último Checkpoint, a menos que ele esteja invulnerável logo depois de
 * voltar, quando o contato lateral atravessa sem efeito.
 */

/** Segundos de invulnerabilidade, piscando, depois de voltar ao Checkpoint. */
export const SEGUNDOS_INVULNERAVEL = 1;

/** Segundos em que o nome da espécie flutua sobre o Predador capturado. */
export const SEGUNDOS_ROTULO_CAPTURA = 1;

/** Pixels de tolerância: os pés do Kiwi podem já ter entrado um pouco no Predador. */
const FOLGA_PIXELS = 4;

/**
 * @typedef {Object} Contato
 * @property {number} vy - Velocidade vertical do Kiwi (positiva desce).
 * @property {number} baseAnterior - Base (pés) do Kiwi no passo anterior, em pixels.
 * @property {number} topoPredador - Topo do corpo do Predador, em pixels.
 * @property {boolean} invulneravel - Se o Kiwi acabou de voltar ao Checkpoint.
 */

/**
 * Resolve um contato entre o Kiwi e um Predador.
 *
 * @param {Contato} contato - O estado dos dois no contato.
 * @returns {'captura' | 'checkpoint' | 'nada'} O efeito do contato.
 */
export function resolverContato({ vy, baseAnterior, topoPredador, invulneravel }) {
  if (vy > 0 && baseAnterior <= topoPredador + FOLGA_PIXELS) return 'captura';
  return invulneravel ? 'nada' : 'checkpoint';
}
