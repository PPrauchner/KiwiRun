/**
 * @file Navegação do Menu, sem Phaser: o cursor sobre os Mundos e as Fases do Catálogo.
 *
 * Duas colunas: à esquerda os Mundos e, abaixo deles, as opções; à direita as Fases do
 * Mundo selecionado. Mundos e Fases "em breve" e opções desabilitadas aparecem, mas o
 * cursor passa por cima deles.
 */

/**
 * @typedef {{ tela: 'fase', faseId: string } | { tela: 'tela-inicial' }} Destino
 */

/**
 * @typedef {Object} Opcao
 * @property {string} id - Também a chave do texto, como `menu.<id>`.
 * @property {boolean} desabilitada - Aparece, mas o cursor não a seleciona.
 */

/**
 * Opções abaixo dos Mundos. Créditos fica desabilitada até a tela existir.
 *
 * @type {readonly Opcao[]}
 */
export const OPCOES = Object.freeze([
  Object.freeze({ id: 'creditos', desabilitada: true }),
  Object.freeze({ id: 'voltar', desabilitada: false }),
]);

/**
 * @typedef {Object} Menu
 * @property {'mundos' | 'fases'} coluna - A coluna em que está o cursor.
 * @property {import('./catalogo.js').Mundo} mundo - O Mundo cujas Fases aparecem à direita.
 * @property {import('./catalogo.js').Fase | null} fase - A Fase sob o cursor, só na coluna
 *   de Fases.
 * @property {string | null} opcao - O id da opção sob o cursor, se for uma.
 * @property {(acoes: import('./input.js').Acoes) => Destino | null} atualizar - Lê as
 *   ações de um quadro e devolve a tela a abrir, se alguma.
 */

/**
 * O próximo índice selecionável a partir de `atual`, no sentido dado; sem nenhum, `atual`.
 *
 * @param {readonly boolean[]} selecionaveis - Se cada item da coluna é selecionável.
 * @param {number} atual - O índice do cursor.
 * @param {number} sentido - -1 (cima) ou 1 (baixo).
 * @returns {number} O índice do cursor depois do movimento.
 */
function proximoSelecionavel(selecionaveis, atual, sentido) {
  for (let indice = atual + sentido; indice >= 0 && indice < selecionaveis.length; indice += sentido) {
    if (selecionaveis[indice]) return indice;
  }
  return atual;
}

/**
 * @param {import('./catalogo.js').Mundo} mundo - Um Mundo.
 * @returns {number} O índice da primeira Fase jogável do Mundo; -1 se não houver.
 */
function primeiraFaseJogavel(mundo) {
  return mundo.fases.findIndex((fase) => !fase.emBreve);
}

/**
 * Cria a navegação do Menu sobre os Mundos dados. O cursor abre na primeira Fase jogável
 * do primeiro Mundo que tenha uma. Uma direção move o cursor só ao ser apertada, não
 * segurada.
 *
 * @param {readonly import('./catalogo.js').Mundo[]} mundos - Os Mundos do Catálogo.
 * @returns {Menu} O Menu.
 */
export function criarMenu(mundos) {
  /** A coluna da esquerda: os Mundos e, abaixo, as opções. */
  const selecionaveisEsquerda = [
    ...mundos.map((mundo) => !mundo.emBreve),
    ...OPCOES.map((opcao) => !opcao.desabilitada),
  ];
  let indiceMundo = mundos.findIndex((mundo) => !mundo.emBreve && primeiraFaseJogavel(mundo) !== -1);
  let indiceEsquerda = indiceMundo;
  let indiceFase = primeiraFaseJogavel(mundos[indiceMundo]);
  /** @type {'mundos' | 'fases'} */
  let coluna = 'fases';
  let horizontalAnterior = 0;
  let verticalAnterior = 0;

  /** Leva o cursor às Fases do Mundo selecionado, se houver uma jogável. */
  function entrarNasFases() {
    const indice = primeiraFaseJogavel(mundos[indiceMundo]);
    if (indice === -1) return;
    indiceFase = indice;
    coluna = 'fases';
  }

  /** @param {number} sentido - -1 (cima) ou 1 (baixo). */
  function moverNaColuna(sentido) {
    if (coluna === 'fases') {
      const selecionaveis = mundos[indiceMundo].fases.map((fase) => !fase.emBreve);
      indiceFase = proximoSelecionavel(selecionaveis, indiceFase, sentido);
      return;
    }
    indiceEsquerda = proximoSelecionavel(selecionaveisEsquerda, indiceEsquerda, sentido);
    if (indiceEsquerda < mundos.length) indiceMundo = indiceEsquerda;
  }

  /**
   * @param {number} sentido - -1 (esquerda) ou 1 (direita).
   */
  function trocarDeColuna(sentido) {
    if (sentido < 0 && coluna === 'fases') {
      coluna = 'mundos';
      indiceEsquerda = indiceMundo;
    } else if (sentido > 0 && coluna === 'mundos') {
      entrarNasFases();
    }
  }

  /** @returns {string | null} O id da opção sob o cursor, se for uma. */
  function opcaoSobCursor() {
    return coluna === 'mundos' && indiceEsquerda >= mundos.length ? OPCOES[indiceEsquerda - mundos.length].id : null;
  }

  return {
    get coluna() {
      return coluna;
    },
    get mundo() {
      return mundos[indiceMundo];
    },
    get fase() {
      return coluna === 'fases' ? mundos[indiceMundo].fases[indiceFase] : null;
    },
    get opcao() {
      return opcaoSobCursor();
    },
    atualizar(acoes) {
      const horizontal = acoes.horizontal !== horizontalAnterior ? acoes.horizontal : 0;
      const vertical = acoes.vertical !== verticalAnterior ? acoes.vertical : 0;
      horizontalAnterior = acoes.horizontal;
      verticalAnterior = acoes.vertical;

      if (acoes.voltar) return { tela: 'tela-inicial' };
      if (horizontal !== 0) trocarDeColuna(horizontal);
      else if (vertical !== 0) moverNaColuna(vertical);
      if (!acoes.confirmar) return null;
      if (coluna === 'fases') return { tela: 'fase', faseId: mundos[indiceMundo].fases[indiceFase].id };
      if (opcaoSobCursor() === 'voltar') return { tela: 'tela-inicial' };
      if (indiceEsquerda < mundos.length) entrarNasFases();
      return null;
    },
  };
}

/**
 * @param {Opcao} opcao - Uma opção do Menu.
 * @returns {string} A chave do texto da opção.
 */
export function chaveOpcao(opcao) {
  return `menu.${opcao.id}`;
}
