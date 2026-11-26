/**
 * @file Placar: Tempo final a partir do Tempo gasto e dos descontos, sem Phaser, e o teto de
 * desconto de cada Fase contra o seu tempo de referência.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MUNDOS } from '../src/logica/catalogo.js';
import { calcularPlacar, DESCONTOS as DESCONTOS_DO_JOGO } from '../src/logica/placar.js';

const DESCONTOS = Object.freeze({ item: 1, captura: 2, samambaia: 5 });

test('sem coletáveis nem Capturas, o Tempo final é o Tempo gasto', () => {
  const placar = calcularPlacar({ tempoGasto: 42.5, itens: 0, capturas: 0, samambaias: 0 }, DESCONTOS);

  assert.equal(placar.tempoFinal, 42.5);
  assert.equal(placar.desconto, 0);
});

test('cada Item, Captura e Samambaia-prateada desconta o seu valor do Tempo gasto', () => {
  const placar = calcularPlacar({ tempoGasto: 60, itens: 5, capturas: 2, samambaias: 1 }, DESCONTOS);

  assert.deepEqual(placar, {
    tempoGasto: 60,
    descontoItens: 5,
    descontoCapturas: 4,
    descontoSamambaias: 5,
    desconto: 14,
    tempoFinal: 46,
  });
});

test('o Tempo final nunca fica negativo', () => {
  const placar = calcularPlacar({ tempoGasto: 10, itens: 8, capturas: 1, samambaias: 3 }, DESCONTOS);

  assert.equal(placar.tempoFinal, 0);
});

test('sem descontos dados, valem os do jogo', () => {
  const resultado = { tempoGasto: 100, itens: 3, capturas: 2, samambaias: 1 };

  assert.deepEqual(calcularPlacar(resultado), calcularPlacar(resultado, DESCONTOS_DO_JOGO));
  assert.notDeepEqual(calcularPlacar(resultado, { item: 0, captura: 0, samambaia: 0 }), calcularPlacar(resultado));
});

/**
 * Quantos objetos com esse nome a camada `objetos` de um mapa tem.
 *
 * @param {string} caminho - O caminho do `.tmj`, a partir da raiz do site.
 * @param {string} nome - O nome do objeto: `item`, `predador` ou `samambaia`.
 * @returns {number} A quantidade.
 */
function contarNoMapa(caminho, nome) {
  const mapa = JSON.parse(readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8'));
  return mapa.layers.find((camada) => camada.name === 'objetos').objects.filter((objeto) => objeto.name === nome).length;
}

test('o desconto máximo de cada Fase não passa de 50% do seu tempo de referência', () => {
  for (const fase of MUNDOS.flatMap((mundo) => mundo.fases).filter((candidata) => !candidata.emBreve)) {
    const { desconto } = calcularPlacar({
      tempoGasto: 0,
      itens: contarNoMapa(fase.mapa, 'item'),
      capturas: contarNoMapa(fase.mapa, 'predador'),
      samambaias: contarNoMapa(fase.mapa, 'samambaia'),
    });

    assert.ok(desconto <= fase.tempoReferencia / 2, `${fase.id}: desconto máximo ${desconto} s, tempo de referência ${fase.tempoReferencia} s`);
  }
});
