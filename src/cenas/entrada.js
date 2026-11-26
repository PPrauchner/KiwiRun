/**
 * @file Ponte entre o navegador e o Input unificado: lê o estado bruto de um quadro.
 */

/**
 * O estado bruto do quadro: as teclas do registro do jogo e os gamepads ligados.
 *
 * Só a cena ativa lê, uma vez por quadro: a leitura consome os toques do teclado.
 *
 * @param {Phaser.Scene} cena - A cena que lê, com o registro `teclado` do jogo.
 * @returns {import('../logica/input.js').EstadoBruto} O estado bruto.
 */
export function lerEntrada(cena) {
  return {
    teclas: cena.registry.get('teclado').ler(),
    gamepads: navigator.getGamepads?.() ?? [],
  };
}
