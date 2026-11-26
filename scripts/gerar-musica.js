/**
 * @file Gera a música do jogo: sintetiza o tema chiptune (melodia em onda de pulso, baixo em
 * onda triangular) a partir da notação versionada em `scripts/musica/tema.js`, num `.wav`
 * mono de 8 bits por andamento — o base e o de cada Fase jogável. Sem dependências além do
 * Node e sem aleatoriedade: a mesma notação gera os mesmos bytes.
 *
 * O loop tem exatamente a duração musical do tema, sem silêncio antes ou depois, e cada nota
 * entra e sai do centro da onda, para a emenda do loop não estalar.
 *
 * Uso: `npm run gerar:musica`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import TEMA from './musica/tema.js';
import { andamentosDoJogo, faixaMusica } from '../src/logica/musica.js';

const RAIZ_REPO = fileURLToPath(new URL('..', import.meta.url));

/** Amostras por segundo: modesta, para o `.wav` versionado ficar pequeno. */
export const TAXA_AMOSTRAGEM = 22050;
const COLCHEIAS_POR_BATIDA = 2;
/** Entrada e saída de cada nota, em amostras (~2 ms e ~8 ms): sem estalo entre notas. */
const AMOSTRAS_ATAQUE = 44;
const AMOSTRAS_SOLTURA = 176;
/** Fração do ciclo em que a onda de pulso fica alta: o timbre "nasal" do chiptune. */
const CICLO_PULSO = 0.25;
const VOLUME_MELODIA = 0.3;
const VOLUME_BAIXO = 0.4;

