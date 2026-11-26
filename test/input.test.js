/**
 * @file Input unificado: teclado e gamepad viram ações abstratas, sem Phaser.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarInput, criarTeclado, registraTecla, SEGUNDOS_BLOQUEIO } from '../src/logica/input.js';

const QUADRO = 1 / 60;

/** Um quadro de input com as teclas e os gamepads dados. */
function quadro(input, { teclas = [], gamepads = [] } = {}, dt = QUADRO) {
  return input.atualizar({ teclas: new Set(teclas), gamepads }, dt);
}

/** Um Input com o bloqueio de entrada já vencido, sem nada apertado. */
function inputLiberado() {
  const input = criarInput();
  quadro(input, {}, SEGUNDOS_BLOQUEIO + 0.01);
  return input;
}

test('Espaço pula', () => {
  const input = inputLiberado();

  assert.equal(quadro(input, { teclas: ['Space'] }).pular, true);
});

test('setas e WASD movem nas quatro direções', () => {
  const casos = [
    [['ArrowLeft'], -1, 0], [['KeyA'], -1, 0],
    [['ArrowRight'], 1, 0], [['KeyD'], 1, 0],
    [['ArrowUp'], 0, -1], [['KeyW'], 0, -1],
    [['ArrowDown'], 0, 1], [['KeyS'], 0, 1],
  ];
  for (const [teclas, horizontal, vertical] of casos) {
    const acoes = quadro(inputLiberado(), { teclas });

    assert.deepEqual([acoes.horizontal, acoes.vertical], [horizontal, vertical], teclas[0]);
  }
});

test('Espaço e Enter confirmam; Esc volta e pausa; M silencia', () => {
  const casos = [
    ['Space', ['pular', 'confirmar']],
    ['Enter', ['confirmar']],
    ['Escape', ['voltar', 'pausar']],
    ['KeyM', ['silenciar']],
  ];
  for (const [tecla, esperadas] of casos) {
    const acoes = quadro(inputLiberado(), { teclas: [tecla] });
    const apertadas = ['pular', 'confirmar', 'voltar', 'pausar', 'silenciar'].filter((acao) => acoes[acao]);

    assert.deepEqual(apertadas, esperadas, tecla);
  }
});

test('tecla fora do jogo não vira ação', () => {
  const acoes = quadro(inputLiberado(), { teclas: ['KeyQ'] });

  assert.deepEqual(acoes, quadro(inputLiberado()));
});

test('segurando pulo: o aperto conta uma vez e o segurar continua valendo', () => {
  const input = inputLiberado();
  quadro(input, { teclas: ['Space'] });
  const segurado = quadro(input, { teclas: ['Space'] });

  assert.equal(segurado.pular, false);
  assert.equal(segurado.segurandoPulo, true);
  assert.equal(quadro(input).segurandoPulo, false);
});

/**
 * Um gamepad simulado no formato da Gamepad API.
 *
 * @param {{ mapping?: string, botoes?: number[], eixos?: number[] }} [opcoes] - O mapeamento,
 *   os índices dos botões apertados e os valores dos eixos.
 * @returns {{ mapping: string, buttons: { pressed: boolean }[], axes: number[] }} O gamepad.
 */
function gamepad({ mapping = 'standard', botoes = [], eixos = [0, 0, 0, 0] } = {}) {
  const buttons = Array.from({ length: 17 }, (_, i) => ({ pressed: botoes.includes(i), value: botoes.includes(i) ? 1 : 0 }));
  return { mapping, buttons, axes: eixos };
}

test('cada botão frontal pula e confirma', () => {
  for (const botao of [0, 1, 2, 3]) {
    const acoes = quadro(inputLiberado(), { gamepads: [gamepad({ botoes: [botao] })] });

    assert.equal(acoes.pular && acoes.confirmar && acoes.segurandoPulo, true, `botão ${botao}`);
  }
});

test('D-pad move nas quatro direções', () => {
  const casos = [[12, 0, -1], [13, 0, 1], [14, -1, 0], [15, 1, 0]];
  for (const [botao, horizontal, vertical] of casos) {
    const acoes = quadro(inputLiberado(), { gamepads: [gamepad({ botoes: [botao] })] });

    assert.deepEqual([acoes.horizontal, acoes.vertical], [horizontal, vertical], `botão ${botao}`);
  }
});

