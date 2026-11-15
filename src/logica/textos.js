/**
 * @file Textos (i18n): um dicionário por idioma e lookup no idioma atual. PT é o padrão.
 *
 * O idioma vive só em memória: o jogo sempre abre em PT.
 */
import pt from '../conteudo/textos/pt.js';
import en from '../conteudo/textos/en.js';

/** @typedef {Record<string, string>} Dicionario */

/** Dicionários do jogo, por código de idioma. */
export const DICIONARIOS = Object.freeze({ pt, en });

export const IDIOMA_PADRAO = 'pt';

/**
 * @typedef {Object} Textos
 * @property {string} idioma - O idioma atual.
 * @property {(idioma: string) => void} definirIdioma - Troca o idioma atual.
 * @property {(chave: string, parametros?: Record<string, string>) => string} t - O texto da chave no idioma atual.
 */

/**
 * Cria o lookup de textos sobre os dicionários dados.
 *
 * Uma chave ausente devolve a própria chave, para aparecer na tela em vez de quebrar o jogo;
 * o teste de paridade PT/EN impede que isso chegue ao evento.
 *
 * @param {Record<string, Dicionario>} [dicionarios] - Dicionários por idioma; o padrão são os do jogo.
 * @returns {Textos} O lookup, começando em PT.
 */
export function criarTextos(dicionarios = DICIONARIOS) {
  let idioma = IDIOMA_PADRAO;

  return {
    get idioma() {
      return idioma;
    },
    definirIdioma(novo) {
      if (!Object.hasOwn(dicionarios, novo)) {
        throw new Error(`Idioma desconhecido: ${novo}`);
      }
      idioma = novo;
    },
    t(chave, parametros = {}) {
      const modelo = dicionarios[idioma][chave] ?? chave;
      return modelo.replace(/\{(\w+)\}/g, (trecho, nome) => parametros[nome] ?? trecho);
    },
  };
}
