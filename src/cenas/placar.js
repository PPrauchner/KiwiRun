/**
 * @file Placar: o resultado ao fim de uma Fase, no idioma atual. À esquerda o Tempo gasto, os
 * descontos e o Tempo final; à direita os Itens por tipo ("Lã 5/8") e as Capturas por
 * espécie ("Arminho ×2"); abaixo os Fatos encontrados, "???" para os que faltaram com um
 * convite a achar a Samambaia-prateada, e as opções "Próxima Fase" (só com uma
 * disponível), "Jogar de novo" (pré-selecionada) e "Menu". Esc vai ao Menu. Num Novo
 * Recorde, "Novo Recorde!" aparece no alto, à direita do título.
 *
 * "Jogar de novo" e "Próxima Fase" reabrem a cena Fase do zero; o Input da Fase trava o
 * pulo que vinha segurado do Placar.
 */
import { FONTE } from './preload.js';
import { buscarFase, chaveNomeItem, chaveNomePredador, proximaFase } from '../logica/catalogo.js';
import { LARGURA_FATO } from '../logica/fila-fatos.js';
import { criarInput } from '../logica/input.js';
import { chaveOpcaoPlacar, criarMenuPlacar } from '../logica/menu-placar.js';
import { calcularPlacarDaTentativa } from '../logica/placar.js';
import { arredondarDecimos } from '../logica/recorde.js';
import { lerEntrada } from './entrada.js';
import { criarVigiaInatividade } from './inatividade.js';
import { criarControleSilencio } from './silencio.js';
import { tocarMusica } from './musica.js';
import { ANDAMENTO_BASE } from '../logica/musica.js';

/**
 * @typedef {import('../logica/placar.js').Tentativa & { novoRecorde: boolean }} DadosPlacar
 */

/** Tamanho nativo da fonte bitmap; múltiplos inteiros mantêm a pixel art nítida. */
const TAMANHO_FONTE = 12;
const TOPO_TITULO = 20;
const TOPO_RESUMO = 48;
const ALTURA_LINHA = 16;
const X_ESQUERDA = 48;
const X_VALORES = 304;
const X_DIREITA = 352;
const TOPO_FATOS = 144;
/** Cada Fato ocupa até 2 linhas na largura da faixa do HUD. */
const ALTURA_FATO = 28;
const TOPO_OPCOES = 324;
const ESPACO_OPCOES = 32;
const COR_NORMAL = 0xffffff;
const COR_CURSOR = 0xffd166;
const COR_DESTAQUE = 0x9be29b;
const COR_APAGADA = 0x8899aa;

export class Placar extends Phaser.Scene {
  constructor() {
    super('placar');
  }

  /** @param {DadosPlacar} dados - O que a tentativa fez. */
  init(dados) {
    this.dados = dados;
  }

