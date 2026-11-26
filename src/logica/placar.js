/**
 * @file Placar, sem Phaser: o Tempo final a partir do Tempo gasto e dos descontos por Item,
 * por Captura e por Samambaia-prateada, nunca negativo.
 */

/**
 * @typedef {Object} Descontos
 * @property {number} item - Segundos descontados por Item.
 * @property {number} captura - Segundos descontados por Captura.
 * @property {number} samambaia - Segundos descontados por Samambaia-prateada.
 */

/**
 * Descontos do jogo, provisórios até o playtest; recalibrá-los sobe a versão dos Recordes.
 *
 * Mantêm a proporção 1:2:5 do design (~1 s, ~2 s, ~5 s), reduzida para que o desconto
 * máximo de cada Fase caiba no teto de 50% do tempo de referência: na Pecuária, 18 Itens,
 * 4 Predadores e 3 Samambaias-prateadas a ~1/~2/~5 s somariam 41 s.
 *
 * @type {Readonly<Descontos>}
 */
export const DESCONTOS = Object.freeze({ item: 0.3, captura: 0.6, samambaia: 1.5 });

/**
 * @typedef {Object} Resultado
 * @property {number} tempoGasto - Segundos do Tempo gasto.
 * @property {number} itens - Itens coletados.
 * @property {number} capturas - Capturas feitas.
 * @property {number} samambaias - Samambaias-prateadas pegas.
 */

/**
 * @typedef {Object} Placar
 * @property {number} tempoGasto - O Tempo gasto, em segundos.
 * @property {number} descontoItens - Segundos descontados pelos Itens.
 * @property {number} descontoCapturas - Segundos descontados pelas Capturas.
 * @property {number} descontoSamambaias - Segundos descontados pelas Samambaias-prateadas.
 * @property {number} desconto - A soma dos descontos.
 * @property {number} tempoFinal - O Tempo gasto menos o desconto, nunca negativo.
 */

/**
 * Calcula o Placar de uma tentativa.
 *
 * @param {Resultado} resultado - O que a tentativa fez.
 * @param {Descontos} [descontos] - Os segundos descontados por coletável e por Captura; o
 *   padrão são os do jogo.
 * @returns {Placar} O Placar.
 */
export function calcularPlacar({ tempoGasto, itens, capturas, samambaias }, descontos = DESCONTOS) {
  const descontoItens = itens * descontos.item;
  const descontoCapturas = capturas * descontos.captura;
  const descontoSamambaias = samambaias * descontos.samambaia;
  const desconto = descontoItens + descontoCapturas + descontoSamambaias;
  return {
    tempoGasto,
    descontoItens,
    descontoCapturas,
    descontoSamambaias,
    desconto,
    tempoFinal: Math.max(0, tempoGasto - desconto),
  };
}
