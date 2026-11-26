/**
 * @file Ovelha, sem Phaser: decide quando o Kiwi ficou preso numa Ovelha.
 *
 * A Ovelha é plataforma móvel de mão única e o gerador recusa trajetos com vão de
 * esmagamento; ainda assim, se o Kiwi ficar prensado em cima dela (montado e bloqueado por
 * cima ou pelos lados) por tempo demais, ele volta ao Checkpoint em vez de ficar travado.
 */

/** Segundos seguidos prensado sobre uma Ovelha até o Kiwi contar como preso. */
export const SEGUNDOS_PRESO = 0.5;

/**
 * @typedef {Object} VigiaPreso
 * @property {(dt: number, prensado: boolean) => boolean} atualizar - Avança `dt` segundos
 *   com o Kiwi prensado ou não; devolve `true` uma vez quando ele fica preso, e recomeça.
 */

/**
 * Cria o vigia que conta o tempo seguido do Kiwi prensado sobre uma Ovelha.
 *
 * @returns {VigiaPreso} O vigia, zerado.
 */
export function criarVigiaPreso() {
  let segundos = 0;
  return {
    atualizar(dt, prensado) {
      segundos = prensado ? segundos + dt : 0;
      if (segundos < SEGUNDOS_PRESO) return false;
      segundos = 0;
      return true;
    },
  };
}
