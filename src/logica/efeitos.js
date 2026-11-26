/**
 * @file Efeitos sonoros do jogo, sem Phaser: o `.ogg` de cada ação, todos do pacote Kenney
 * Digital Audio (CC0), versionados em `assets/sons/` com a licença ao lado.
 */

/** @typedef {'pular' | 'coletar' | 'capturar' | 'samambaia'} Efeito */

/** O arquivo de cada efeito, pela ação que o toca. */
export const EFEITOS = Object.freeze({
  pular: 'assets/sons/phaseJump1.ogg',
  coletar: 'assets/sons/pepSound1.ogg',
  capturar: 'assets/sons/lowDown.ogg',
  samambaia: 'assets/sons/powerUp1.ogg',
});

export const LICENCA_EFEITOS = 'assets/sons/LICENSE-kenney.txt';

/**
 * @param {Efeito} efeito - A ação.
 * @returns {string} A chave do áudio do efeito no Phaser.
 */
export function chaveEfeito(efeito) {
  return `efeito-${efeito}`;
}
