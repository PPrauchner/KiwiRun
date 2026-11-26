/**
 * @file Descrição da Fase Pecuária para o gerador: trechos de chão e vãos, da esquerda
 * para a direita, plataformas de mão única, Itens (lã no pasto, leite na ordenha),
 * Checkpoints, as três Samambaias-prateadas, os Predadores com suas patrulhas, as Ovelhas
 * com seus trajetos e as Placas do início. Alturas em tiles, contadas da base do mapa.
 *
 * Percurso: o início ensina a Captura (um rato sozinho em chão plano, depois da Placa) e o
 * pulo segurado (a Placa antes de um degrau que só ele vence); seguem a ordenha, o pasto das
 * Ovelhas, o vão largo, a ordenha do arminho, o vão com subida e o pasto final. Há um
 * Checkpoint antes de cada trecho difícil (os vãos), todos a poucos segundos uns dos
 * outros, bem abaixo de ~20 s de percurso.
 */
export default {
  altura: 20,
  trechos: [
    { chao: 20, altura: 3 },
    { chao: 8, altura: 6 },
    { vao: 3 },
    { chao: 16, altura: 4 },
    { vao: 4 },
    { chao: 10, altura: 4 },
    { chao: 6, altura: 2 },
    { vao: 3 },
    { chao: 12, altura: 4 },
    { chao: 14, altura: 3 },
  ],
  plataformas: [
    { coluna: 38, largura: 4, alturaSobreChao: 3 },
    { coluna: 74, largura: 5, alturaSobreChao: 3 },
  ],
  // Antes do vão do pasto, do vão largo e do vão com subida.
  checkpoints: [26, 45, 64],
  placas: [
    { coluna: 5, chave: 'placa.capturar', acao: 'pular' },
    { coluna: 16, chave: 'placa.pular_alto', acao: 'pular' },
  ],
  // O rato do início fica sozinho, em chão plano, para a primeira Captura.
  predadores: [
    { especie: 'rato', de: 9, ate: 14 },
    { especie: 'arminho', de: 52, ate: 59 },
    { especie: 'gamba', de: 71, ate: 79 },
  ],
  // No pasto, sob a plataforma alta e com o chão livre em volta: sem vão de esmagamento.
  ovelhas: [
    { de: 33, ate: 44 },
    { de: 84, ate: 92 },
  ],
  itens: [
    { coluna: 4, item: 'la', alturaSobreChao: 1 },
    { coluna: 11, item: 'la', alturaSobreChao: 2 },
    { coluna: 15, item: 'la', alturaSobreChao: 1 },
    { coluna: 22, item: 'leite', alturaSobreChao: 1 },
    { coluna: 25, item: 'leite', alturaSobreChao: 1 },
    { coluna: 32, item: 'la', alturaSobreChao: 1 },
    { coluna: 36, item: 'la', alturaSobreChao: 3 },
    { coluna: 40, item: 'la', alturaSobreChao: 4 },
    { coluna: 43, item: 'la', alturaSobreChao: 3 },
    { coluna: 52, item: 'leite', alturaSobreChao: 1 },
    { coluna: 56, item: 'leite', alturaSobreChao: 2 },
    { coluna: 59, item: 'leite', alturaSobreChao: 1 },
    { coluna: 65, item: 'leite', alturaSobreChao: 1 },
    { coluna: 72, item: 'leite', alturaSobreChao: 1 },
    { coluna: 76, item: 'leite', alturaSobreChao: 4 },
    { coluna: 86, item: 'la', alturaSobreChao: 3 },
    { coluna: 89, item: 'la', alturaSobreChao: 1 },
    { coluna: 91, item: 'la', alturaSobreChao: 3 },
  ],
  // Em escada: no caminho, depois do degrau; sobre a plataforma do pasto, fora do caminho
  // mas à vista; e escondida numa folhagem atrás do início, para quem volta.
  samambaias: [
    { coluna: 24, chave: 'fato.pecuaria.1', alturaSobreChao: 1 },
    { coluna: 39, chave: 'fato.pecuaria.2', alturaSobreChao: 4 },
    { coluna: 0, chave: 'fato.pecuaria.3', alturaSobreChao: 1, escondida: true },
  ],
};
