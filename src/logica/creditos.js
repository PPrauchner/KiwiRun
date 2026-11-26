/**
 * @file Créditos, sem Phaser: as seções da tela (grupo, arte e som, código) e as fontes dos
 * Fatos de cada Fase, lidas do arquivo de fontes, para a tela não manter uma lista própria.
 */
import FONTES_FATOS from '../conteudo/fontes-fatos.js';

/**
 * @typedef {Object} SecaoCreditos
 * @property {string} chaveTitulo - Chave do título da seção nos Textos.
 * @property {readonly string[]} chavesLinhas - Chaves das linhas da seção nos Textos.
 */

/**
 * As seções fixas dos Créditos, na ordem. Arte e som creditam só os pacotes Kenney que
 * estão versionados no repositório.
 *
 * @type {readonly SecaoCreditos[]}
 */
export const SECOES_CREDITOS = Object.freeze([
  Object.freeze({ chaveTitulo: 'creditos.grupo', chavesLinhas: Object.freeze(['creditos.grupo.apresentacao']) }),
  Object.freeze({
    chaveTitulo: 'creditos.arte_som',
    chavesLinhas: Object.freeze(['creditos.kenney.pixel_platformer', 'creditos.kenney.digital_audio']),
  }),
  Object.freeze({ chaveTitulo: 'creditos.codigo', chavesLinhas: Object.freeze(['creditos.phaser']) }),
]);

/** As outras chaves da tela: o título, o cabeçalho das fontes dos Fatos e o botão de voltar. */
export const CHAVES_TELA_CREDITOS = Object.freeze(['creditos.titulo', 'creditos.fatos', 'creditos.voltar']);

/**
 * @typedef {Object} FontesDaFase
 * @property {string} chaveNome - Chave do nome da Fase nos Textos.
 * @property {string[]} fontes - As fontes distintas dos Fatos da Fase, na ordem dos Fatos.
 */

/**
 * As fontes dos Fatos agrupadas por Fase, na ordem do catálogo; Fases sem Fato ficam de fora.
 *
 * @param {readonly import('./catalogo.js').Mundo[]} mundos - Os Mundos do Catálogo.
 * @param {Readonly<Record<string, import('../conteudo/fontes-fatos.js').FonteFato>>} [fontes] - A
 *   fonte de cada Fato; o padrão é o arquivo de fontes do jogo.
 * @returns {FontesDaFase[]} As fontes de cada Fase com Fatos.
 */
export function fontesPorFase(mundos, fontes = FONTES_FATOS) {
  return mundos
    .flatMap((mundo) => mundo.fases)
    .filter((fase) => fase.chavesFato.length > 0)
    .map((fase) => ({
      chaveNome: fase.chaveNome,
      fontes: [...new Set(fase.chavesFato.map((chave) => fontes[chave].fonte))],
    }));
}
