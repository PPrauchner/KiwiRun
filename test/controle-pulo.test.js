/**
 * @file Controle do pulo: coyote time, jump buffer e pulo variável, sem Phaser.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarControlePulo } from '../src/logica/controle-pulo.js';
import { FISICA } from '../src/logica/pulo.js';

const PASSO = 1 / 60;

/** Um passo de controle com os campos padrão. */
function passo(controle, campos) {
  return controle.atualizar({ dt: PASSO, noChao: false, apertou: false, segurando: false, vy: 0, ...campos });
}

test('apertar no chão pula com a velocidade de pulo', () => {
  const controle = criarControlePulo();

  assert.equal(passo(controle, { noChao: true, apertou: true, segurando: true }), -FISICA.velocidadePulo);
});

test('sem apertar, o controle não mexe na velocidade', () => {
  const controle = criarControlePulo();

  assert.equal(passo(controle, { noChao: true, vy: 12 }), 12);
});

test('coyote time: pouco depois de sair da beirada, ainda pula', () => {
  const controle = criarControlePulo();
  passo(controle, { noChao: true });
  for (let i = 0; i < 4; i += 1) passo(controle, { vy: 30 });

  assert.equal(passo(controle, { apertou: true, segurando: true, vy: 30 }), -FISICA.velocidadePulo);
});

test('passado o coyote time, apertar no ar não pula', () => {
  const controle = criarControlePulo();
  passo(controle, { noChao: true });
  for (let i = 0; i < 10; i += 1) passo(controle, { vy: 30 });

  assert.equal(passo(controle, { apertou: true, segurando: true, vy: 30 }), 30);
});

test('jump buffer: apertar pouco antes de tocar o chão pula ao tocar', () => {
  const controle = criarControlePulo();
  passo(controle, { apertou: true, segurando: true, vy: 50 });
  for (let i = 0; i < 3; i += 1) passo(controle, { segurando: true, vy: 50 });

  assert.equal(passo(controle, { noChao: true, segurando: true }), -FISICA.velocidadePulo);
});

test('aperto antigo demais não vira pulo ao tocar o chão', () => {
  const controle = criarControlePulo();
  passo(controle, { apertou: true, segurando: true, vy: 50 });
  for (let i = 0; i < 10; i += 1) passo(controle, { vy: 50 });

  assert.equal(passo(controle, { noChao: true }), 0);
});

test('um pulo só por aperto: o coyote não dá um segundo pulo no ar', () => {
  const controle = criarControlePulo();
  passo(controle, { noChao: true, apertou: true, segurando: true });

  assert.equal(passo(controle, { apertou: true, segurando: true, vy: -200 }), -200);
});

test('soltar o botão subindo corta a velocidade para a do pulo curto', () => {
  const controle = criarControlePulo();
  passo(controle, { noChao: true, apertou: true, segurando: true });

  assert.equal(passo(controle, { vy: -FISICA.velocidadePulo + 10 }), -FISICA.velocidadeCorte);
});

test('soltar o botão caindo não muda a queda', () => {
  const controle = criarControlePulo();
  passo(controle, { noChao: true, apertou: true, segurando: true });

  assert.equal(passo(controle, { vy: 40 }), 40);
});

test('o quique da Captura sobe como um pulo segurado enquanto o botão segue apertado', () => {
  const controle = criarControlePulo();
  const vy = controle.quicar();

  assert.equal(vy, -FISICA.velocidadePulo);
  assert.equal(passo(controle, { segurando: true, vy }), vy);
});

test('soltar o botão no quique corta a subida, como num pulo curto', () => {
  const controle = criarControlePulo();
  const vy = controle.quicar();

  assert.equal(passo(controle, { segurando: false, vy }), -FISICA.velocidadeCorte);
});