test('analógico esquerdo move; deriva dentro da zona morta não move', () => {
  const direita = quadro(inputLiberado(), { gamepads: [gamepad({ eixos: [0.9, 0, 0, 0] })] });
  const cima = quadro(inputLiberado(), { gamepads: [gamepad({ eixos: [0, -0.8, 0, 0] })] });
  const deriva = quadro(inputLiberado(), { gamepads: [gamepad({ eixos: [0.15, -0.12, 0, 0] })] });

  assert.equal(direita.horizontal, 1);
  assert.equal(cima.vertical, -1);
  assert.deepEqual([deriva.horizontal, deriva.vertical], [0, 0]);
});

test('Start pausa e confirma; Select silencia', () => {
  const start = quadro(inputLiberado(), { gamepads: [gamepad({ botoes: [9] })] });
  const select = quadro(inputLiberado(), { gamepads: [gamepad({ botoes: [8] })] });

  assert.equal(start.pausar && start.confirmar, true);
  assert.equal(start.pular || start.voltar, false);
  assert.equal(select.silenciar, true);
});

test('dois gamepads ligados valem juntos, e um encaixe vazio é ignorado', () => {
  const acoes = quadro(inputLiberado(), { gamepads: [null, gamepad({ botoes: [15] })] });

  assert.equal(acoes.horizontal, 1);
});

/** Eixos de um gamepad não-standard em repouso, com o hat (eixo 9) no valor dado. */
function eixosComHat(hat) {
  return [0, 0, 0, 0, 0, 0, 0, 0, 0, hat];
}

test('não-standard: botões 0–3 pulam, e os outros botões não viram ação', () => {
  for (const botao of [0, 1, 2, 3]) {
    const acoes = quadro(inputLiberado(), { gamepads: [gamepad({ mapping: '', botoes: [botao], eixos: eixosComHat(3.29) })] });

    assert.equal(acoes.pular, true, `botão ${botao}`);
  }
  const outro = quadro(inputLiberado(), { gamepads: [gamepad({ mapping: '', botoes: [9, 12], eixos: eixosComHat(3.29) })] });
  assert.deepEqual(outro, quadro(inputLiberado()));
});

test('não-standard: o hat do D-pad move nas oito posições, e em repouso não move', () => {
  const casos = [
    [-1, 0, -1], [-0.714, 1, -1], [-0.429, 1, 0], [-0.143, 1, 1],
    [0.143, 0, 1], [0.429, -1, 1], [0.714, -1, 0], [1, -1, -1],
    [3.29, 0, 0],
  ];
  for (const [hat, horizontal, vertical] of casos) {
    const acoes = quadro(inputLiberado(), { gamepads: [gamepad({ mapping: '', eixos: eixosComHat(hat) })] });

    assert.deepEqual([acoes.horizontal, acoes.vertical], [horizontal, vertical], `hat ${hat}`);
  }
});

test('não-standard: o analógico esquerdo também move', () => {
  const acoes = quadro(inputLiberado(), { gamepads: [gamepad({ mapping: '', eixos: [-1, 0, 0, 0, 0, 0, 0, 0, 0, 3.29] })] });

  assert.equal(acoes.horizontal, -1);
});

test('bloqueio: numa tela nova, um aperto antes de ~0,5 s é ignorado', () => {
  const input = criarInput();
  quadro(input, {}, SEGUNDOS_BLOQUEIO / 2);
  const acoes = quadro(input, { teclas: ['Space', 'ArrowRight'] });

  assert.equal(acoes.pular || acoes.confirmar || acoes.segurandoPulo, false);
  assert.equal(acoes.horizontal, 0);
});

test('bloqueio: botão segurado através de uma troca de tela não conta como aperto novo', () => {
  const pulo = { gamepads: [gamepad({ botoes: [0] })] };
  const anterior = inputLiberado();
  quadro(anterior, pulo);

  const novaTela = criarInput();
  quadro(novaTela, pulo, SEGUNDOS_BLOQUEIO + 0.01);
  const seguindo = quadro(novaTela, pulo);
  assert.equal(seguindo.pular || seguindo.confirmar || seguindo.segurandoPulo, false);

  quadro(novaTela);
  assert.equal(quadro(novaTela, pulo).pular, true, 'soltar e apertar de novo conta');
});

