/**
 * @file Recorde de cada Fase sobre um armazenamento injetável, sem Phaser.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arredondarDecimos, criarAtalhoZerar, criarRecordes, INICIAIS_DA_VOLTA, SEGUNDOS_ZERAR, textoRecorde } from '../src/logica/recorde.js';
import { criarTextos } from '../src/logica/textos.js';

/**
 * Um armazenamento em memória com a interface do `localStorage` que o Recorde usa.
 *
 * @param {Record<string, string>} [inicial] - Entradas já gravadas.
 * @returns {Storage} O armazenamento.
 */
function armazenamentoEmMemoria(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    get length() {
      return dados.size;
    },
    key: (indice) => [...dados.keys()][indice] ?? null,
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, String(valor)),
    removeItem: (chave) => dados.delete(chave),
    clear: () => dados.clear(),
  };
}

test('a primeira conclusão de uma Fase é Novo Recorde', () => {
  const recordes = criarRecordes(armazenamentoEmMemoria());

  assert.equal(recordes.ler('pecuaria'), null);
  assert.equal(recordes.registrar('pecuaria', 42.34), true);
  assert.deepEqual(recordes.ler('pecuaria'), { segundos: 42.3, iniciais: '' });
});

test('só um Tempo final estritamente menor em décimos substitui o Recorde', () => {
  const recordes = criarRecordes(armazenamentoEmMemoria());
  recordes.registrar('pecuaria', 42.34);

  assert.equal(recordes.registrar('pecuaria', 42.31), false, '42,31 e 42,34 são ambos 42,3');
  assert.equal(recordes.registrar('pecuaria', 50), false);
  assert.equal(recordes.registrar('pecuaria', 42.24), true);
  assert.equal(recordes.ler('pecuaria').segundos, 42.2);
});

test('o Recorde devolve as Iniciais gravadas, e um Novo Recorde as limpa até gravar outras', () => {
  const recordes = criarRecordes(armazenamentoEmMemoria());
  recordes.registrar('pecuaria', 42.3);
  recordes.gravarIniciais('pecuaria', 'ABC');

  assert.deepEqual(recordes.ler('pecuaria'), { segundos: 42.3, iniciais: 'ABC' });
  recordes.registrar('pecuaria', 40);
  assert.equal(recordes.ler('pecuaria').iniciais, '');
  recordes.gravarIniciais('pecuaria', 'KIW');
  assert.deepEqual(recordes.ler('pecuaria'), { segundos: 40, iniciais: 'KIW' });
});

test('Iniciais: a Volta por inatividade grava "---" no Recorde, que continua válido', () => {
  const armazenamento = armazenamentoEmMemoria();
  const recordes = criarRecordes(armazenamento);
  recordes.registrar('pecuaria', 42.3);
  recordes.gravarIniciais('pecuaria', INICIAIS_DA_VOLTA);

  assert.equal(INICIAIS_DA_VOLTA, '---');
  assert.deepEqual(criarRecordes(armazenamento).ler('pecuaria'), { segundos: 42.3, iniciais: '---' });
});

test('cada Fase tem o seu Recorde', () => {
  const recordes = criarRecordes(armazenamentoEmMemoria());
  recordes.registrar('pecuaria', 42.3);

  assert.equal(recordes.ler('porto'), null);
  assert.equal(recordes.registrar('porto', 99), true);
  assert.equal(recordes.ler('pecuaria').segundos, 42.3);
});

test('um Recorde corrompido no armazenamento conta como ausente e é substituído', () => {
  const corrompidos = ['{', '"texto"', 'null', '{"decimos":-1,"iniciais":""}', '{"decimos":4.5,"iniciais":""}', '{"decimos":423,"iniciais":"abcd"}'];
  for (const valor of corrompidos) {
    const recordes = criarRecordes(armazenamentoEmMemoria({ 'kiwirun:v1:recorde:pecuaria': valor }));

    assert.equal(recordes.ler('pecuaria'), null, valor);
    assert.equal(recordes.registrar('pecuaria', 60), true, valor);
    assert.equal(recordes.ler('pecuaria').segundos, 60, valor);
  }
});

