/**
 * @file Créditos: o grupo, a arte e o som (Kenney, CC0) e o código (Phaser) à esquerda; as
 * fontes dos Fatos de cada Fase à direita, lidas do arquivo de fontes. Esc ou confirmar no
 * botão "Voltar" levam de volta ao Menu.
 */
import { FONTE } from './preload.js';
import { MUNDOS } from '../logica/catalogo.js';
import { fontesPorFase, SECOES_CREDITOS } from '../logica/creditos.js';
import { criarInput } from '../logica/input.js';
import { lerEntrada } from './entrada.js';
import { criarVigiaInatividade } from './inatividade.js';
import { criarControleSilencio } from './silencio.js';
import { tocarMusica } from './musica.js';
import { ANDAMENTO_BASE } from '../logica/musica.js';

/** Tamanho nativo da fonte bitmap; múltiplos inteiros mantêm a pixel art nítida. */
const TAMANHO_FONTE = 12;
const TOPO_TITULO = 28;
const TOPO_COLUNAS = 68;
const ALTURA_LINHA = 18;
/** Espaço extra antes de cada seção. */
const ESPACO_SECAO = 10;
const X_ESQUERDA = 32;
const X_DIREITA = 352;
const LARGURA_COLUNA = 272;
const BASE_VOLTAR = 24;
const COR_TITULO_SECAO = 0x9be29b;
const COR_CURSOR = 0xffd166;
const COR_APAGADA = 0x8899aa;

export class Creditos extends Phaser.Scene {
  constructor() {
    super('creditos');
  }

  create() {
    const textos = this.registry.get('textos');
    const t = (chave) => textos.t(chave);
    const { width: largura, height: altura } = this.scale;

    this.add.bitmapText(largura / 2, TOPO_TITULO, FONTE, t('creditos.titulo'), TAMANHO_FONTE * 2).setOrigin(0.5);

    let y = TOPO_COLUNAS;
    for (const secao of SECOES_CREDITOS) {
      y = this.escrever(X_ESQUERDA, y, t(secao.chaveTitulo), COR_TITULO_SECAO);
      for (const chave of secao.chavesLinhas) y = this.escrever(X_ESQUERDA, y, t(chave));
      y += ESPACO_SECAO;
    }

    y = this.escrever(X_DIREITA, TOPO_COLUNAS, t('creditos.fatos'), COR_TITULO_SECAO);
    for (const { chaveNome, fontes } of fontesPorFase(MUNDOS)) {
      y = this.escrever(X_DIREITA, y, t(chaveNome), COR_APAGADA);
      for (const fonte of fontes) y = this.escrever(X_DIREITA, y, fonte);
      y += ESPACO_SECAO;
    }

    this.add.bitmapText(largura / 2, altura - BASE_VOLTAR, FONTE, t('creditos.voltar'), TAMANHO_FONTE)
      .setOrigin(0.5)
      .setTint(COR_CURSOR);

    this.entrada = criarInput();
    this.silencio = criarControleSilencio(this);
    tocarMusica(this, ANDAMENTO_BASE);
    this.inatividade = criarVigiaInatividade(this);
  }

  /**
   * Escreve um texto numa coluna, quebrando as linhas na largura dela.
   *
   * @param {number} x - A coluna.
   * @param {number} y - O topo do texto.
   * @param {string} texto - O texto.
   * @param {number} [cor] - A cor do texto; sem ela, branco.
   * @returns {number} O topo da linha seguinte.
   */
  escrever(x, y, texto, cor = 0xffffff) {
    const objeto = this.add.bitmapText(x, y, FONTE, texto, TAMANHO_FONTE).setMaxWidth(LARGURA_COLUNA).setTint(cor);
    return y + Math.max(ALTURA_LINHA, objeto.height + ALTURA_LINHA - TAMANHO_FONTE);
  }

  /**
   * @param {number} _tempo - Relógio do jogo, em ms (não usado).
   * @param {number} delta - Milissegundos desde o quadro anterior.
   */
  update(_tempo, delta) {
    const acoes = this.entrada.atualizar(lerEntrada(this), delta / 1000);
    if (this.inatividade.atualizar(this.entrada.segundosSemInput)) return;
    this.silencio.atualizar(acoes);
    if (acoes.voltar || acoes.confirmar) this.scene.start('menu');
  }
}
