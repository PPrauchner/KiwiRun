/**
 * @file Descrição da Fase Porto para o gerador: o cais de concreto com o mar nos vãos, da
 * esquerda para a direita, as pilhas de contêiner, as esteiras e os guindastes, os Itens
 * (Kiwifruta e caixas de exportação), os Checkpoints, as três Samambaias-prateadas, os
 * Predadores e a Placa do início. Alturas em tiles, contadas da base do mapa.
 *
 * Percurso: o início ensina a pular nos Predadores (a Placa antes de um rato sozinho em chão
 * plano) e sobe as primeiras pilhas de contêiner; seguem a esteira que leva à direita, o
 * guindaste que sobe ao cais alto do arminho, a esteira que empurra de volta (com o gambá
 * depois dela) e o último cais, onde um guindaste leva ao alto dos contêineres. Há um
 * Checkpoint antes de cada trecho difícil, todos a poucos segundos uns dos outros.
 */
export default {
  altura: 20,
  piso: 'cais',
  trechos: [
    { chao: 24, altura: 3 },
    { vao: 3 },
    { chao: 15, altura: 3 },
    { vao: 4 },
    { chao: 9, altura: 3 },
    { chao: 9, altura: 6 },
    { vao: 3 },
    { chao: 14, altura: 4 },
    { vao: 3 },
    { chao: 14, altura: 4 },
  ],
  plataformas: [],
  conteineres: [
    { coluna: 16, largura: 2, altura: 2 },
    { coluna: 19, largura: 2, altura: 3 },
    { coluna: 90, largura: 2, altura: 3 },
  ],
  // A primeira leva à direita, a favor do caminho; a segunda empurra de volta.
  esteiras: [
    { de: 29, ate: 39, sentido: 1 },
    { de: 68, ate: 74, sentido: -1 },
  ],
  // O primeiro sobe ao cais alto, que o pulo também vence; o segundo, ao alto dos contêineres.
  guindastes: [
    { coluna: 51, largura: 3, baixo: 1, alto: 3 },
    { coluna: 88, largura: 2, baixo: 1, alto: 3 },
  ],
  // Antes do primeiro vão, do vão largo, do vão depois do cais alto e do último cais.
  checkpoints: [22, 47, 67, 85],
  placas: [
    { coluna: 5, chave: 'placa.capturar', acao: 'pular' },
  ],
  // O rato do início fica sozinho, em chão plano, depois da Placa.
  predadores: [
    { especie: 'rato', de: 9, ate: 14 },
    { especie: 'arminho', de: 57, ate: 62 },
    { especie: 'gamba', de: 75, ate: 80 },
  ],
  itens: [
    { coluna: 4, item: 'kiwifruta', alturaSobreChao: 1 },
    { coluna: 11, item: 'kiwifruta', alturaSobreChao: 2 },
    { coluna: 14, item: 'kiwifruta', alturaSobreChao: 1 },
    { coluna: 17, item: 'caixa', alturaSobreChao: 3 },
    { coluna: 20, item: 'caixa', alturaSobreChao: 4 },
    { coluna: 31, item: 'kiwifruta', alturaSobreChao: 1 },
    { coluna: 34, item: 'kiwifruta', alturaSobreChao: 1 },
    { coluna: 37, item: 'kiwifruta', alturaSobreChao: 1 },
    { coluna: 40, item: 'caixa', alturaSobreChao: 2 },
    { coluna: 48, item: 'caixa', alturaSobreChao: 1 },
    { coluna: 52, item: 'kiwifruta', alturaSobreChao: 4 },
    { coluna: 56, item: 'kiwifruta', alturaSobreChao: 1 },
    { coluna: 60, item: 'kiwifruta', alturaSobreChao: 2 },
    { coluna: 70, item: 'caixa', alturaSobreChao: 1 },
    { coluna: 73, item: 'caixa', alturaSobreChao: 1 },
    { coluna: 77, item: 'kiwifruta', alturaSobreChao: 2 },
    { coluna: 86, item: 'kiwifruta', alturaSobreChao: 1 },
    { coluna: 93, item: 'caixa', alturaSobreChao: 1 },
  ],
  // Em escada: sobre a primeira esteira, no caminho; no alto dos últimos contêineres, fora do
  // caminho mas à vista; e escondida numa folhagem na ponta do cais alto, depois do arminho.
  samambaias: [
    { coluna: 36, chave: 'fato.porto.1', alturaSobreChao: 3 },
    { coluna: 90, chave: 'fato.porto.2', alturaSobreChao: 4 },
    { coluna: 63, chave: 'fato.porto.3', alturaSobreChao: 1, escondida: true },
  ],
};
