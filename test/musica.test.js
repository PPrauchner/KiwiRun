/**
 * @file Música, sem Phaser: o andamento de cada tela e de cada Fase, a faixa de cada
 * andamento e a decisão de reiniciar a música só ao trocar de andamento.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buscarFase, MUNDOS } from '../src/logica/catalogo.js';
import {
  ANDAMENTO_BASE,
  andamentoDaFase,
  andamentosDoJogo,
  chaveMusica,
  criarTrilha,
  faixaMusica,
} from '../src/logica/musica.js';

test('a Pecuária toca o tema num andamento próprio, diferente do base', () => {
  const andamento = andamentoDaFase(buscarFase('pecuaria'));

  assert.equal(typeof andamento, 'number');
  assert.notEqual(andamento, ANDAMENTO_BASE);
});

test('uma Fase sem andamento nos dados toca no andamento base', () => {
  assert.equal(andamentoDaFase(buscarFase('porto')), ANDAMENTO_BASE);
});

test('o jogo tem uma faixa para o andamento base e uma para cada andamento das Fases jogáveis, sem repetir', () => {
  const mundos = [
    {
      id: 'm', chaveNome: 'mundo.m', emBreve: false, fases: [
        { id: 'a', emBreve: false, andamento: 150 },
        { id: 'b', emBreve: false, andamento: 150 },
        { id: 'c', emBreve: false, andamento: null },
        { id: 'd', emBreve: true, andamento: 90 },
      ],
    },
  ];

  assert.deepEqual(andamentosDoJogo(mundos), [ANDAMENTO_BASE, 150]);
  assert.deepEqual(andamentosDoJogo(), [ANDAMENTO_BASE, andamentoDaFase(buscarFase('pecuaria'))]);
  assert.equal(andamentosDoJogo(MUNDOS).length, 2);
});

test('cada andamento tem sua faixa .wav versionada e sua chave de áudio', () => {
  assert.equal(faixaMusica(120), 'assets/musica/tema-120.wav');
  assert.equal(chaveMusica(120), 'musica-120');
  assert.notEqual(chaveMusica(120), chaveMusica(140));
});

test('a trilha começa a música na primeira tela e não a reinicia no mesmo andamento', () => {
  const trilha = criarTrilha();

  assert.equal(trilha.andamento, null);
  assert.equal(trilha.tocar(ANDAMENTO_BASE), true, 'Tela inicial começa a música');
  assert.equal(trilha.tocar(ANDAMENTO_BASE), false, 'Menu segue a mesma música');
  assert.equal(trilha.tocar(ANDAMENTO_BASE), false, 'Placar segue a mesma música');
  assert.equal(trilha.andamento, ANDAMENTO_BASE);
});

test('a trilha troca a música ao entrar numa Fase com outro andamento, e volta ao sair', () => {
  const trilha = criarTrilha();
  trilha.tocar(ANDAMENTO_BASE);

  assert.equal(trilha.tocar(140), true, 'a Fase troca de andamento');
  assert.equal(trilha.tocar(140), false, 'reiniciar a Fase não reinicia a música');
  assert.equal(trilha.tocar(ANDAMENTO_BASE), true, 'o Placar volta ao andamento base');
});
