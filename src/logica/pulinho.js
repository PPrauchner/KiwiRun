/**
 * @file Pulinho, sem Phaser: o Predador que dá um pulinho quando o Kiwi chega perto.
 *
 * Um pulinho por aproximação: o Kiwi parado perto não o repete; só depois de se afastar
 * para além do alcance, ao chegar de novo.
 */

/**
 * @typedef {import('./catalogo.js').Pulinho} Pulinho
 */

/**
 * @typedef {Object} EstadoPulinho
 * @property {(distancia: number, dt: number) => number} avancar - Avança um passo, com a
 *   distância horizontal até o Kiwi em pixels, e devolve a altura do Predador sobre a
 *   patrulha, em pixels.
 */

/**
 * Cria o pulinho de um Predador.
 *
 * @param {Pulinho} pulinho - Alcance, altura e duração do pulinho.
 * @returns {EstadoPulinho} O pulinho, parado no chão.
 */
export function criarPulinho({ alcance, altura, segundos }) {
  let decorrido = null;
  let armado = true;
  return {
    avancar(distancia, dt) {
      const perto = Math.abs(distancia) <= alcance;
      if (decorrido === null && perto && armado) {
        decorrido = 0;
        armado = false;
      } else if (decorrido !== null) {
        decorrido += dt;
      }
      if (!perto && decorrido === null) armado = true;
      if (decorrido === null) return 0;
      if (decorrido >= segundos) {
        decorrido = null;
        return 0;
      }
      // Parábola: zero na decolagem e no pouso, a altura toda no meio.
      const fracao = decorrido / segundos;
      return 4 * altura * fracao * (1 - fracao);
    },
  };
}
