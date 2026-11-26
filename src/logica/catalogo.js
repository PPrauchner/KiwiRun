/**
 * @file Catálogo de Mundos: dados declarativos dos Mundos e das Fases, sem Phaser.
 *
 * Um Mundo novo entra só com dados (mapas, Itens, Fatos, textos), sem mexer no núcleo.
 * Nomes visíveis são chaves dos Textos, nunca texto solto.
 */

/**
 * @typedef {Object} Fase
 * @property {string} id
 * @property {string} chaveNome - Chave do nome da Fase nos Textos.
 * @property {boolean} emBreve - Aparece no menu, mas ainda não pode ser jogada.
 * @property {string | null} mapa - Caminho do `.tmj`, a partir da raiz do site.
 * @property {string[]} itens - Ids dos Itens do tema.
 * @property {string[]} chavesFato - Chaves dos Fatos revelados pelas Samambaias-prateadas.
 * @property {number | null} tempoReferencia - Tempo de referência, em segundos.
 * @property {number | null} andamento - Andamento da música na Fase, em batidas por minuto;
 *   `null` toca o andamento base.
 */

/**
 * @typedef {Object} Mundo
 * @property {string} id - O Assunto do Mundo.
 * @property {string} chaveNome - Chave do nome do Mundo nos Textos.
 * @property {boolean} emBreve
 * @property {Fase[]} fases
 */

/**
 * Uma Fase ainda "em breve": só o nome, sem mapa.
 *
 * @param {string} id - Id da Fase.
 * @returns {Fase} A Fase em breve.
 */
function faseEmBreve(id) {
  return { id, chaveNome: `fase.${id}`, emBreve: true, mapa: null, itens: [], chavesFato: [], tempoReferencia: null, andamento: null };
}

/**
 * Um Mundo ainda "em breve", sem Fases.
 *
 * @param {string} id - Id do Assunto.
 * @returns {Mundo} O Mundo em breve.
 */
function mundoEmBreve(id) {
  return { id, chaveNome: `mundo.${id}`, emBreve: true, fases: [] };
}

/** @type {readonly Mundo[]} */
export const MUNDOS = Object.freeze([
  mundoEmBreve('geografia'),
  mundoEmBreve('culinaria'),
  mundoEmBreve('curiosidades'),
  mundoEmBreve('historia'),
  {
    id: 'economia-tecnologia',
    chaveNome: 'mundo.economia-tecnologia',
    emBreve: false,
    fases: [
      {
        id: 'pecuaria',
        chaveNome: 'fase.pecuaria',
        emBreve: false,
        mapa: 'assets/mapas/pecuaria.tmj',
        itens: ['la', 'leite'],
        chavesFato: ['fato.pecuaria.1', 'fato.pecuaria.2', 'fato.pecuaria.3'],
        // Provisório até o playtest, pelo comprimento do percurso: 92 tiles andando dão
        // ~12 s; com pulos, Capturas e a volta à Samambaia-prateada escondida, ~30 s.
        tempoReferencia: 30,
        // Mais rápido que o andamento base das telas: a Fase pede pressa.
        andamento: 140,
      },
      {
        id: 'porto',
        chaveNome: 'fase.porto',
        emBreve: false,
        mapa: 'assets/mapas/porto.tmj',
        itens: ['kiwifruta', 'caixa'],
        chavesFato: ['fato.porto.1', 'fato.porto.2', 'fato.porto.3'],
        // Provisório até o playtest, pelo comprimento do percurso, como na Pecuária: 98 tiles
        // andando dão ~13 s; com pulos, guindastes, esteiras e Capturas, ~30 s.
        tempoReferencia: 30,
        // O andamento da Pecuária: o Porto também pede pressa.
        andamento: 140,
      },
      faseEmBreve('foguete'),
    ],
  },
  mundoEmBreve('fauna-flora'),
]);

/**
 * Espécies de Predador: mamíferos invasores reais da NZ. No mapa, o objeto `predador`
 * leva a espécie no tipo.
 *
 * @type {readonly string[]}
 */
export const PREDADORES = Object.freeze(['arminho', 'gamba', 'rato']);

/**
 * @param {string} especie - Espécie de Predador do catálogo.
 * @returns {string} A chave do nome da espécie nos Textos.
 */
export function chaveNomePredador(especie) {
  return `predador.${especie}`;
}

/**
 * Caminho do sprite de uma espécie de Predador, gerado por script, a partir da raiz do site.
 *
 * @param {string} especie - Espécie de Predador do catálogo.
 * @returns {string} O caminho do PNG 18×18.
 */
export function imagemPredador(especie) {
  return `assets/sprites/predadores/${especie}.png`;
}

/**
 * Busca uma Fase pelo id, em qualquer Mundo.
 *
 * @param {string} id - Id da Fase.
 * @returns {Fase} A Fase.
 * @throws {Error} Se nenhum Mundo tem essa Fase.
 */
export function buscarFase(id) {
  const fase = MUNDOS.flatMap((mundo) => mundo.fases).find((candidata) => candidata.id === id);
  if (!fase) throw new Error(`Fase desconhecida: ${id}`);
  return fase;
}

/**
 * A Fase seguinte a uma Fase, no mesmo Mundo, se já pode ser jogada.
 *
 * @param {string} id - Id da Fase atual.
 * @param {readonly Mundo[]} [mundos] - Os Mundos; o padrão é o catálogo do jogo.
 * @returns {Fase | null} A próxima Fase, ou `null` se é a última do Mundo ou está em breve.
 */
export function proximaFase(id, mundos = MUNDOS) {
  const { fases } = mundos.find((mundo) => mundo.fases.some((fase) => fase.id === id));
  const seguinte = fases[fases.findIndex((fase) => fase.id === id) + 1];
  return seguinte && !seguinte.emBreve ? seguinte : null;
}

/**
 * @param {string} item - Id do Item.
 * @returns {string} A chave do nome do Item nos Textos.
 */
export function chaveNomeItem(item) {
  return `item.${item}`;
}

/**
 * Caminho do sprite de um Item, gerado por script, a partir da raiz do site.
 *
 * @param {string} item - Id do Item.
 * @returns {string} O caminho do PNG 18×18.
 */
export function imagemItem(item) {
  return `assets/sprites/itens/${item}.png`;
}
