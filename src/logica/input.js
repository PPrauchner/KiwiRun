/**
 * @file Input unificado, sem Phaser: traduz teclado e Gamepad API em ações abstratas.
 *
 * A cena chama `atualizar` a cada quadro com as teclas seguradas e os gamepads lidos do
 * navegador, e recebe as ações do quadro: a direção segurada e os apertos novos.
 */

/** @typedef {'esquerda' | 'direita' | 'cima' | 'baixo' | 'pular' | 'confirmar' | 'voltar' | 'pausar' | 'silenciar'} Acao */

/** Segundos em que uma tela nova (ou a entrada numa Fase) ignora o input. */
export const SEGUNDOS_BLOQUEIO = 0.5;

/** Teclas do jogo (`KeyboardEvent.code`) e as ações de cada uma. */
export const TECLAS = Object.freeze({
  ArrowLeft: ['esquerda'],
  KeyA: ['esquerda'],
  ArrowRight: ['direita'],
  KeyD: ['direita'],
  ArrowUp: ['cima'],
  KeyW: ['cima'],
  ArrowDown: ['baixo'],
  KeyS: ['baixo'],
  Space: ['pular', 'confirmar'],
  Enter: ['confirmar'],
  Escape: ['voltar', 'pausar'],
  KeyM: ['silenciar'],
});

/**
 * Teclas sem ação no Input que o registro do jogo também guarda: as letras (digitar as
 * Iniciais) e Shift e Backspace (zerar os Recordes na Tela inicial).
 */
const TECLAS_EXTRAS = /^(Key[A-Z]|Backspace|ShiftLeft|ShiftRight)$/;

/**
 * @param {string} codigo - Um `KeyboardEvent.code`.
 * @returns {boolean} Se o jogo usa a tecla: o registro a guarda e a página não a trata.
 */
export function registraTecla(codigo) {
  return Object.hasOwn(TECLAS, codigo) || TECLAS_EXTRAS.test(codigo);
}

/** Ações de um botão frontal, em qualquer mapeamento. */
const FRONTAL = Object.freeze(['pular', 'confirmar']);

/** Botões do mapeamento `standard` da Gamepad API e as ações de cada um. */
const BOTOES_STANDARD = Object.freeze({
  0: FRONTAL,
  1: FRONTAL,
  2: FRONTAL,
  3: FRONTAL,
  8: ['silenciar'],
  9: ['pausar', 'confirmar'],
  12: ['cima'],
  13: ['baixo'],
  14: ['esquerda'],
  15: ['direita'],
});

/** Em mapeamento não-standard, só os botões 0–3 têm papel garantido: pular. */
const BOTOES_NAO_STANDARD = Object.freeze({ 0: FRONTAL, 1: FRONTAL, 2: FRONTAL, 3: FRONTAL });

/**
 * Em mapeamento não-standard, o Chrome expõe o D-pad (hat) como um eixo: oito valores
 * igualmente espaçados de -1 (cima) a 1 (cima-esquerda), no sentido horário; fora de
 * [-1, 1] é repouso.
 */
const EIXO_HAT = 9;
const DIRECOES_HAT = Object.freeze([
  ['cima'], ['cima', 'direita'], ['direita'], ['baixo', 'direita'],
  ['baixo'], ['baixo', 'esquerda'], ['esquerda'], ['cima', 'esquerda'],
]);
const FOLGA_HAT = 0.05;

/**
 * @param {number | undefined} valor - O valor do eixo do hat.
 * @returns {readonly Acao[]} As direções seguradas no hat; vazio em repouso.
 */
function direcoesDoHat(valor) {
  if (valor === undefined || Math.abs(valor) > 1 + FOLGA_HAT) return [];
  const posicao = Math.round(((valor + 1) * (DIRECOES_HAT.length - 1)) / 2);
  return DIRECOES_HAT[posicao];
}

/** Abaixo disso (em módulo), um eixo do analógico é deriva e não move. */
export const ZONA_MORTA = 0.3;

/**
 * @typedef {Object} EstadoBruto
 * @property {Set<string>} teclas - Códigos (`KeyboardEvent.code`) das teclas apertadas.
 * @property {ArrayLike<Gamepad | null>} gamepads - O que `navigator.getGamepads()` devolve.
 */

/**
 * @typedef {Object} Acoes
 * @property {number} horizontal - -1 (esquerda), 0 ou 1 (direita), segurado.
 * @property {number} vertical - -1 (cima), 0 ou 1 (baixo), segurado.
 * @property {boolean} segurandoPulo - Algum botão de pular está segurado.
 * @property {boolean} pular - Aperto novo de pular neste quadro.
 * @property {boolean} confirmar - Aperto novo de confirmar neste quadro.
 * @property {boolean} voltar - Aperto novo de voltar neste quadro.
 * @property {boolean} pausar - Aperto novo de pausar/continuar neste quadro.
 * @property {boolean} silenciar - Aperto novo de silenciar neste quadro.
 */

/**
 * Cada controle ativo no quadro (tecla, botão ou direção de eixo), com as suas ações.
 *
 * @param {EstadoBruto} estado - O estado bruto do quadro.
 * @returns {Map<string, readonly Acao[]>} As ações por id de controle.
 */
