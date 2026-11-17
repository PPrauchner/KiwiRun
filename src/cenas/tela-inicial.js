/**
 * @file Tela inicial: "Kia ora!", o convite a apertar um botão e a versão num canto;
 * qualquer tecla abre a Pecuária.
 */
import { FONTE } from './preload.js';
import { VERSAO } from '../logica/versao.js';

/** Tamanho nativo da fonte bitmap; múltiplos inteiros mantêm a pixel art nítida. */
const TAMANHO_FONTE = 12;
const MARGEM = 6;
const COR_DISCRETA = 0x8899aa;
/** A Fase que qualquer tecla abre, até o Menu chegar. */
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

    // Ignora a repetição de uma tecla que já vinha segurada da Fase.
    const teclado = this.input.keyboard;
    const abrirFase = (evento) => {
      if (evento.repeat) return;
      teclado.off('keydown', abrirFase);
      this.scene.start('fase', { faseId: FASE_INICIAL });
    };
    teclado.on('keydown', abrirFase);
  }
}
