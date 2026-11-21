/**
 * @file Cronômetro do Tempo gasto, sem Phaser: começa no primeiro input, pausa junto com
 * a Pausa, para ao tocar o fim e zera ao reiniciar a Fase.
 *
 * A cena chama `avancar` a cada quadro com os segundos passados; o cronômetro só os soma
 * enquanto está correndo.
 */

/** @typedef {'esperando' | 'correndo' | 'pausado' | 'parado'} EstadoCronometro */

/**
 * @typedef {Object} Cronometro
 * @property {number} segundos - O Tempo gasto até agora.
 * @property {boolean} iniciado - Se o primeiro input já aconteceu.
 * @property {() => void} registrarInput - Um mover ou pular; o primeiro dá a partida.
 * @property {(dt: number) => void} avancar - Soma `dt` segundos se estiver correndo.
 * @property {() => void} pausar - Congela a contagem (Pausa).
 * @property {() => void} retomar - Volta a contar depois da Pausa.
 * @property {() => void} parar - Encerra a contagem ao tocar o fim; nada a reabre além de zerar.
 * @property {() => void} zerar - Volta a zero, esperando de novo o primeiro input.
 */

/**
 * Cria um cronômetro parado em zero, esperando o primeiro input.
 *
 * @returns {Cronometro} O cronômetro.
 */
export function criarCronometro() {
  let segundos = 0;
  /** @type {EstadoCronometro} */
  let estado = 'esperando';

  return {
    get segundos() {
      return segundos;
    },
    get iniciado() {
      return estado !== 'esperando';
    },
    registrarInput() {
      if (estado === 'esperando') estado = 'correndo';
    },
    avancar(dt) {
      if (estado === 'correndo') segundos += dt;
    },
    pausar() {
      if (estado === 'correndo') estado = 'pausado';
    },
    retomar() {
      if (estado === 'pausado') estado = 'correndo';
    },
    parar() {
      if (estado !== 'esperando') estado = 'parado';
    },
    zerar() {
      segundos = 0;
      estado = 'esperando';
    },
  };
}

/**
 * Formata um Tempo gasto para o HUD e o Placar: `m:ss.d`, truncado no décimo.
 *
 * @param {number} segundos - O tempo, em segundos.
 * @returns {string} O tempo formatado, por exemplo `1:05.9`.
 */
export function formatarTempo(segundos) {
  // Arredonda a 1e-6 antes de truncar, para 7.3 não virar 7.2999… e mostrar 7.2.
  const decimos = Math.floor(Math.round(segundos * 1e7) / 1e6);
  const minutos = Math.floor(decimos / 600);
  const resto = (decimos % 600) / 10;
  return `${minutos}:${resto.toFixed(1).padStart(4, '0')}`;
}