const SEMITONS = Object.freeze({ C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 });
const ACIDENTES = Object.freeze({ '': 0, '#': 1, b: -1 });
const SIMBOLO = /^(?:(-)|([A-G])(#|b)?(\d)):([1-9]\d*)$/;

/**
 * @typedef {Object} Nota
 * @property {number | null} frequencia - Em Hz; `null` é pausa.
 * @property {number} colcheias - Duração, em colcheias.
 */

/**
 * @typedef {Object} Tema
 * @property {string} melodia - A voz de pulso, em notação.
 * @property {string} baixo - A voz triangular, em notação.
 */

/**
 * Lê uma voz em notação: símbolos `NOTA:COLCHEIAS` separados por espaço, `-` para pausa.
 *
 * @param {string} notacao - A voz.
 * @returns {Nota[]} As notas, na ordem.
 * @throws {Error} Se um símbolo não segue a notação.
 */
export function lerNotacao(notacao) {
  return notacao.trim().split(/\s+/).map((simbolo) => {
    const partes = SIMBOLO.exec(simbolo);
    if (!partes) throw new Error(`Símbolo fora da notação: ${simbolo}`);
    const [, pausa, nome, acidente = '', oitava, colcheias] = partes;
    if (pausa) return { frequencia: null, colcheias: Number(colcheias) };
    const semitonsDoLa4 = SEMITONS[nome] + ACIDENTES[acidente] + (Number(oitava) - 4) * 12;
    return { frequencia: 440 * 2 ** (semitonsDoLa4 / 12), colcheias: Number(colcheias) };
  });
}

/**
 * @param {number} fase - Posição no ciclo da onda, em [0, 1).
 * @returns {number} A onda de pulso, em [-1, 1].
 */
function pulso(fase) {
  return fase < CICLO_PULSO ? 1 : -1;
}

/**
 * @param {number} fase - Posição no ciclo da onda, em [0, 1).
 * @returns {number} A onda triangular, em [-1, 1], começando do centro.
 */
function triangulo(fase) {
  return 1 - 4 * Math.abs(((fase + 0.75) % 1) - 0.5);
}

/**
 * Soma uma voz ao loop, nota a nota. Cada nota começa e termina num ponto arredondado da
 * duração musical, para a soma das notas dar o loop inteiro sem sobra nem falta.
 *
 * @param {Float64Array} loop - O loop, somado no lugar.
 * @param {Nota[]} notas - A voz.
 * @param {number} amostrasPorColcheia - Pode ser fracionário.
 * @param {(fase: number) => number} onda - A forma de onda.
 * @param {number} volume - Amplitude da voz.
 */
function somarVoz(loop, notas, amostrasPorColcheia, onda, volume) {
  let colcheia = 0;
  for (const { frequencia, colcheias } of notas) {
    const inicio = Math.round(colcheia * amostrasPorColcheia);
    colcheia += colcheias;
    const fim = Math.round(colcheia * amostrasPorColcheia);
    if (frequencia === null) continue;
    const duracao = fim - inicio;
    for (let i = 0; i < duracao; i += 1) {
      const envelope = Math.min(1, i / AMOSTRAS_ATAQUE, (duracao - 1 - i) / AMOSTRAS_SOLTURA);
      loop[inicio + i] += volume * envelope * onda(((i * frequencia) / TAXA_AMOSTRAGEM) % 1);
    }
  }
}

/**
 * @param {Nota[]} notas - Uma voz.
 * @returns {number} A duração da voz, em colcheias.
 */
function duracaoEmColcheias(notas) {
  return notas.reduce((soma, nota) => soma + nota.colcheias, 0);
}

/**
 * Sintetiza um loop do tema num andamento.
 *
 * @param {Tema} tema - As vozes, em notação.
 * @param {number} andamento - Em batidas (semínimas) por minuto.
 * @returns {Uint8Array} As amostras, PCM de 8 bits sem sinal (128 é o centro).
 * @throws {Error} Se as vozes não têm o mesmo comprimento.
 */
export function sintetizar(tema, andamento) {
  const melodia = lerNotacao(tema.melodia);
  const baixo = lerNotacao(tema.baixo);
  const colcheias = duracaoEmColcheias(melodia);
  if (duracaoEmColcheias(baixo) !== colcheias) {
    throw new Error(`As vozes têm comprimento diferente: ${colcheias} e ${duracaoEmColcheias(baixo)} colcheias`);
  }
  const amostrasPorColcheia = (TAXA_AMOSTRAGEM * 60) / (andamento * COLCHEIAS_POR_BATIDA);
  const loop = new Float64Array(Math.round(colcheias * amostrasPorColcheia));
  somarVoz(loop, melodia, amostrasPorColcheia, pulso, VOLUME_MELODIA);
  somarVoz(loop, baixo, amostrasPorColcheia, triangulo, VOLUME_BAIXO);
  return Uint8Array.from(loop, (valor) => Math.round(128 + 127 * Math.max(-1, Math.min(1, valor))));
}

/**
 * Embrulha amostras num `.wav` PCM mono de 8 bits.
 *
 * @param {Uint8Array} amostras - PCM de 8 bits sem sinal.
 * @param {number} taxa - Amostras por segundo.
 * @returns {Buffer} O arquivo `.wav`.
 */
export function codificarWav(amostras, taxa) {
  const cabecalho = Buffer.alloc(44);
  cabecalho.write('RIFF', 0, 'ascii');
  cabecalho.writeUInt32LE(36 + amostras.length, 4);
  cabecalho.write('WAVEfmt ', 8, 'ascii');
  cabecalho.writeUInt32LE(16, 16);
  cabecalho.writeUInt16LE(1, 20); // PCM
  cabecalho.writeUInt16LE(1, 22); // mono
  cabecalho.writeUInt32LE(taxa, 24);
  cabecalho.writeUInt32LE(taxa, 28); // bytes por segundo: 1 byte por amostra
  cabecalho.writeUInt16LE(1, 32);
  cabecalho.writeUInt16LE(8, 34);
  cabecalho.write('data', 36, 'ascii');
  cabecalho.writeUInt32LE(amostras.length, 40);
  return Buffer.concat([cabecalho, amostras]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const andamento of andamentosDoJogo()) {
    const destino = `${RAIZ_REPO}${faixaMusica(andamento)}`;
    await mkdir(dirname(destino), { recursive: true });
    await writeFile(destino, codificarWav(sintetizar(TEMA, andamento), TAXA_AMOSTRAGEM));
    console.log(`Gerado ${faixaMusica(andamento)}`);
  }
}
