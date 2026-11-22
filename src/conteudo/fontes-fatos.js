/**
 * @file Fonte de cada Fato, por chave: todo Fato do jogo é verdadeiro e tem de onde veio.
 * Os textos ficam nos arquivos de cada idioma; aqui fica só a fonte, mostrada nos Créditos.
 *
 * `provisorio` marca um Fato ainda não validado pelo autor, que será trocado.
 */

/**
 * @typedef {Object} FonteFato
 * @property {string} fonte - De onde o Fato veio.
 * @property {boolean} provisorio - Se o Fato ainda aguarda validação do autor.
 */

const ANUNCIO_HALTER = 'Anúncio da Série E da Halter (mar/2026)';

/** @type {Readonly<Record<string, FonteFato>>} */
export default Object.freeze({
  'fato.pecuaria.1': { fonte: ANUNCIO_HALTER, provisorio: true },
  'fato.pecuaria.2': { fonte: ANUNCIO_HALTER, provisorio: true },
  'fato.pecuaria.3': { fonte: ANUNCIO_HALTER, provisorio: true },
});
