/**
 * @file Cena Boot/Preload: carrega os assets comuns e segue para a Tela inicial.
 */
import { PREDADORES, imagemPredador } from '../logica/catalogo.js';

export const FONTE = 'kiwirun';
export const TEXTURA_TILESET = 'tileset';
export const TEXTURA_KIWI = 'kiwi';
export const TEXTURA_SAMAMBAIA = 'samambaia';
export const TEXTURA_OVELHA = 'ovelha';
/** A faixa de ícones de botão das Placas, um quadro 18×18 por botão (ordem de `BOTOES`). */
export const TEXTURA_BOTOES = 'botoes';
/** O mesmo PNG do tileset, fatiado em quadros 18×18 para sprites como a bandeira do Checkpoint. */
export const TEXTURA_QUADROS_TILESET = 'tileset-quadros';

/**
 * @param {string} especie - Espécie de Predador do catálogo.
 * @returns {string} A chave da textura da espécie.
 */
export function texturaPredador(especie) {
  return `predador-${especie}`;
}

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
    this.load.spritesheet(TEXTURA_QUADROS_TILESET, 'assets/tiles/tileset.png', { frameWidth: QUADRO, frameHeight: QUADRO });
    this.load.spritesheet(TEXTURA_KIWI, 'assets/sprites/kiwi.png', { frameWidth: QUADRO, frameHeight: QUADRO });
    this.load.image(TEXTURA_SAMAMBAIA, 'assets/sprites/samambaia.png');
    this.load.image(TEXTURA_OVELHA, 'assets/sprites/ovelha.png');
    this.load.spritesheet(TEXTURA_BOTOES, 'assets/sprites/botoes.png', { frameWidth: QUADRO, frameHeight: QUADRO });
    for (const especie of PREDADORES) this.load.image(texturaPredador(especie), imagemPredador(especie));
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
