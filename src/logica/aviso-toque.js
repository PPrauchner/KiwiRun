/**
 * @file Aviso de toque, sem Phaser: decide se a Tela inicial mostra "Jogue no computador".
 *
 * O jogo não tem controles de toque; sem mouse nem touchpad (nenhum ponteiro fino), o
 * aparelho é tratado como de toque e o aviso aparece. Qualquer tecla segue mesmo assim.
 */

/** A media query de algum ponteiro fino (mouse, touchpad) disponível. */
export const CONSULTA_PONTEIRO_FINO = '(any-pointer: fine)';

/**
 * Diz se o aviso de toque deve aparecer.
 *
 * @param {((consulta: string) => { matches: boolean }) | undefined} matchMedia - O
 *   `window.matchMedia`, ou `undefined` se o navegador não o tiver (aí não há aviso).
 * @returns {boolean} Se nenhum ponteiro fino está disponível.
 */
export function deveAvisarToque(matchMedia) {
  if (typeof matchMedia !== 'function') return false;
  return !matchMedia(CONSULTA_PONTEIRO_FINO).matches;
}
