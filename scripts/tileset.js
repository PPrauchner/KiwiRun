/**
 * @file O tileset das Fases: onde cada tile fica no PNG e quais têm propriedades.
 *
 * Lido pelo gerador de Fases (ids e propriedades) e pelo gerador do PNG (o desenho).
 * Provisório: gerado por script até o Kenney Pixel Platformer entrar no repositório;
 * a troca muda só a imagem e os ids daqui.
 */

/** Ids (base 0) dos tiles no PNG. */
export const TILES = Object.freeze({
  grama: 0,
  terra: 1,
  plataforma: 2,
  cerca: 3,
  bandeira: 4,
  nuvem: 5,
  arbusto: 6,
  mastro: 7,
});

export const COLUNAS = 4;
export const QUANTIDADE = 8;

/** Caminho do PNG a partir da raiz do repositório. */
export const IMAGEM = 'assets/tiles/tileset.png';

/** Nome do tileset no `.tmj` e chave da textura no Phaser. */
export const NOME = 'tileset';

/** Tiles atravessáveis por baixo: o Kiwi sobe por eles e pousa em cima. */
export const UMA_MAO = Object.freeze([TILES.plataforma]);
