/**
 * @file Gerador da música: a notação da melodia, a síntese chiptune num loop sem silêncio nem
 * estalo na emenda, o `.wav` mono e as faixas versionadas iguais ao que o script gera.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { codificarWav, lerNotacao, sintetizar, TAXA_AMOSTRAGEM } from '../scripts/gerar-musica.js';
import TEMA from '../scripts/musica/tema.js';
import { andamentosDoJogo, faixaMusica } from '../src/logica/musica.js';

/** Centro da onda em PCM de 8 bits sem sinal: o silêncio. */
const CENTRO = 128;
/** Uma janela sem nada acima disso, por mais de 50 ms, seria silêncio audível. */
const LIMIAR_SOM = 4;
const JANELA_SILENCIO = Math.round(TAXA_AMOSTRAGEM * 0.05);

/**
 * @param {string} nota - Nota com oitava, como `A4`.
 * @returns {number} A frequência da nota na notação, em Hz.
 */
function frequencia(nota) {
  return lerNotacao(`${nota}:1`)[0].frequencia;
}

test('a notação lê nota, oitava e duração em colcheias, e pausa como "-"', () => {
  assert.deepEqual(lerNotacao('A4:2 -:1  C#5:3'), [
    { frequencia: 440, colcheias: 2 },
    { frequencia: null, colcheias: 1 },
    { frequencia: frequencia('C#5'), colcheias: 3 },
  ]);
  assert.ok(Math.abs(frequencia('C5') - 523.25) < 0.01);
  assert.ok(Math.abs(frequencia('A3') - 220) < 1e-9);
  assert.equal(frequencia('Bb4'), frequencia('A#4'));
});

test('a notação recusa um símbolo que não entende', () => {
  assert.throws(() => lerNotacao('H4:2'), /H4:2/);
  assert.throws(() => lerNotacao('A4:0'), /A4:0/);
});

test('as vozes do tema têm o mesmo comprimento, ou a síntese recusa', () => {
  assert.throws(() => sintetizar({ melodia: 'A4:2', baixo: 'A2:1' }, 120), /comprimento/);
});

test('o loop tem exatamente a duração musical do tema, em amostras, em todo andamento', () => {
  const colcheias = lerNotacao(TEMA.melodia).reduce((soma, nota) => soma + nota.colcheias, 0);

  for (const andamento of andamentosDoJogo()) {
    const esperado = Math.round((colcheias * TAXA_AMOSTRAGEM * 60) / (andamento * 2));
    assert.equal(sintetizar(TEMA, andamento).length, esperado, `${andamento} bpm`);
  }
});

test('o loop não tem silêncio audível: nem no começo, nem no fim, nem no meio', () => {
  for (const andamento of andamentosDoJogo()) {
    const amostras = sintetizar(TEMA, andamento);
    let silencio = 0;
    // Dá a volta na emenda: o fim seguido do começo também não pode calar.
    for (let i = 0; i < amostras.length + JANELA_SILENCIO; i += 1) {
      const amostra = amostras[i % amostras.length];
      silencio = Math.abs(amostra - CENTRO) > LIMIAR_SOM ? 0 : silencio + 1;
      assert.ok(silencio < JANELA_SILENCIO, `${andamento} bpm: silêncio perto da amostra ${i}`);
    }
  }
});

test('a emenda do loop não estala: o fim e o começo encostam no centro da onda', () => {
  for (const andamento of andamentosDoJogo()) {
    const amostras = sintetizar(TEMA, andamento);

    assert.ok(Math.abs(amostras[0] - CENTRO) <= 1, `${andamento} bpm: começo ${amostras[0]}`);
    assert.ok(Math.abs(amostras.at(-1) - CENTRO) <= 1, `${andamento} bpm: fim ${amostras.at(-1)}`);
  }
});

test('o .wav é PCM mono de 8 bits na taxa do gerador', () => {
  const wav = codificarWav(Uint8Array.of(128, 200, 50), TAXA_AMOSTRAGEM);

  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.readUInt32LE(4), wav.length - 8);
  assert.equal(wav.toString('ascii', 8, 16), 'WAVEfmt ');
  assert.equal(wav.readUInt16LE(20), 1, 'PCM');
  assert.equal(wav.readUInt16LE(22), 1, 'mono');
  assert.equal(wav.readUInt32LE(24), TAXA_AMOSTRAGEM);
  assert.equal(wav.readUInt16LE(34), 8, 'bits por amostra');
  assert.equal(wav.toString('ascii', 36, 40), 'data');
  assert.equal(wav.readUInt32LE(40), 3);
  assert.deepEqual([...wav.subarray(44)], [128, 200, 50]);
});

test('as faixas versionadas são exatamente o que o script gera da notação', async () => {
  for (const andamento of andamentosDoJogo()) {
    const versionada = await readFile(new URL(`../${faixaMusica(andamento)}`, import.meta.url));
    const gerada = codificarWav(sintetizar(TEMA, andamento), TAXA_AMOSTRAGEM);

    assert.ok(versionada.equals(gerada), `${faixaMusica(andamento)} desatualizada: rode npm run gerar:musica`);
  }
});