function controlesAtivos({ teclas, gamepads }) {
  const ativos = new Map();
  for (const codigo of teclas) {
    if (TECLAS[codigo]) ativos.set(`tecla:${codigo}`, TECLAS[codigo]);
  }
  Array.from(gamepads).forEach((gamepad, indice) => {
    if (!gamepad) return;
    const prefixo = `pad${indice}:`;
    const standard = gamepad.mapping === 'standard';
    const botoes = standard ? BOTOES_STANDARD : BOTOES_NAO_STANDARD;
    if (!standard) {
      for (const direcao of direcoesDoHat(gamepad.axes[EIXO_HAT])) ativos.set(`${prefixo}hat-${direcao}`, [direcao]);
    }
    gamepad.buttons.forEach((botao, numero) => {
      if (botao.pressed && botoes[numero]) ativos.set(`${prefixo}botao${numero}`, botoes[numero]);
    });
    const [eixoX = 0, eixoY = 0] = gamepad.axes;
    if (eixoX <= -ZONA_MORTA) ativos.set(`${prefixo}analogico-esquerda`, ['esquerda']);
    if (eixoX >= ZONA_MORTA) ativos.set(`${prefixo}analogico-direita`, ['direita']);
    if (eixoY <= -ZONA_MORTA) ativos.set(`${prefixo}analogico-cima`, ['cima']);
    if (eixoY >= ZONA_MORTA) ativos.set(`${prefixo}analogico-baixo`, ['baixo']);
  });
  return ativos;
}

/**
 * @typedef {Object} Input
 * @property {(estado: EstadoBruto, dt: number) => Acoes} atualizar - Lê um quadro.
 * @property {number} segundosSemInput - Segundos desde o último input, para a Volta por
 *   inatividade.
 */

/**
 * Cria o Input de uma tela. Nos primeiros `SEGUNDOS_BLOQUEIO` ele ignora tudo; depois só
 * aceita aperto novo: um controle que já vinha segurado precisa ser solto antes de valer.
 *
 * @returns {Input} O Input.
 */
export function criarInput() {
  let segundos = 0;
  /** Controles segurados durante o bloqueio, ignorados até serem soltos. */
  let travados = new Set();
  let anteriores = new Set();
  let segundosSemInput = 0;
  let brutosAnteriores = new Set();

  /**
   * Para a Volta por inatividade, só conta mudança de controle ou analógico fora da zona
   * morta: um botão preso não segura o jogo, e a deriva do analógico nem chega aqui.
   *
   * @param {Set<string>} brutos - Os controles ativos no quadro, bloqueados ou não.
   * @param {number} dt - Segundos desde o quadro anterior.
   */
  function registrarAtividade(brutos, dt) {
    const mudou = brutos.size !== brutosAnteriores.size || [...brutos].some((id) => !brutosAnteriores.has(id));
    const analogico = [...brutos].some((id) => id.includes(':analogico-'));
    segundosSemInput = mudou || analogico ? 0 : segundosSemInput + dt;
    brutosAnteriores = brutos;
  }

  return {
    get segundosSemInput() {
      return segundosSemInput;
    },
    atualizar(estado, dt) {
      const bloqueado = segundos < SEGUNDOS_BLOQUEIO;
      segundos += dt;
      const todos = controlesAtivos(estado);
      registrarAtividade(new Set(todos.keys()), dt);
      travados = new Set([...todos.keys()].filter((id) => bloqueado || travados.has(id)));
      const ativos = new Map([...todos].filter(([id]) => !travados.has(id)));
      const segurando = (acao) => [...ativos.values()].some((acoes) => acoes.includes(acao));
      const apertou = (acao) => [...ativos].some(([id, acoes]) => !anteriores.has(id) && acoes.includes(acao));
      const acoes = {
        horizontal: Number(segurando('direita')) - Number(segurando('esquerda')),
        vertical: Number(segurando('baixo')) - Number(segurando('cima')),
        segurandoPulo: segurando('pular'),
        pular: apertou('pular'),
        confirmar: apertou('confirmar'),
        voltar: apertou('voltar'),
        pausar: apertou('pausar'),
        silenciar: apertou('silenciar'),
      };
      anteriores = new Set(ativos.keys());
      return acoes;
    },
  };
}

/**
 * @typedef {Object} Teclado
 * @property {(codigo: string) => void} apertar - Um `keydown` (sem repetição).
 * @property {(codigo: string) => void} soltar - Um `keyup`.
 * @property {() => void} soltarTudo - A janela perdeu o foco: nenhum `keyup` virá.
 * @property {() => Set<string>} ler - As teclas do quadro: as seguradas e as tocadas desde a
 *   leitura anterior, mesmo que já soltas.
 */

/**
 * Cria o registro das teclas, um só para o jogo inteiro: uma tecla segurada na troca de
 * tela continua segurada, e o Input da tela nova a trava.
 *
 * @returns {Teclado} O registro, sem nenhuma tecla.
 */
export function criarTeclado() {
  const seguradas = new Set();
  let tocadas = new Set();

  return {
    apertar(codigo) {
      seguradas.add(codigo);
      tocadas.add(codigo);
    },
    soltar(codigo) {
      seguradas.delete(codigo);
    },
    soltarTudo() {
      seguradas.clear();
      tocadas.clear();
    },
    ler() {
      const doQuadro = new Set([...seguradas, ...tocadas]);
      tocadas = new Set();
      return doQuadro;
    },
  };
}
