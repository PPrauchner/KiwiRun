/**
 * @file Fila de Fatos, sem Phaser: cada Samambaia-prateada pega enfileira a chave do seu
 * Fato, que fica na tela por uma duração fixa; o seguinte só aparece quando o anterior sai.
 *
 * A cena chama `avancar` a cada quadro com os segundos passados; pausada (Pausa), a fila
 * não corre. O jogo não pausa para mostrar um Fato.
 */

/** Quanto tempo cada Fato fica na tela, em segundos. */
export const DURACAO_FATO = 4;

/** Largura da caixa do Fato no topo da tela, em pixels da fonte bitmap, e quantas linhas cabem. */
export const LARGURA_FATO = 360;
export const LINHAS_FATO = 2;

/**
 * @typedef {Object} FilaDeFatos
 * @property {string | null} atual - A chave do Fato na tela, ou `null` com a fila vazia.
 * @property {(chave: string) => void} enfileirar - Põe um Fato no fim da fila.
 * @property {(dt: number) => void} avancar - Corre `dt` segundos, se não estiver pausada.
 * @property {() => void} pausar - Congela a fila (Pausa).
 * @property {() => void} retomar - Volta a correr depois da Pausa.
 */

/**
 * Cria uma Fila de Fatos vazia.
 *
 * @param {{ duracao?: number }} [opcoes] - Segundos de cada Fato na tela; padrão `DURACAO_FATO`.
 * @returns {FilaDeFatos} A fila.
 */
export function criarFilaDeFatos({ duracao = DURACAO_FATO } = {}) {
  /** @type {string[]} */
  const chaves = [];
  let decorrido = 0;
  let pausada = false;

  return {
    get atual() {
      return chaves[0] ?? null;
    },
    enfileirar(chave) {
      chaves.push(chave);
    },
    avancar(dt) {
      if (pausada || chaves.length === 0) return;
      decorrido += dt;
      // Tolera o erro de ponto flutuante de somar passos de quadro (3.9 + 0.1 < 4).
      if (decorrido >= duracao - 1e-9) {
        chaves.shift();
        decorrido = 0;
      }
    },
    pausar() {
      pausada = true;
    },
    retomar() {
      pausada = false;
    },
  };
}
