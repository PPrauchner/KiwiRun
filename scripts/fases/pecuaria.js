/**
 * @file Descrição da Fase Pecuária para o gerador: trechos de chão e vãos, da esquerda
 * para a direita, plataformas de mão única, Itens (lã no pasto, leite na ordenha),
 * Checkpoints e as três Samambaias-prateadas. Alturas em tiles, contadas da base do mapa.
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
  checkpoints: [26, 44, 66],
  itens: [
    { coluna: 6, item: 'la', alturaSobreChao: 1 },
    { coluna: 9, item: 'la', alturaSobreChao: 1 },
    { coluna: 12, item: 'la', alturaSobreChao: 2 },
    { coluna: 18, item: 'la', alturaSobreChao: 1 },
    { coluna: 21, item: 'la', alturaSobreChao: 1 },
    { coluna: 27, item: 'leite', alturaSobreChao: 1 },
    { coluna: 35, item: 'leite', alturaSobreChao: 4 },
    { coluna: 37, item: 'leite', alturaSobreChao: 4 },
    { coluna: 40, item: 'la', alturaSobreChao: 1 },
    { coluna: 46, item: 'leite', alturaSobreChao: 1 },
    { coluna: 49, item: 'leite', alturaSobreChao: 1 },
    { coluna: 57, item: 'la', alturaSobreChao: 1 },
    { coluna: 59, item: 'la', alturaSobreChao: 2 },
    { coluna: 67, item: 'leite', alturaSobreChao: 1 },
    { coluna: 70, item: 'leite', alturaSobreChao: 1 },
    { coluna: 74, item: 'leite', alturaSobreChao: 4 },
    { coluna: 80, item: 'la', alturaSobreChao: 1 },
    { coluna: 83, item: 'la', alturaSobreChao: 1 },
  ],
  // Em escada: no caminho, depois do primeiro vão; sobre a plataforma do pasto, fora do
  // caminho mas à vista; e escondida num arbusto atrás do início, para quem volta.
  samambaias: [
    { coluna: 17, chave: 'fato.pecuaria.1', alturaSobreChao: 1 },
    { coluna: 36, chave: 'fato.pecuaria.2', alturaSobreChao: 4 },
    { coluna: 0, chave: 'fato.pecuaria.3', alturaSobreChao: 1, escondida: true },
  ],
};
