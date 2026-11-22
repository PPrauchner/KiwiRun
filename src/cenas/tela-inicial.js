/**
 * @file Tela inicial: "Kia ora!", o convite a apertar um botão e a versão num canto;
 * confirmar (botão frontal, Start, Enter ou Espaço) abre a Pecuária.
 */
import { FONTE } from './preload.js';
import { VERSAO } from '../logica/versao.js';
import { criarInput } from '../logica/input.js';
import { lerEntrada } from './entrada.js';

/** Tamanho nativo da fonte bitmap; múltiplos inteiros mantêm a pixel art nítida. */
const TAMANHO_FONTE = 12;
const MARGEM = 6;
const COR_DISCRETA = 0x8899aa;
/** A Fase que confirmar abre, até o Menu chegar. */
const FASE_INICIAL = 'pecuaria';

export class TelaInicial extends Phaser.Scene {
  constructor() {
    super('tela-inicial');
  }

  create() {
    const textos = this.registry.get('textos');
    const { width: largura, height: altura } = this.scale;

    this.add.bitmapText(largura / 2, altura * 0.38, FONTE, textos.t('tela_inicial.saudacao'), TAMANHO_FONTE * 4)
      .setOrigin(0.5);

    const aperte = this.add.bitmapText(largura / 2, altura * 0.68, FONTE, textos.t('tela_inicial.aperte'), TAMANHO_FONTE * 2)
      .setOrigin(0.5);
    this.tweens.add({ targets: aperte, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });

    this.add.bitmapText(largura - MARGEM, altura - MARGEM, FONTE, textos.t('tela_inicial.versao', { versao: VERSAO }), TAMANHO_FONTE)
      .setOrigin(1)
      .setTint(COR_DISCRETA);

    this.entrada = criarInput();
  }

  /**
   * @param {number} _tempo - Relógio do jogo, em ms (não usado).
   * @param {number} delta - Milissegundos desde o quadro anterior.
   */
  update(_tempo, delta) {
    if (this.entrada.atualizar(lerEntrada(this), delta / 1000).confirmar) {
      this.scene.start('fase', { faseId: FASE_INICIAL });
    }
  }
}
