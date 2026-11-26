/**
 * @file O tileset das Fases: onde cada tile fica no PNG e quais têm propriedades.
 *
 * Lido pelo gerador de Fases (ids e propriedades). A imagem é o `tilemap_packed.png` do
 * Kenney Pixel Platformer 1.2 (CC0), sem margem nem espaçamento; a licença fica ao lado.
 */

/** Ids (base 0) dos tiles no PNG. */
export const TILES = Object.freeze({
  grama: 22,
  terra: 122,
  plataforma: 146,
  cerca: 106,
  bandeira: 111,
  nuvem: 156,
  arbusto: 124,
  mastro: 131,
  /** Placa de madeira lisa, sobre um poste. */
  placa: 86,
  /** Copa de árvore de um tile só: cobre por inteiro o que estiver atrás. */
  folhagem: 16,
});

export const COLUNAS = 20;
export const QUANTIDADE = 180;

/** Licença do pacote Kenney, versionada ao lado da imagem. */
export const LICENCA = 'assets/tiles/LICENSE-kenney.txt';

/** Caminho do PNG a partir da raiz do repositório. */
export const IMAGEM = 'assets/tiles/tileset.png';

/** Nome do tileset no `.tmj` e chave da textura no Phaser. */
export const NOME = 'tileset';

/** Tiles atravessáveis por baixo: o Kiwi sobe por eles e pousa em cima. */
export const UMA_MAO = Object.freeze([TILES.plataforma]);