  create() {
    this.textos = this.registry.get('textos');
    const { faseId, itens, capturas, fatosEncontrados, novoRecorde } = this.dados;
    const fase = buscarFase(faseId);
    this.placar = calcularPlacarDaTentativa(this.dados);

    const { width: largura } = this.scale;
    this.texto(largura / 2, TOPO_TITULO, this.textos.t('placar.titulo'), TAMANHO_FONTE * 2).setOrigin(0.5);
    if (novoRecorde) {
      this.texto(largura - X_ESQUERDA, TOPO_TITULO, this.textos.t('placar.novo_recorde')).setOrigin(1, 0.5).setTint(COR_CURSOR);
    }
    this.criarResumo();
    this.criarContagens(itens, capturas);
    this.criarFatos(fase.chavesFato, fatosEncontrados);

    this.menu = criarMenuPlacar({ faseId, proximaFaseId: proximaFase(faseId)?.id ?? null });
    this.criarOpcoes();
    this.entrada = criarInput();
    this.silencio = criarControleSilencio(this);
    tocarMusica(this, ANDAMENTO_BASE);
    this.inatividade = criarVigiaInatividade(this);
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

  /**
   * @param {number} segundos - Um tempo, em segundos.
   * @returns {string} O tempo no formato do idioma atual.
   */
  tempo(segundos) {
    return this.textos.tempo(segundos);
  }

  /** Tempo gasto, um desconto por linha e o Tempo final, com os valores alinhados à direita. */
  criarResumo() {
    const { placar } = this;
    const linhas = [
      // Em décimos arredondados, como o Tempo final: a conta da tela fecha.
      ['placar.tempo_gasto', this.tempo(arredondarDecimos(placar.tempoGasto))],
      ['placar.desconto_itens', `-${this.tempo(placar.descontoItens)}`],
      ['placar.desconto_capturas', `-${this.tempo(placar.descontoCapturas)}`],
      ['placar.desconto_samambaias', `-${this.tempo(placar.descontoSamambaias)}`],
      // Em décimos arredondados, como o Recorde o grava.
      ['placar.tempo_final', this.tempo(arredondarDecimos(placar.tempoFinal))],
    ];
    linhas.forEach(([chave, valor], indice) => {
      const y = TOPO_RESUMO + indice * ALTURA_LINHA;
      const final = indice === linhas.length - 1;
      const cor = final ? COR_DESTAQUE : COR_NORMAL;
      this.texto(X_ESQUERDA, y, this.textos.t(chave)).setTint(cor);
      this.texto(X_VALORES, y, valor).setOrigin(1, 0).setTint(cor);
    });
  }

  /**
   * @param {DadosPlacar['itens']} itens - Itens por tipo.
   * @param {DadosPlacar['capturas']} capturas - Capturas por espécie.
   */
  criarContagens(itens, capturas) {
    const linhas = [
      ...itens.map(({ item, coletados, total }) => this.textos.t('placar.contagem', {
        nome: this.textos.t(chaveNomeItem(item)), feitos: String(coletados), total: String(total),
      })),
      ...capturas.map(({ especie, quantidade }) => this.textos.t('placar.capturas_especie', {
        nome: this.textos.t(chaveNomePredador(especie)), quantidade: String(quantidade),
      })),
    ];
    linhas.forEach((linha, indice) => this.texto(X_DIREITA, TOPO_RESUMO + indice * ALTURA_LINHA, linha));
  }

  /**
   * Os Fatos da Fase na ordem do catálogo: o texto dos encontrados, "???" dos outros.
   *
   * @param {readonly string[]} chavesFato - Os Fatos da Fase.
   * @param {readonly string[]} encontrados - Os Fatos encontrados.
   */
  criarFatos(chavesFato, encontrados) {
    const { width: largura } = this.scale;
    this.texto(X_ESQUERDA, TOPO_FATOS, this.textos.t('placar.fatos')).setTint(COR_APAGADA);
    chavesFato.forEach((chave, indice) => {
      const achou = encontrados.includes(chave);
      const linha = this.texto(largura / 2, TOPO_FATOS + ALTURA_LINHA + indice * ALTURA_FATO, this.textos.t(achou ? chave : 'placar.fato_faltando'))
        .setOrigin(0.5, 0)
        .setCenterAlign()
        .setMaxWidth(LARGURA_FATO);
      if (!achou) linha.setTint(COR_APAGADA);
    });
    if (chavesFato.some((chave) => !encontrados.includes(chave))) {
      const y = TOPO_FATOS + ALTURA_LINHA + chavesFato.length * ALTURA_FATO;
      this.texto(largura / 2, y, this.textos.t('placar.convite')).setOrigin(0.5, 0).setTint(COR_CURSOR);
    }
  }

  /** As opções numa linha, centrada embaixo. */
  criarOpcoes() {
    const linhas = this.menu.opcoes.map((opcao) => this.texto(0, TOPO_OPCOES, this.textos.t(chaveOpcaoPlacar(opcao))));
    const total = linhas.reduce((soma, linha) => soma + linha.width, 0) + ESPACO_OPCOES * (linhas.length - 1);
    let x = (this.scale.width - total) / 2;
    for (const linha of linhas) {
      linha.setX(x);
      x += linha.width + ESPACO_OPCOES;
    }
    this.linhasOpcoes = linhas;
  }

  /** Pinta a opção sob o cursor. */
  redesenhar() {
    this.menu.opcoes.forEach((opcao, indice) => {
      this.linhasOpcoes[indice].setTint(opcao === this.menu.opcao ? COR_CURSOR : COR_NORMAL);
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
