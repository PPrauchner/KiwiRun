/**
 * @file Menu: "Aotearoa" no título, os Mundos à esquerda (com Créditos e Voltar abaixo) e
 * as Fases do Mundo selecionado à direita, com a coluna de Recorde. Tudo vem do Catálogo
 * de Mundos: um Mundo ou Fase novo no catálogo aparece aqui sem mudar a cena.
 *
 * Mundos e Fases "em breve" e a opção desabilitada aparecem apagados e o cursor não os
 * seleciona. Confirmar numa Fase a abre; Voltar ou Esc levam à Tela inicial. O Recorde
 * mostra as Iniciais e o Tempo final ("ABC 42,3 s"), ou "—" até existir.
 */
import { FONTE } from './preload.js';
import { MUNDOS } from '../logica/catalogo.js';
import { chaveOpcao, criarMenu, OPCOES } from '../logica/menu.js';
import { criarInput } from '../logica/input.js';
import { textoRecorde } from '../logica/recorde.js';
import { lerEntrada } from './entrada.js';
import { criarVigiaInatividade } from './inatividade.js';
import { criarControleSilencio } from './silencio.js';

/** Tamanho nativo da fonte bitmap; múltiplos inteiros mantêm a pixel art nítida. */
const TAMANHO_FONTE = 12;
const TOPO_TITULO = 36;
const TOPO_LISTAS = 96;
const ALTURA_LINHA = 22;
const X_MUNDOS = 48;
const X_FASES = 336;
const X_RECORDE = 592;
const COR_NORMAL = 0xffffff;
const COR_CURSOR = 0xffd166;
const COR_SELECIONADO = 0x9be29b;
const COR_APAGADA = 0x667788;

export class Menu extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create() {
    this.textos = this.registry.get('textos');
    const { width: largura } = this.scale;

    this.add.bitmapText(largura / 2, TOPO_TITULO, FONTE, this.textos.t('menu.titulo'), TAMANHO_FONTE * 3).setOrigin(0.5);
    this.add.bitmapText(X_RECORDE, TOPO_LISTAS - ALTURA_LINHA, FONTE, this.textos.t('menu.recorde'), TAMANHO_FONTE)
      .setOrigin(1, 0)
      .setTint(COR_APAGADA);

    this.menu = criarMenu(MUNDOS);
    this.linhasMundos = MUNDOS.map((mundo, indice) => this.criarLinha(X_MUNDOS, indice, mundo.chaveNome, mundo.emBreve));
    this.linhasOpcoes = OPCOES.map((opcao, indice) => this.criarLinha(X_MUNDOS, MUNDOS.length + 1 + indice, chaveOpcao(opcao), false));
    /** @type {Phaser.GameObjects.BitmapText[]} */
    this.linhasFases = [];
    /** Tudo o que a coluna de Fases desenhou, para remontá-la. */
    this.objetosFases = [];
    this.mundoMostrado = null;
    this.entrada = criarInput();
    this.silencio = criarControleSilencio(this);
    this.inatividade = criarVigiaInatividade(this);
    this.redesenhar();
  }

  /**
   * Uma linha de lista: o nome e, se em breve, a marca "em breve" ao lado.
   *
   * @param {number} x - A coluna.
   * @param {number} linha - O número da linha, a partir do topo das listas.
   * @param {string} chave - A chave do nome nos Textos.
   * @param {boolean} emBreve - Se leva a marca "em breve".
   * @param {Phaser.GameObjects.GameObject[]} [criados] - Recebe os objetos criados.
   * @returns {Phaser.GameObjects.BitmapText} O texto do nome.
   */
  criarLinha(x, linha, chave, emBreve, criados = []) {
    const y = TOPO_LISTAS + linha * ALTURA_LINHA;
    const nome = this.add.bitmapText(x, y, FONTE, this.textos.t(chave), TAMANHO_FONTE);
    criados.push(nome);
    if (emBreve) {
      const marca = this.add.bitmapText(x + nome.width + TAMANHO_FONTE / 2, y, FONTE, `(${this.textos.t('menu.em_breve')})`, TAMANHO_FONTE);
      criados.push(marca.setTint(COR_APAGADA));
    }
    return nome;
  }

  /** Remonta a coluna de Fases quando o Mundo selecionado muda. */
  mostrarFases() {
    if (this.mundoMostrado === this.menu.mundo) return;
    this.mundoMostrado = this.menu.mundo;
    for (const objeto of this.objetosFases) objeto.destroy();
    this.objetosFases = [];
    this.linhasFases = this.menu.mundo.fases.map((fase, indice) => {
      const nome = this.criarLinha(X_FASES, indice, fase.chaveNome, fase.emBreve, this.objetosFases);
      if (!fase.emBreve) {
        const texto = textoRecorde(this.registry.get('recordes').ler(fase.id), this.textos);
        const recorde = this.add.bitmapText(X_RECORDE, nome.y, FONTE, texto, TAMANHO_FONTE);
        this.objetosFases.push(recorde.setOrigin(1, 0));
      }
      return nome;
    });
  }

  /** Pinta cada linha conforme o cursor, a seleção e o "em breve". */
  redesenhar() {
    this.mostrarFases();
    const { menu } = this;
    MUNDOS.forEach((mundo, indice) => {
      const linha = this.linhasMundos[indice];
      if (mundo.emBreve) linha.setTint(COR_APAGADA);
      else if (menu.coluna === 'mundos' && menu.opcao === null && menu.mundo === mundo) linha.setTint(COR_CURSOR);
      else linha.setTint(menu.mundo === mundo ? COR_SELECIONADO : COR_NORMAL);
    });
    OPCOES.forEach((opcao, indice) => {
      const cor = opcao.desabilitada ? COR_APAGADA : menu.opcao === opcao.id ? COR_CURSOR : COR_NORMAL;
      this.linhasOpcoes[indice].setTint(cor);
    });
    menu.mundo.fases.forEach((fase, indice) => {
      const cor = fase.emBreve ? COR_APAGADA : menu.fase === fase ? COR_CURSOR : COR_NORMAL;
      this.linhasFases[indice].setTint(cor);
    });
  }

  /**
   * @param {number} _tempo - Relógio do jogo, em ms (não usado).
   * @param {number} delta - Milissegundos desde o quadro anterior.
   */
  update(_tempo, delta) {
    const acoes = this.entrada.atualizar(lerEntrada(this), delta / 1000);
    if (this.inatividade.atualizar(this.entrada.segundosSemInput)) return;
    this.silencio.atualizar(acoes);
    const destino = this.menu.atualizar(acoes);
    if (destino?.tela === 'fase') this.scene.start('fase', { faseId: destino.faseId });
    else if (destino) this.scene.start(destino.tela);
    else this.redesenhar();
  }
}
