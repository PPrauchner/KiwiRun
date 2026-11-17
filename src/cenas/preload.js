/**
 * @file Cena Boot/Preload: carrega os assets comuns e segue para a Tela inicial.
 */
export const FONTE = 'kiwirun';
export const TEXTURA_TILESET = 'tileset';
export const TEXTURA_KIWI = 'kiwi';

/** Lado de um quadro de sprite, em pixels (a grade dos tiles). */
const QUADRO = 18;
const QUADROS_ANDAR = Object.freeze([1, 2]);
const QUADROS_POR_SEGUNDO_ANDAR = 8;

export class Preload extends Phaser.Scene {
  constructor() {
    super('preload');
  }

  preload() {
    this.load.bitmapFont(FONTE, 'assets/fonte/kiwirun.png', 'assets/fonte/kiwirun.xml');
    this.load.image(TEXTURA_TILESET, 'assets/tiles/tileset.png');
    this.load.spritesheet(TEXTURA_KIWI, 'assets/sprites/kiwi.png', { frameWidth: QUADRO, frameHeight: QUADRO });
  }

  create() {
    this.anims.create({
      key: 'kiwi-andar',
      frames: this.anims.generateFrameNumbers(TEXTURA_KIWI, { frames: [...QUADROS_ANDAR] }),
      frameRate: QUADROS_POR_SEGUNDO_ANDAR,
      repeat: -1,
    });
    this.scene.start('tela-inicial');
  }
}
