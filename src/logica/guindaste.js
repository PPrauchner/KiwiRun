/**
 * @file Guindaste, sem Phaser: o sentido da viga a cada passo e quando o Kiwi foi esmagado
 * nela.
 *
 * A viga sobe e desce, sólida só por cima, e o gerador recusa trajetos com vão de
 * esmagamento. Ainda assim, se algo segurar o Kiwi montado enquanto a viga sobe, ele para a
 * viga ou ela o atravessa por baixo: aí a viga volta e ele, ao Checkpoint, em vez de ficarem
 * travados.
 */

/** Segundos depois de sair de cima da viga em que o Kiwi ainda conta como montado nela. */
export const SEGUNDOS_MONTADO = 0.2;

/** Pixels da viga dentro do Kiwi a partir dos quais ela o está atravessando. */
const FOLGA = 2;

/**
 * @typedef {Object} Retangulo
 * Um corpo de física, em pixels.
 * @property {number} left
 * @property {number} top
 * @property {number} right
 * @property {number} bottom
 */

/**
 * Diz se o Kiwi foi esmagado numa viga: ele estava montado nela há pouco e o topo de uma viga
 * está dentro do seu corpo. Atravessar a viga num pulo de baixo para cima não conta, porque o
 * Kiwi não estava montado.
 *
 * @param {Retangulo} kiwi - O corpo do Kiwi.
 * @param {Retangulo[]} vigas - Os corpos das vigas dos guindastes.
 * @param {number} segundosForaDaViga - Segundos desde a última vez em que o Kiwi esteve
 *   montado numa viga; `Infinity` se nunca esteve.
 * @returns {boolean} Se o Kiwi foi esmagado.
 */
export function esmagadoNoGuindaste(kiwi, vigas, segundosForaDaViga) {
  if (segundosForaDaViga >= SEGUNDOS_MONTADO) return false;
  return vigas.some((viga) => kiwi.right > viga.left && kiwi.left < viga.right
    && kiwi.top < viga.top && kiwi.bottom - viga.top > FOLGA);
}

/**
 * @typedef {Object} EstadoViga
 * @property {number} y - Posição atual da viga, em pixels.
 * @property {number} minY - O alto do trajeto.
 * @property {number} maxY - O baixo do trajeto.
 * @property {1 | -1} sentido - Para onde a viga andava: -1 sobe, 1 desce.
 * @property {boolean} parada - Se a física zerou a velocidade da viga neste passo.
 */

/**
 * Decide para onde a viga anda no próximo passo. Ela só para quando algo a segura (o Kiwi
 * montado e preso contra um teto): aí fica travada e volta, para nunca parar de vez.
 *
 * @param {EstadoViga} viga - Onde a viga está e para onde andava.
 * @returns {{ sentido: 1 | -1, travada: boolean }} O novo sentido e se ela estava travada.
 */
export function moverViga({ y, minY, maxY, sentido, parada }) {
  if (y <= minY) return { sentido: 1, travada: false };
  if (y >= maxY) return { sentido: -1, travada: false };
  return parada ? { sentido: -sentido, travada: true } : { sentido, travada: false };
}
