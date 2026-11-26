/**
 * @file Pausa: aberta por cima da Fase, que fica congelada por baixo (jogo, cronômetro e Fila
 * de Fatos param junto com a cena). Lista "Continuar", "Reiniciar a Fase", "Controles" e
 * "Menu" no idioma atual; "Controles" troca a lista pela tabela do 8BitDo e do teclado.
 *
 * "Continuar" (ou Start/Esc) devolve a Fase como estava; "Reiniciar a Fase" a reabre do zero
 * pelo mesmo caminho do "Jogar de novo" do Placar, e o Input da Fase trava o pulo segurado.
 */
import { FONTE } from './preload.js';
import { criarInput } from '../logica/input.js';
import { chaveOpcaoPausa, criarMenuPausa, LINHAS_CONTROLES } from '../logica/menu-pausa.js';
import { lerEntrada } from './entrada.js';

/** Tamanho nativo da fonte bitmap; múltiplos inteiros mantêm a pixel art nítida. */
const TAMANHO_FONTE = 12;
const TOPO_TITULO = 64;
const TOPO_OPCOES = 128;
const ALTURA_LINHA = 24;
/** Colunas da tabela de Controles: o que faz, o 8BitDo e o teclado. */
const X_ACAO = 96;
const X_8BITDO = 240;
const X_TECLADO = 432;
const COR_VEU = 0x1b2a3a;
const OPACIDADE_VEU = 0.85;
const COR_NORMAL = 0xffffff;
const COR_CURSOR = 0xffd166;
const COR_APAGADA = 0x8899aa;

export class Pausa extends Phaser.Scene {
  constructor() {
    super('pausa');
  }

  /** @param {{ faseId: string }} dados - A Fase pausada. */
  init({ faseId }) {
    this.faseId = faseId;
  }

  create() {
    this.textos = this.registry.get('textos');
    const { width: largura, height: altura } = this.scale;
    this.add.rectangle(0, 0, largura, altura, COR_VEU, OPACIDADE_VEU).setOrigin(0);

    this.menu = criarMenuPausa();
    this.titulo = this.texto(largura / 2, TOPO_TITULO, '', TAMANHO_FONTE * 2).setOrigin(0.5);
    this.linhasOpcoes = this.menu.opcoes.map((opcao, indice) => (
      this.texto(largura / 2, TOPO_OPCOES + indice * ALTURA_LINHA, this.textos.t(chaveOpcaoPausa(opcao))).setOrigin(0.5, 0)
    ));
    this.controles = this.criarControles();
    // Sem o bloqueio de ~0,5 s: Start/Esc fecham logo; só o que veio segurado fica travado.
    this.entrada = criarInput({ segundosBloqueio: 0 });
    this.redesenhar();
  }

  /**
   * @param {number} x - Coluna.
   * @param {number} y - Linha.
   * @param {string} texto - O texto já traduzido.
   * @param {number} [tamanho] - Tamanho da fonte.
   * @returns {Phaser.GameObjects.BitmapText} O texto na tela.
   */
  texto(x, y, texto, tamanho = TAMANHO_FONTE) {
    return this.add.bitmapText(x, y, FONTE, texto, tamanho);
  }

  /** @returns {Phaser.GameObjects.BitmapText[]} A tabela de Controles, com o "Voltar" embaixo. */
  criarControles() {
    const t = (chave) => this.textos.t(chave);
    const cabecalho = [
      this.texto(X_8BITDO, TOPO_OPCOES, t('controles.8bitdo')).setTint(COR_APAGADA),
      this.texto(X_TECLADO, TOPO_OPCOES, t('controles.teclado')).setTint(COR_APAGADA),
    ];
    const linhas = LINHAS_CONTROLES.flatMap(({ chaveAcao, chave8BitDo, chaveTeclado }, indice) => {
      const y = TOPO_OPCOES + (indice + 1) * ALTURA_LINHA;
      return [this.texto(X_ACAO, y, t(chaveAcao)), this.texto(X_8BITDO, y, t(chave8BitDo)), this.texto(X_TECLADO, y, t(chaveTeclado))];
    });
    const yFechar = TOPO_OPCOES + (LINHAS_CONTROLES.length + 2) * ALTURA_LINHA;
    const fechar = this.texto(this.scale.width / 2, yFechar, t('controles.fechar')).setOrigin(0.5, 0).setTint(COR_CURSOR);
    return [...cabecalho, ...linhas, fechar];
  }

  /** Mostra a lista de opções ou os Controles, com a opção sob o cursor pintada. */
  redesenhar() {
    const { mostrandoControles } = this.menu;
    this.titulo.setText(this.textos.t(mostrandoControles ? 'controles.titulo' : 'pausa.titulo'));
    for (const objeto of this.controles) objeto.setVisible(mostrandoControles);
    this.menu.opcoes.forEach((opcao, indice) => {
      this.linhasOpcoes[indice].setVisible(!mostrandoControles).setTint(opcao === this.menu.opcao ? COR_CURSOR : COR_NORMAL);
    });
  }

  /**
   * @param {number} _tempo - Relógio do jogo, em ms (não usado).
   * @param {number} delta - Milissegundos desde o quadro anterior.
   */
  update(_tempo, delta) {
    const destino = this.menu.atualizar(this.entrada.atualizar(lerEntrada(this), delta / 1000));
    if (destino === 'continuar') {
      this.scene.resume('fase');
      this.scene.stop();
    } else if (destino === 'reiniciar') {
      this.scene.start('fase', { faseId: this.faseId });
    } else if (destino === 'menu') {
      this.scene.stop('fase');
      this.scene.start('menu');
    } else {
      this.redesenhar();
    }
  }
}
