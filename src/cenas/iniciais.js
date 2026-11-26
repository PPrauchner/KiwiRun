/**
 * @file Iniciais: só depois de um Novo Recorde, antes do Placar. Mostra o Tempo final e as 3
 * letras, com a letra sob o cursor destacada e sublinhada. Cima/baixo trocam a letra,
 * esquerda/direita movem o cursor, confirmar aceita a letra e, na terceira, grava as
 * Iniciais no Recorde e abre o Placar; Esc volta uma letra. No teclado, digitar A–Z
 * preenche a posição e avança, e as letras não movem nem silenciam. Não dá para pular.
 */
import { FONTE } from './preload.js';
import { criarDigitacao, criarIniciais, QUANTIDADE_INICIAIS, separarDigitacao } from '../logica/iniciais.js';
import { criarInput } from '../logica/input.js';
import { calcularPlacarDaTentativa } from '../logica/placar.js';
import { arredondarDecimos } from '../logica/recorde.js';
import { lerEntrada } from './entrada.js';

/** Tamanho nativo da fonte bitmap; múltiplos inteiros mantêm a pixel art nítida. */
const TAMANHO_FONTE = 12;
const TAMANHO_LETRA = TAMANHO_FONTE * 4;
const TOPO_TITULO = 64;
const TOPO_TEMPO = 108;
const TOPO_INSTRUCAO = 148;
const TOPO_LETRAS = 216;
const ESPACO_LETRAS = 56;
const ALTURA_SUBLINHADO = 4;
const COR_NORMAL = 0xffffff;
const COR_CURSOR = 0xffd166;
const COR_DESTAQUE = 0x9be29b;
const COR_APAGADA = 0x8899aa;

export class Iniciais extends Phaser.Scene {
  constructor() {
    super('iniciais');
  }

  /** @param {import('./placar.js').DadosPlacar} dados - A tentativa que fez o Novo Recorde. */
  init(dados) {
    this.dados = dados;
  }

  create() {
    const textos = this.registry.get('textos');
    const { width: largura } = this.scale;
    const { tempoFinal } = calcularPlacarDaTentativa(this.dados);

    this.add.bitmapText(largura / 2, TOPO_TITULO, FONTE, textos.t('iniciais.titulo'), TAMANHO_FONTE * 2)
      .setOrigin(0.5)
      .setTint(COR_CURSOR);
    this.add.bitmapText(largura / 2, TOPO_TEMPO, FONTE, textos.tempo(arredondarDecimos(tempoFinal)), TAMANHO_FONTE * 2)
      .setOrigin(0.5)
      .setTint(COR_DESTAQUE);
    this.add.bitmapText(largura / 2, TOPO_INSTRUCAO, FONTE, textos.t('iniciais.instrucao'), TAMANHO_FONTE)
      .setOrigin(0.5)
      .setTint(COR_APAGADA);

    const primeiraX = largura / 2 - ESPACO_LETRAS * (QUANTIDADE_INICIAIS - 1) / 2;
    this.letras = Array.from({ length: QUANTIDADE_INICIAIS }, (_, indice) => this.add
      .bitmapText(primeiraX + indice * ESPACO_LETRAS, TOPO_LETRAS, FONTE, '', TAMANHO_LETRA)
      .setOrigin(0.5));
    this.sublinhado = this.add.rectangle(0, TOPO_LETRAS + TAMANHO_LETRA / 2 + ALTURA_SUBLINHADO, TAMANHO_LETRA * 0.75, ALTURA_SUBLINHADO, COR_CURSOR);

    this.iniciais = criarIniciais();
    this.entrada = criarInput();
    this.digitacao = criarDigitacao();
    this.redesenhar();
  }

  /** As letras atuais, com a do cursor destacada e sublinhada. */
  redesenhar() {
    const { letras, posicao } = this.iniciais;
    this.letras.forEach((texto, indice) => {
      texto.setText(letras[indice]).setTint(indice === posicao ? COR_CURSOR : COR_NORMAL);
    });
    this.sublinhado.setX(this.letras[posicao].x);
  }

  /**
   * @param {number} _tempo - Relógio do jogo, em ms (não usado).
   * @param {number} delta - Milissegundos desde o quadro anterior.
   */
  update(_tempo, delta) {
    const dt = delta / 1000;
    const { estado, letras } = separarDigitacao(lerEntrada(this));
    const acoes = this.entrada.atualizar(estado, dt);
    const gravadas = this.iniciais.atualizar(acoes, this.digitacao.atualizar(letras, dt));
    if (gravadas) {
      this.registry.get('recordes').gravarIniciais(this.dados.faseId, gravadas);
      this.scene.start('placar', this.dados);
    } else {
      this.redesenhar();
    }
  }
}
