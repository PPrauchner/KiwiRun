/**
 * @file Iniciais de um Novo Recorde, sem Phaser: 3 letras A–Z a partir de "AAA".
 *
 * Cima/baixo trocam a letra sob o cursor (dando a volta), esquerda/direita movem o cursor,
 * confirmar aceita a letra e avança, e na terceira grava; Esc volta uma letra. Digitar uma
 * letra no teclado preenche a posição e avança, como confirmar. Direções contam só ao
 * apertar, não ao segurar.
 *
 * Na tela das Iniciais, as teclas de letra só digitam: saem do estado bruto antes do Input,
 * para WASD não mover o cursor nem M silenciar. O Select do controle segue silenciando.
 */
import { SEGUNDOS_BLOQUEIO } from './input.js';

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const QUANTIDADE_INICIAIS = 3;
/** Teclas de letra, em `KeyboardEvent.code`. */
const TECLA_LETRA = /^Key[A-Z]$/;

/**
 * Tira as teclas de letra do estado bruto de um quadro.
 *
 * @param {import('./input.js').EstadoBruto} estado - O estado bruto do quadro.
 * @returns {{ estado: import('./input.js').EstadoBruto, letras: Set<string> }} O estado sem
 *   as letras, para o Input, e os códigos das letras, para a digitação.
 */
export function separarDigitacao({ teclas, gamepads }) {
  const letras = new Set([...teclas].filter((codigo) => TECLA_LETRA.test(codigo)));
  const outras = new Set([...teclas].filter((codigo) => !letras.has(codigo)));
  return { estado: { teclas: outras, gamepads }, letras };
}

/**
 * @typedef {Object} Digitacao
 * @property {(letras: Set<string>, dt: number) => string[]} atualizar - Lê os códigos das
 *   letras seguradas num quadro e devolve as letras apertadas nele (`'A'`–`'Z'`).
 */

/**
 * Cria a digitação de uma tela, com o mesmo bloqueio do Input: nos primeiros
 * `SEGUNDOS_BLOQUEIO` nada vale, e a letra segurada desde então só vale depois de solta.
 *
 * @returns {Digitacao} A digitação.
 */
export function criarDigitacao() {
  let segundos = 0;
  let travadas = new Set();
  let anteriores = new Set();

  return {
    atualizar(letras, dt) {
      const bloqueado = segundos < SEGUNDOS_BLOQUEIO;
      segundos += dt;
      travadas = new Set([...letras].filter((codigo) => bloqueado || travadas.has(codigo)));
      const novas = [...letras].filter((codigo) => !travadas.has(codigo) && !anteriores.has(codigo));
      anteriores = new Set(letras);
      return novas.map((codigo) => codigo.slice('Key'.length));
    },
  };
}

/**
 * @typedef {Object} Iniciais
 * @property {string} letras - As 3 letras atuais.
 * @property {number} posicao - A posição sob o cursor, de 0 a 2.
 * @property {boolean} concluidas - Se já foram gravadas.
 * @property {(acoes: import('./input.js').Acoes, digitadas: readonly string[]) => string | null}
 *   atualizar - Lê as ações e as letras digitadas num quadro e devolve as Iniciais se as
 *   gravou nele.
 */

/**
 * Cria as Iniciais em "AAA", com o cursor na primeira letra.
 *
 * @returns {Iniciais} As Iniciais.
 */
export function criarIniciais() {
  const letras = Array(QUANTIDADE_INICIAIS).fill(ALFABETO[0]);
  let posicao = 0;
  let concluidas = false;
  let verticalAnterior = 0;
  let horizontalAnterior = 0;

  /** @returns {string | null} As Iniciais, se esta era a última letra. */
  function avancar() {
    if (posicao < QUANTIDADE_INICIAIS - 1) {
      posicao += 1;
      return null;
    }
    concluidas = true;
    return letras.join('');
  }

  return {
    get letras() {
      return letras.join('');
    },
    get posicao() {
      return posicao;
    },
    get concluidas() {
      return concluidas;
    },
    atualizar({ horizontal, vertical, confirmar, voltar }, digitadas) {
      const verticalNovo = vertical !== verticalAnterior ? vertical : 0;
      const horizontalNovo = horizontal !== horizontalAnterior ? horizontal : 0;
      verticalAnterior = vertical;
      horizontalAnterior = horizontal;
      if (concluidas) return null;

      for (const letra of digitadas) {
        letras[posicao] = letra;
        if (avancar()) return letras.join('');
      }
      if (verticalNovo !== 0) {
        // Cima (-1) avança no alfabeto, como nos fliperamas.
        const indice = ALFABETO.indexOf(letras[posicao]) - verticalNovo;
        letras[posicao] = ALFABETO[(indice + ALFABETO.length) % ALFABETO.length];
      }
      if (horizontalNovo !== 0) posicao = Math.min(QUANTIDADE_INICIAIS - 1, Math.max(0, posicao + horizontalNovo));
      if (voltar) posicao = Math.max(0, posicao - 1);
      return confirmar ? avancar() : null;
    },
  };
}
