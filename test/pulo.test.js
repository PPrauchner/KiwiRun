/**
 * @file A física derivada das constantes do pulo alcança a altura e o alcance declarados.
 *
 * Integra como o Arcade do Phaser em passo fixo (velocidade antes da posição), a 60/s.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PULO, FISICA, TILE } from '../src/logica/pulo.js';

const PASSO = 1 / FISICA.passosPorSegundo;

/**
 * Simula um pulo do chão, correndo, até voltar à altura de partida.
 *
 * @param {number} segurarPor - Segundos com o botão segurado; depois disso, solta.
 * @returns {{ altura: number, alcance: number }} Altura e alcance em pixels.
 */
function simularPulo(segurarPor) {
  let vy = -FISICA.velocidadePulo;
  let y = 0;
  let x = 0;
  let tempo = 0;
  let altura = 0;
  let soltou = false;

  do {
    if (!soltou && tempo >= segurarPor) {
      soltou = true;
      vy = Math.max(vy, -FISICA.velocidadeCorte);
    }
    vy += FISICA.gravidade * PASSO;
    y += vy * PASSO;
    x += FISICA.velocidadeAndar * PASSO;
    tempo += PASSO;
    altura = Math.max(altura, -y);
  } while (y < 0);

  return { altura, alcance: x };
}

test('o pulo segurado sobe a altura máxima e alcança o alcance máximo, em tiles', () => {
  const { altura, alcance } = simularPulo(Infinity);

  assert.ok(altura >= PULO.segurado.altura * TILE, `altura ${altura}`);
  assert.ok(alcance >= PULO.segurado.alcance * TILE, `alcance ${alcance}`);
});

test('o pulo curto (toque) sobe ao menos a altura curta, mas não a segurada', () => {
  const { altura, alcance } = simularPulo(0);

  assert.ok(altura >= PULO.curto.altura * TILE, `altura ${altura}`);
  assert.ok(alcance >= PULO.curto.alcance * TILE, `alcance ${alcance}`);
  assert.ok(altura < PULO.segurado.altura * TILE, `altura ${altura}`);
});