test('sem armazenamento, ou com ele recusando tudo, o Recorde vale só enquanto a página está aberta', () => {
  const quebrar = () => {
    throw new Error('SecurityError');
  };
  const recusando = { get length() { return quebrar(); }, key: quebrar, getItem: quebrar, setItem: quebrar, removeItem: quebrar };
  for (const armazenamento of [null, recusando]) {
    const recordes = criarRecordes(armazenamento);

    assert.equal(recordes.ler('pecuaria'), null);
    assert.equal(recordes.registrar('pecuaria', 42.3), true);
    recordes.gravarIniciais('pecuaria', 'ABC');
    assert.deepEqual(recordes.ler('pecuaria'), { segundos: 42.3, iniciais: 'ABC' });
    assert.equal(recordes.registrar('pecuaria', 42.3), false);
    recordes.zerar();
    assert.equal(recordes.ler('pecuaria'), null);
  }
});

test('o Recorde sobrevive a recriar os Recordes sobre o mesmo armazenamento, sob a chave da versão', () => {
  const armazenamento = armazenamentoEmMemoria();
  criarRecordes(armazenamento).registrar('pecuaria', 42.3);
  criarRecordes(armazenamento).gravarIniciais('pecuaria', 'ABC');

  assert.deepEqual(criarRecordes(armazenamento).ler('pecuaria'), { segundos: 42.3, iniciais: 'ABC' });
  assert.ok(armazenamento.getItem('kiwirun:v1:recorde:pecuaria'));
});

test('zerar apaga os Recordes de todas as Fases e nada mais do armazenamento', () => {
  const armazenamento = armazenamentoEmMemoria({ 'outro:app': 'x' });
  const recordes = criarRecordes(armazenamento);
  recordes.registrar('pecuaria', 42.3);
  recordes.registrar('porto', 50);

  recordes.zerar();

  assert.equal(recordes.ler('pecuaria'), null);
  assert.equal(recordes.ler('porto'), null);
  assert.equal(armazenamento.length, 1);
  assert.equal(armazenamento.getItem('outro:app'), 'x');
});

test('no Menu, o Recorde aparece como "ABC 42,3 s" no idioma atual, ou "—" sem Recorde', () => {
  const textos = criarTextos();

  assert.equal(textoRecorde({ segundos: 42.3, iniciais: 'ABC' }, textos), 'ABC 42,3 s');
  assert.equal(textoRecorde({ segundos: 75.3, iniciais: 'KIW' }, textos), 'KIW 1:15,3');
  assert.equal(textoRecorde({ segundos: 42.3, iniciais: '' }, textos), '42,3 s');
  assert.equal(textoRecorde(null, textos), '—');
  textos.definirIdioma('en');
  assert.equal(textoRecorde({ segundos: 42.3, iniciais: 'ABC' }, textos), 'ABC 42.3 s');
});

/**
 * Segura as teclas pelo atalho por `segundos`, em quadros de 0,1 s.
 *
 * @param {ReturnType<typeof criarAtalhoZerar>} atalho - O atalho.
 * @param {string[]} teclas - As teclas seguradas.
 * @param {number} segundos - Por quanto tempo.
 * @returns {number} Quantas vezes o atalho disparou.
 */
function segurar(atalho, teclas, segundos) {
  let disparos = 0;
  for (let quadro = 0; quadro < Math.round(segundos * 10); quadro += 1) {
    if (atalho.atualizar(new Set(teclas), 0.1)) disparos += 1;
  }
  return disparos;
}

test('segurar Shift+Backspace por 3 s dispara o atalho de zerar uma vez só', () => {
  const atalho = criarAtalhoZerar();

  assert.equal(segurar(atalho, ['ShiftLeft', 'Backspace'], 2.9), 0);
  assert.equal(segurar(atalho, ['ShiftLeft', 'Backspace'], 2), 1, 'continuar segurando não dispara de novo');
  segurar(atalho, [], 0.1);
  assert.equal(segurar(atalho, ['Backspace', 'ShiftRight'], SEGUNDOS_ZERAR), 1);
});

test('soltar Shift ou Backspace antes dos 3 s recomeça a contagem', () => {
  const atalho = criarAtalhoZerar();

  segurar(atalho, ['ShiftLeft', 'Backspace'], 2);
  segurar(atalho, ['ShiftLeft'], 0.1);
  assert.equal(segurar(atalho, ['ShiftLeft', 'Backspace'], 2), 0);
  assert.equal(segurar(atalho, ['Backspace'], 5), 0);
});

test('o Tempo final do Recorde é arredondado, não truncado, para décimos', () => {
  assert.equal(arredondarDecimos(42.36), 42.4);
  assert.equal(arredondarDecimos(42.34), 42.3);
  assert.equal(arredondarDecimos(0.04), 0);
  assert.equal(criarTextos().tempo(arredondarDecimos(7.3)), '7,3 s');
});
