/**
 * @file Esteira, sem Phaser: a leitura do sentido de um objeto `esteira` do mapa.
 *
 * A esteira é uma área sobre o chão que empurra o Kiwi apoiado nela no sentido marcado: 1 para
 * a direita, -1 para a esquerda. Não fere o Kiwi.
 */

/** Os sentidos que uma esteira pode ter. */
export const SENTIDOS_ESTEIRA = Object.freeze([1, -1]);

/**
 * Lê o sentido de uma esteira, com as propriedades no formato do Tiled (lista de
 * `{ name, value }`) ou já convertidas em objeto.
 *
 * @param {{ properties?: { name: string, value: unknown }[] | Record<string, unknown> }} esteira
 *   - O objeto `esteira` do mapa.
 * @returns {unknown} O sentido declarado, ou `undefined` se a esteira não declara um.
 */
export function sentidoDaEsteira({ properties }) {
  if (Array.isArray(properties)) return properties.find((propriedade) => propriedade.name === 'sentido')?.value;
  return properties?.sentido;
}
