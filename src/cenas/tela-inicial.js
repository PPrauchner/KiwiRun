/**
 * @file Tela inicial: "Kia ora!", o convite a apertar um botão, o seletor PT | EN e a versão
 * num canto. Esquerda/direita (setas, D-pad, analógico) alternam o idioma sem sair da tela;
 * confirmar (botão frontal, Start, Enter ou Espaço) abre o Menu.
 */
import { FONTE } from './preload.js';
import { VERSAO } from '../logica/versao.js';
import { criarInput } from '../logica/input.js';
import { lerEntrada } from './entrada.js';
import { criarSeletorIdioma } from '../logica/seletor-idioma.js';

/** Tamanho nativo da fonte bitmap; múltiplos inteiros mantêm a pixel art nítida. */
const TAMANHO_FONTE = 12;
const MARGEM = 6;
const COR_DISCRETA = 0x8899aa;
const COR_IDIOMA_ATUAL = 0xffd166;
/** Espaço entre as siglas do seletor e a barra que as separa. */
const ESPACO_SELETOR = 8;

export class TelaInicial extends Phaser.Scene {
  constructor() {
    super('tela-inicial');
  }

  create() {
    const textos = this.registry.get('textos');
    this.textos = textos;
    const { width: largura, height: altura } = this.scale;

    this.add.bitmapText(largura / 2, altura * 0.38, FONTE, textos.t('tela_inicial.saudacao'), TAMANHO_FONTE * 4)
      .setOrigin(0.5);

    this.aperte = this.add.bitmapText(largura / 2, altura * 0.68, FONTE, textos.t('tela_inicial.aperte'), TAMANHO_FONTE * 2)
      .setOrigin(0.5);
    this.tweens.add({ targets: this.aperte, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });

    this.add.bitmapText(largura - MARGEM, altura - MARGEM, FONTE, textos.t('tela_inicial.versao', { versao: VERSAO }), TAMANHO_FONTE)
      .setOrigin(1)
      .setTint(COR_DISCRETA);

    this.seletor = criarSeletorIdioma(textos);
    this.criarSeletor(largura / 2, altura * 0.84);
    this.entrada = criarInput();
  }

  /**
   * As siglas dos idiomas lado a lado, separadas por barras e centradas em `x`.
   *
   * @param {number} x - O centro do seletor.
   * @param {number} y - A linha do seletor.
   */
  criarSeletor(x, y) {
    const tamanho = TAMANHO_FONTE * 2;
    const partes = [];
    this.siglas = this.seletor.opcoes.map((opcao, indice) => {
      if (indice > 0) partes.push(this.add.bitmapText(0, y, FONTE, '|', tamanho).setTint(COR_DISCRETA));
      const sigla = this.add.bitmapText(0, y, FONTE, opcao.sigla, tamanho);
      partes.push(sigla);
      return sigla;
    });
    const larguraTotal = partes.reduce((soma, parte) => soma + parte.width, 0) + ESPACO_SELETOR * (partes.length - 1);
    let esquerda = x - larguraTotal / 2;
    for (const parte of partes) {
      parte.setOrigin(0, 0.5).setX(esquerda);
      esquerda += parte.width + ESPACO_SELETOR;
    }
    this.pintarSeletor();
  }

  /** Destaca a sigla do idioma atual e apaga as outras. */
  pintarSeletor() {
    this.seletor.opcoes.forEach((opcao, indice) => {
      this.siglas[indice].setTint(opcao.atual ? COR_IDIOMA_ATUAL : COR_DISCRETA);
    });
  }

  /**
   * @param {number} _tempo - Relógio do jogo, em ms (não usado).
   * @param {number} delta - Milissegundos desde o quadro anterior.
   */
  update(_tempo, delta) {
    const acoes = this.entrada.atualizar(lerEntrada(this), delta / 1000);
    if (acoes.confirmar) {
      this.scene.start('menu');
    } else if (this.seletor.atualizar(acoes)) {
      this.aperte.setText(this.textos.t('tela_inicial.aperte'));
      this.pintarSeletor();
    }
  }
}
