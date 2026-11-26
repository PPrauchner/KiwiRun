/**
 * @file Opções do Placar, sem Phaser: "Próxima Fase" (só se houver uma disponível),
 * "Jogar de novo" (pré-selecionada) e "Menu"; Esc vai ao Menu.
 *
 * As opções ficam numa linha: esquerda/direita (ou cima/baixo) movem o cursor, só ao
 * apertar, não ao segurar.
 */

/** @typedef {'proxima' | 'jogar_de_novo' | 'menu'} OpcaoPlacar */

/**
 * @typedef {{ tela: 'fase', faseId: string } | { tela: 'menu' }} DestinoPlacar
 */

/**
 * @typedef {Object} MenuPlacar
 * @property {readonly OpcaoPlacar[]} opcoes - As opções mostradas, na ordem.
 * @property {OpcaoPlacar} opcao - A opção sob o cursor.
 * @property {(acoes: import('./input.js').Acoes) => DestinoPlacar | null} atualizar - Lê
 *   as ações de um quadro e devolve a tela a abrir, se alguma.
 */

/**
 * @param {OpcaoPlacar} opcao - Uma opção do Placar.
 * @returns {string} A chave do texto da opção.
 */
export function chaveOpcaoPlacar(opcao) {
  return `placar.${opcao}`;
}

/**
 * Cria as opções do Placar de uma Fase.
 *
 * @param {{ faseId: string, proximaFaseId: string | null }} fases - A Fase terminada e a
 *   próxima disponível, se houver.
 * @returns {MenuPlacar} As opções, com o cursor em "Jogar de novo".
 */
export function criarMenuPlacar({ faseId, proximaFaseId }) {
  /** @type {OpcaoPlacar[]} */
  const opcoes = proximaFaseId ? ['proxima', 'jogar_de_novo', 'menu'] : ['jogar_de_novo', 'menu'];
  let indice = opcoes.indexOf('jogar_de_novo');
  let sentidoAnterior = 0;

  /** @type {Record<OpcaoPlacar, () => DestinoPlacar>} */
  const destinos = {
    proxima: () => ({ tela: 'fase', faseId: proximaFaseId }),
    jogar_de_novo: () => ({ tela: 'fase', faseId }),
    menu: () => ({ tela: 'menu' }),
  };

  return {
    opcoes: Object.freeze(opcoes),
    get opcao() {
      return opcoes[indice];
    },
    atualizar(acoes) {
      const sentido = Math.sign(acoes.horizontal || acoes.vertical);
      if (sentido !== sentidoAnterior && sentido !== 0) {
        indice = Math.min(opcoes.length - 1, Math.max(0, indice + sentido));
      }
      sentidoAnterior = sentido;
      if (acoes.voltar) return destinos.menu();
      return acoes.confirmar ? destinos[opcoes[indice]]() : null;
    },
  };
}
