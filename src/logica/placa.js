/**
 * @file Placa, sem Phaser: os botões que cada ação ensinada mostra e a leitura da ação de
 * um objeto `placa` do mapa.
 *
 * A Placa é um objeto genérico do mapa (a chave do texto no tipo, a ação na propriedade
 * `acao`), reaproveitado em qualquer Fase: ensinar outra ação é só dar a ela seus botões aqui
 * e os quadros na faixa de botões gerada por script.
 */

/** Quadros da faixa de ícones de botão, na ordem do PNG gerado. */
export const BOTOES = Object.freeze(['espaco', 'a']);

/** Botões de cada ação que uma Placa ensina: o do teclado e o do 8BitDo. */
export const BOTOES_DA_ACAO = Object.freeze({
  pular: Object.freeze(['espaco', 'a']),
});

/**
 * Lê a ação de uma Placa, com as propriedades no formato do Tiled (lista de
 * `{ name, value }`) ou já convertidas em objeto.
 *
 * @param {{ properties?: { name: string, value: unknown }[] | Record<string, unknown> }} placa
 *   - O objeto `placa` do mapa.
 * @returns {string | undefined} A ação, ou `undefined` se a Placa não declara uma.
 */
export function acaoDaPlaca({ properties }) {
  if (Array.isArray(properties)) return properties.find((propriedade) => propriedade.name === 'acao')?.value;
  return properties?.acao;
}
