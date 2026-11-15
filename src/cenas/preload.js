/**
 * @file Cena Boot/Preload: carrega os assets comuns e segue para a Tela inicial.
 */
export const FONTE = 'kiwirun';

export class Preload extends Phaser.Scene {
  constructor() {
    super('preload');
  }

  preload() {
    this.load.bitmapFont(FONTE, 'assets/fonte/kiwirun.png', 'assets/fonte/kiwirun.xml');
  }

  create() {
    this.scene.start('tela-inicial');
  }
}
