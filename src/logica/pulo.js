/**
 * @file Constantes do pulo, em tiles, e a física do Kiwi derivada delas.
 *
 * Fonte única: a cena Fase lê a física daqui e o gerador de mapas lê a altura e o
 * alcance, para nunca desenhar um vão ou degrau que o Kiwi não vence.
 */

/** Lado do tile, em pixels (grade do Kenney Pixel Platformer). */
export const TILE = 18;

/**
 * Altura e alcance máximos do pulo, em tiles: segurando o botão, e num toque curto.
 * O alcance é a distância horizontal, correndo, entre sair do chão e voltar à mesma altura.
 */
export const PULO = Object.freeze({
  segurado: Object.freeze({ altura: 3, alcance: 5 }),
  curto: Object.freeze({ altura: 1, alcance: 2 }),
});

/** Segundos do chão ao ápice no pulo segurado; define o "peso" do Kiwi. */
const TEMPO_ATE_APICE = 0.36;

/** Folga sobre as constantes, para o pulo real vencê-las com sobra a 60 passos/s. */
const FOLGA = 1.1;

const ALTURA_SEGURADO = PULO.segurado.altura * TILE * FOLGA;
const GRAVIDADE = (2 * ALTURA_SEGURADO) / TEMPO_ATE_APICE ** 2;

/**
 * Física do Kiwi, em pixels e segundos.
 *
 * `velocidadeCorte` é a velocidade de subida que sobra ao soltar o botão: um toque
 * sobe só a altura curta.
 */
export const FISICA = Object.freeze({
  passosPorSegundo: 60,
  gravidade: GRAVIDADE,
  velocidadePulo: Math.sqrt(2 * GRAVIDADE * ALTURA_SEGURADO),
  velocidadeCorte: Math.sqrt(2 * GRAVIDADE * PULO.curto.altura * TILE * FOLGA),
  velocidadeAndar: (PULO.segurado.alcance * TILE * FOLGA) / (2 * TEMPO_ATE_APICE),
  /** Segundos em que o pulo ainda vale depois de sair da beirada. */
  coyoteTime: 0.1,
  /** Segundos em que um aperto antes de tocar o chão ainda vira pulo. */
  jumpBuffer: 0.1,
});
