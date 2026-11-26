/**
 * @file Seletor de idioma da Tela inicial (PT | EN), sem Phaser.
 *
 * Esquerda ou direita (setas, D-pad, analógico) passam ao idioma seguinte daquele lado, dando
 * a volta: com dois idiomas, qualquer toque alterna. A troca vale nos Textos, só em memória.
 */
import { DICIONARIOS } from './textos.js';

/** Chave da sigla de cada idioma, lida no dicionário do próprio idioma. */
const CHAVE_SIGLA = 'idioma.sigla';

/**
 * @typedef {Object} OpcaoIdioma
 * @property {string} idioma - O código do idioma.
 * @property {string} sigla - Como o idioma aparece no seletor, por exemplo `PT`.
 * @property {boolean} atual - Se é o idioma atual dos Textos.
 */

/**
 * @typedef {Object} SeletorIdioma
 * @property {OpcaoIdioma[]} opcoes - Os idiomas, na ordem dos dicionários.
 * @property {(acoes: import('./input.js').Acoes) => boolean} atualizar - Lê as ações de
 *   um quadro e diz se o idioma mudou.
 */

/**
 * Cria o seletor sobre os Textos do jogo, começando no idioma em que eles estão.
 *
 * @param {import('./textos.js').Textos} textos - Os Textos cujo idioma o seletor troca.
 * @param {Record<string, import('./textos.js').Dicionario>} [dicionarios] - Os idiomas
 *   oferecidos; o padrão são os do jogo.
 * @returns {SeletorIdioma} O seletor.
 */
export function criarSeletorIdioma(textos, dicionarios = DICIONARIOS) {
  const idiomas = Object.keys(dicionarios);
  let horizontalAnterior = 0;

  return {
    get opcoes() {
      return idiomas.map((idioma) => ({
        idioma,
        sigla: dicionarios[idioma][CHAVE_SIGLA],
        atual: idioma === textos.idioma,
      }));
    },
    atualizar({ horizontal }) {
      // Só o toque novo conta: segurar a direção não fica trocando a cada quadro.
      const tocou = horizontal !== 0 && horizontal !== horizontalAnterior;
      horizontalAnterior = horizontal;
      if (!tocou) return false;
      const atual = idiomas.indexOf(textos.idioma);
      textos.definirIdioma(idiomas[(atual + horizontal + idiomas.length) % idiomas.length]);
      return true;
    },
  };
}
