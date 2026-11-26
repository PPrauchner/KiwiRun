/**
 * @file Inatividade, sem Phaser: decide, a partir do tempo sem input do Input, quando o aviso
 * "Ainda está aí?" aparece e quando acontece a Volta por inatividade.
 */

/** Segundos sem input até a Volta por inatividade. */
export const SEGUNDOS_VOLTA = 60;
/** Segundos finais antes da Volta em que o aviso aparece, com a contagem. */
export const SEGUNDOS_AVISO = 10;

/**
 * @typedef {Object} TemposInatividade
 * @property {number} [segundosVolta] - Segundos até a Volta; padrão `SEGUNDOS_VOLTA`.
 * @property {number} [segundosAviso] - Duração do aviso; padrão `SEGUNDOS_AVISO`.
 */

/**
 * @typedef {Object} EstadoInatividade
 * @property {number | null} contagem - Os segundos que faltam para a Volta, arredondados
 *   para cima, enquanto o aviso deve aparecer; `null` sem aviso.
 * @property {boolean} volta - Se é hora da Volta por inatividade.
 */

/**
 * @param {number} segundosSemInput - Segundos desde o último input (o do Input).
 * @param {TemposInatividade} [tempos] - Os tempos; injetáveis para o smoke não esperar 60 s.
 * @returns {EstadoInatividade} O aviso e a Volta neste instante.
 */
export function avaliarInatividade(segundosSemInput, { segundosVolta = SEGUNDOS_VOLTA, segundosAviso = SEGUNDOS_AVISO } = {}) {
  if (segundosSemInput >= segundosVolta) return { contagem: null, volta: true };
  const faltam = segundosVolta - segundosSemInput;
  return { contagem: faltam <= segundosAviso ? Math.ceil(faltam) : null, volta: false };
}
