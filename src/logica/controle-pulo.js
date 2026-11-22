/**
 * @file Controle do pulo do Kiwi, sem Phaser: coyote time, jump buffer e pulo variável.
 *
 * A cena chama `atualizar` a cada passo de física com o estado do corpo e do botão, e
 * aplica a velocidade vertical devolvida.
 */
import { FISICA } from './pulo.js';

/**
 * @typedef {Object} EntradaPulo
 * @property {number} dt - Segundos desde o passo anterior.
 * @property {boolean} noChao - O corpo está apoiado em algo.
 * @property {boolean} apertou - O botão de pular foi apertado neste passo.
 * @property {boolean} segurando - O botão de pular está pressionado.
 * @property {number} vy - Velocidade vertical atual (negativa sobe).
 */

/**
 * @typedef {Object} ControlePulo
 * @property {(entrada: EntradaPulo) => number} atualizar - Devolve a nova velocidade vertical.
 * @property {() => number} quicar - Quique da Captura: devolve a velocidade de um pulo, que
 *   soltar o botão corta como no pulo variável.
 */

/**
 * Cria o controle do pulo de um Kiwi.
 *
 * @param {typeof FISICA} [fisica] - A física usada; o padrão é a do jogo.
 * @returns {ControlePulo} O controle, começando no ar e sem aperto pendente.
 */
export function criarControlePulo(fisica = FISICA) {
  let tempoForaDoChao = Infinity;
  let tempoDesdeAperto = Infinity;
  let subindoDoPulo = false;

  return {
    atualizar({ dt, noChao, apertou, segurando, vy }) {
      tempoForaDoChao = noChao ? 0 : tempoForaDoChao + dt;
      tempoDesdeAperto = apertou ? 0 : tempoDesdeAperto + dt;

      const podePular = tempoForaDoChao <= fisica.coyoteTime;
      const querPular = tempoDesdeAperto <= fisica.jumpBuffer;
      if (podePular && querPular) {
        tempoForaDoChao = Infinity;
        tempoDesdeAperto = Infinity;
        subindoDoPulo = true;
        return -fisica.velocidadePulo;
      }

      if (subindoDoPulo && (!segurando || vy >= 0)) {
        subindoDoPulo = false;
        if (vy < -fisica.velocidadeCorte) return -fisica.velocidadeCorte;
      }
      return vy;
    },
    quicar() {
      tempoForaDoChao = Infinity;
      subindoDoPulo = true;
      return -fisica.velocidadePulo;
    },
  };
}