test('bloqueio: direção segurada desde a tela anterior só move depois de solta', () => {
  const direita = { teclas: ['ArrowRight'] };
  const input = criarInput();
  quadro(input, direita, SEGUNDOS_BLOQUEIO + 0.01);

  assert.equal(quadro(input, direita).horizontal, 0);
  quadro(input);
  assert.equal(quadro(input, direita).horizontal, 1);
});

test('sem bloqueio (sair da Pausa): o que vinha segurado fica travado, um aperto novo vale já', () => {
  const input = criarInput({ segundosBloqueio: 0 });

  const segurado = quadro(input, { teclas: ['Escape', 'ArrowRight'] });
  assert.equal(segurado.pausar || segurado.voltar, false);
  assert.equal(segurado.horizontal, 0);

  const novo = quadro(input, { teclas: ['Escape', 'ArrowRight', 'Space'] });
  assert.equal(novo.pular, true);
  assert.equal(novo.pausar || novo.horizontal !== 0, false);
});

test('último input: sem nada mudar, o tempo sem input cresce', () => {
  const input = inputLiberado();
  quadro(input, {}, 2);

  assert.equal(input.segundosSemInput, SEGUNDOS_BLOQUEIO + 0.01 + 2);
});

test('último input: apertar ou soltar um botão zera; segurá-lo parado não', () => {
  const input = inputLiberado();
  const pulo = { gamepads: [gamepad({ botoes: [0] })] };
  quadro(input, pulo, 1);
  assert.equal(input.segundosSemInput, 0);

  quadro(input, pulo, 1);
  assert.equal(input.segundosSemInput, 1);

  quadro(input, {}, 1);
  assert.equal(input.segundosSemInput, 0);
});

test('último input: deriva de analógico não atualiza; analógico fora da zona morta sim', () => {
  const input = inputLiberado();
  for (const deriva of [0.1, -0.2, 0.25]) quadro(input, { gamepads: [gamepad({ eixos: [deriva, -deriva, 0, 0] })] }, 1);
  assert.equal(input.segundosSemInput, SEGUNDOS_BLOQUEIO + 0.01 + 3);

  quadro(input, { gamepads: [gamepad({ eixos: [0.9, 0, 0, 0] })] }, 1);
  quadro(input, { gamepads: [gamepad({ eixos: [0.9, 0, 0, 0] })] }, 1);
  assert.equal(input.segundosSemInput, 0);
});

test('teclado: tecla segurada aparece em toda leitura até ser solta', () => {
  const teclado = criarTeclado();
  teclado.apertar('Space');

  assert.deepEqual([...teclado.ler()], ['Space']);
  assert.deepEqual([...teclado.ler()], ['Space']);
  teclado.soltar('Space');
  assert.deepEqual([...teclado.ler()], []);
});

test('teclado: toque mais curto que um quadro ainda aparece numa leitura', () => {
  const teclado = criarTeclado();
  teclado.apertar('Enter');
  teclado.soltar('Enter');

  assert.deepEqual([...teclado.ler()], ['Enter']);
  assert.deepEqual([...teclado.ler()], []);
});

test('teclado: perder o foco solta tudo', () => {
  const teclado = criarTeclado();
  teclado.apertar('ArrowRight');
  teclado.soltarTudo();

  assert.deepEqual([...teclado.ler()], []);
});

test('o registro guarda as teclas das ações, as letras (Iniciais) e Shift e Backspace (zerar Recordes)', () => {
  for (const codigo of ['ArrowLeft', 'Space', 'Escape', 'KeyA', 'KeyM', 'KeyQ', 'KeyZ', 'Backspace', 'ShiftLeft', 'ShiftRight']) {
    assert.equal(registraTecla(codigo), true, codigo);
  }
  for (const codigo of ['Tab', 'F5', 'Digit1', 'ControlLeft', 'Keyboard']) {
    assert.equal(registraTecla(codigo), false, codigo);
  }
});
