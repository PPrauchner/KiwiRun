/**
 * @file Opções da Pausa, sem Phaser: "Continuar" (pré-selecionada), "Reiniciar a Fase",
 * "Controles" e "Menu". Start ou Esc fecham a Pausa de qualquer ponto.
 *
 * As opções ficam numa coluna: cima/baixo movem o cursor, só ao apertar, não ao segurar.
 * "Controles" mostra os controles no lugar das opções; confirmar ou voltar as traz de volta.
 */

/** @typedef {'continuar' | 'reiniciar' | 'controles' | 'menu'} OpcaoPausa */

/** @typedef {'continuar' | 'reiniciar' | 'menu'} DestinoPausa */

/**
 * @typedef {Object} MenuPausa
 * @property {readonly OpcaoPausa[]} opcoes - As opções, na ordem.
 * @property {OpcaoPausa} opcao - A opção sob o cursor.
 * @property {boolean} mostrandoControles - Se os Controles estão na tela, no lugar das opções.
 * @property {(acoes: import('./input.js').Acoes) => DestinoPausa | null} atualizar - Lê as
 *   ações de um quadro e devolve o que fazer, se algo.
 */

/** @type {readonly OpcaoPausa[]} */
const OPCOES = Object.freeze(['continuar', 'reiniciar', 'controles', 'menu']);

/**
 * @typedef {Object} LinhaControles
 * @property {string} chaveAcao - O texto do que o controle faz.
 * @property {string} chave8BitDo - O texto dos botões no 8BitDo.
 * @property {string} chaveTeclado - O texto das teclas.
 */

/**
 * As linhas da tela Controles, na ordem; os botões e teclas seguem o Input unificado.
 *
 * @type {readonly LinhaControles[]}
 */
export const LINHAS_CONTROLES = Object.freeze(['mover', 'pular', 'confirmar', 'pausar'].map((acao) => Object.freeze({
  chaveAcao: `controles.${acao}`,
  chave8BitDo: `controles.8bitdo.${acao}`,
  chaveTeclado: `controles.teclado.${acao}`,
})));

/**
 * @param {OpcaoPausa} opcao - Uma opção da Pausa.
 * @returns {string} A chave do texto da opção.
 */
export function chaveOpcaoPausa(opcao) {
  return `pausa.${opcao}`;
}

/**
 * Cria as opções da Pausa.
 *
 * @returns {MenuPausa} As opções, com o cursor em "Continuar".
 */
export function criarMenuPausa() {
  let indice = 0;
  let sentidoAnterior = 0;
  let mostrandoControles = false;

  return {
    opcoes: OPCOES,
    get opcao() {
      return OPCOES[indice];
    },
    get mostrandoControles() {
      return mostrandoControles;
    },
    atualizar(acoes) {
      if (acoes.pausar) return 'continuar';
      if (mostrandoControles) {
        if (acoes.confirmar || acoes.voltar) mostrandoControles = false;
        return null;
      }
      const sentido = Math.sign(acoes.vertical);
      if (sentido !== sentidoAnterior && sentido !== 0) {
        indice = Math.min(OPCOES.length - 1, Math.max(0, indice + sentido));
      }
      sentidoAnterior = sentido;
      if (!acoes.confirmar) return null;
      if (OPCOES[indice] !== 'controles') return OPCOES[indice];
      mostrandoControles = true;
      return null;
    },
  };
}
