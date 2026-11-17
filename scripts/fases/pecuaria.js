/**
 * @file Descrição da Fase Pecuária para o gerador: trechos de chão e vãos, da esquerda
 * para a direita, e plataformas de mão única. Alturas em tiles, contadas da base do mapa.
 */
export default {
  altura: 20,
  trechos: [
    { chao: 14, altura: 3 },
    { vao: 2 },
    { chao: 8, altura: 3 },
    { chao: 6, altura: 5 },
    { vao: 3 },
    { chao: 10, altura: 4 },
    { chao: 8, altura: 2 },
    { vao: 4 },
    { chao: 6, altura: 3 },
    { vao: 3 },
    { chao: 12, altura: 5 },
    { chao: 16, altura: 3 },
  ],
  plataformas: [
    { coluna: 34, largura: 4, alturaSobreChao: 3 },
    { coluna: 50, largura: 3, alturaSobreChao: 3 },
    { coluna: 72, largura: 5, alturaSobreChao: 3 },
  ],
};
