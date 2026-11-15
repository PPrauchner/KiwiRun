/**
 * @file Gera a fonte bitmap do KiwiRun: `assets/fonte/kiwirun.png` + `kiwirun.xml` (BMFont).
 *
 * A fonte é asset próprio, desenhado em `scripts/fonte/glifos.js`, com os acentos do
 * português e os macrons do māori compostos sobre as letras-base. Glifos brancos sobre
 * fundo transparente, para o jogo poder tingi-los. Sem dependências além do Node.
 *
 * Uso: `npm run gerar:fonte`.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { GLIFOS, ACENTOS, COMPOSTOS } from './fonte/glifos.js';

const NOME = 'kiwirun';
const PASTA_SAIDA = new URL('../assets/fonte/', import.meta.url);

/** Altura de toda célula: 2 linhas de acento de maiúscula, 1 de folga, 7 de corpo, 2 de descendente. */
const ALTURA = 12;
/** Linha onde começa o topo das maiúsculas. */
const TOPO_CORPO = 3;
/** Linha do acento sobre maiúscula e sobre minúscula; a cedilha fica na descendente. */
const LINHA_ACENTO_MAIUSCULA = 0;
const LINHA_ACENTO_MINUSCULA = 2;
const LINHA_CEDILHA = TOPO_CORPO + 7;
/** Pixels de espaço entre um caractere e o seguinte. */
const ESPACAMENTO = 1;
/** Pixels vazios entre glifos no atlas, para a amostragem não vazar para o vizinho. */
const MARGEM_ATLAS = 1;

/**
 * @typedef {Object} Glifo
 * @property {string} caractere
 * @property {number} largura
 * @property {boolean[][]} pixels - ALTURA linhas de `largura` pixels.
 */

/**
 * Converte um desenho em pixels, validando que só usa '#' e '.'.
 *
 * @param {string} caractere - O caractere desenhado, para a mensagem de erro.
 * @param {string[]} desenho - As linhas do desenho.
 * @returns {boolean[][]} As linhas em pixels, sem preencher a largura.
 * @throws {Error} Se o desenho tiver outro símbolo.
 */
function lerDesenho(caractere, desenho) {
  return desenho.map((linha) => {
    if (!/^[#.]*$/.test(linha)) throw new Error(`Glifo "${caractere}" com símbolo inválido: ${linha}`);
    return [...linha].map((simbolo) => simbolo === '#');
  });
}

/**
 * Cria um glifo vazio do tamanho de uma célula.
 *
 * @param {string} caractere
 * @param {number} largura
 * @returns {Glifo}
 */
function glifoVazio(caractere, largura) {
  const pixels = Array.from({ length: ALTURA }, () => Array(largura).fill(false));
  return { caractere, largura, pixels };
}

/**
 * Acende num glifo os pixels de um desenho, a partir da linha e coluna dadas.
 *
 * @param {Glifo} glifo
 * @param {boolean[][]} desenho
 * @param {number} linha
 * @param {number} coluna
 */
function carimbar(glifo, desenho, linha, coluna) {
  desenho.forEach((pixels, dy) => {
    pixels.forEach((aceso, dx) => {
      if (aceso) glifo.pixels[linha + dy][coluna + dx] = true;
    });
  });
}

/**
 * @param {boolean[][]} desenho
 * @returns {number} A largura do desenho (a da linha mais longa).
 */
function larguraDe(desenho) {
  return Math.max(...desenho.map((linha) => linha.length));
}

/** @returns {Map<string, Glifo>} Os glifos simples, por caractere. */
function glifosSimples() {
  const glifos = new Map();
  for (const [caractere, desenho] of Object.entries(GLIFOS)) {
    const pixels = lerDesenho(caractere, desenho);
    const glifo = glifoVazio(caractere, larguraDe(pixels));
    carimbar(glifo, pixels, TOPO_CORPO, 0);
    glifos.set(caractere, glifo);
  }
  return glifos;
}

/**
 * Compõe uma letra acentuada: a base e o acento, centralizados na mesma célula.
 *
 * @param {string} caractere
 * @param {string} base
 * @param {keyof typeof ACENTOS} acento
 * @returns {Glifo}
 */
function glifoComposto(caractere, base, acento) {
  const pixelsBase = lerDesenho(base, GLIFOS[base]);
  const pixelsAcento = lerDesenho(acento, ACENTOS[acento]);
  const largura = Math.max(larguraDe(pixelsBase), larguraDe(pixelsAcento));
  const glifo = glifoVazio(caractere, largura);
  const centralizar = (desenho) => Math.floor((largura - larguraDe(desenho)) / 2);
  const minuscula = base !== base.toUpperCase();

  let linhaAcento = minuscula ? LINHA_ACENTO_MINUSCULA : LINHA_ACENTO_MAIUSCULA;
  if (acento === 'cedilha') linhaAcento = LINHA_CEDILHA;

  carimbar(glifo, pixelsBase, TOPO_CORPO, centralizar(pixelsBase));
  carimbar(glifo, pixelsAcento, linhaAcento, centralizar(pixelsAcento));
  return glifo;
}

/** @returns {Glifo[]} Todos os glifos da fonte. */
function todosOsGlifos() {
  const glifos = glifosSimples();
  for (const [caractere, base, acento] of COMPOSTOS) {
    glifos.set(caractere, glifoComposto(caractere, base, acento));
  }
  return [...glifos.values()];
}

const TABELA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

/** @param {Buffer} dados @returns {number} O CRC-32 dos dados, como o PNG exige. */
function crc32(dados) {
  let c = 0xffffffff;
  for (const byte of dados) c = TABELA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * @param {string} tipo - O tipo do bloco PNG (4 letras).
 * @param {Buffer} dados
 * @returns {Buffer} O bloco com tamanho, tipo, dados e CRC.
 */
function blocoPng(tipo, dados) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

/**
 * Codifica uma imagem RGBA de 8 bits como PNG.
 *
 * @param {number} largura
 * @param {number} altura
 * @param {(x: number, y: number) => boolean} aceso - Se o pixel é branco opaco (senão, transparente).
 * @returns {Buffer} O arquivo PNG.
 */
function codificarPng(largura, altura, aceso) {
  const cabecalho = Buffer.alloc(13);
  cabecalho.writeUInt32BE(largura, 0);
  cabecalho.writeUInt32BE(altura, 4);
  cabecalho.writeUInt8(8, 8); // bits por canal
  cabecalho.writeUInt8(6, 9); // RGBA

  const bruto = Buffer.alloc(altura * (1 + largura * 4));
  for (let y = 0; y < altura; y++) {
    const inicio = y * (1 + largura * 4); // primeiro byte da linha: filtro 0
    for (let x = 0; x < largura; x++) {
      if (aceso(x, y)) bruto.fill(0xff, inicio + 1 + x * 4, inicio + 5 + x * 4);
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    blocoPng('IHDR', cabecalho),
    blocoPng('IDAT', deflateSync(bruto, { level: 9 })),
    blocoPng('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Monta o atlas (todos os glifos numa faixa) e a descrição BMFont XML.
 *
 * @param {Glifo[]} glifos
 * @returns {{ png: Buffer, xml: string }}
 */
function montarFonte(glifos) {
  let x = MARGEM_ATLAS;
  const posicoes = glifos.map((glifo) => {
    const posicao = { glifo, x };
    x += glifo.largura + MARGEM_ATLAS;
    return posicao;
  });
  const largura = x;
  const altura = ALTURA + 2 * MARGEM_ATLAS;

  const colunas = new Map();
  for (const { glifo, x: inicio } of posicoes) {
    for (let dx = 0; dx < glifo.largura; dx++) colunas.set(inicio + dx, { glifo, dx });
  }
  const png = codificarPng(largura, altura, (px, py) => {
    const coluna = colunas.get(px);
    const linha = py - MARGEM_ATLAS;
    return Boolean(coluna && linha >= 0 && linha < ALTURA && coluna.glifo.pixels[linha][coluna.dx]);
  });

  const chars = posicoes.map(({ glifo, x: inicio }) =>
    `    <char id="${glifo.caractere.codePointAt(0)}" x="${inicio}" y="${MARGEM_ATLAS}" ` +
    `width="${glifo.largura}" height="${ALTURA}" xoffset="0" yoffset="0" ` +
    `xadvance="${glifo.largura + ESPACAMENTO}" page="0" chnl="15"/>`);

  const xml = [
    '<?xml version="1.0"?>',
    '<font>',
    `  <info face="${NOME}" size="${ALTURA}" bold="0" italic="0" charset="" unicode="1" stretchH="100" smooth="0" aa="1" padding="0,0,0,0" spacing="${MARGEM_ATLAS},${MARGEM_ATLAS}"/>`,
    `  <common lineHeight="${ALTURA + 1}" base="${TOPO_CORPO + 7}" scaleW="${largura}" scaleH="${altura}" pages="1" packed="0"/>`,
    '  <pages>',
    `    <page id="0" file="${NOME}.png"/>`,
    '  </pages>',
    `  <chars count="${glifos.length}">`,
    ...chars,
    '  </chars>',
    '</font>',
    '',
  ].join('\n');

  return { png, xml };
}

const { png, xml } = montarFonte(todosOsGlifos());
await mkdir(PASTA_SAIDA, { recursive: true });
await writeFile(new URL(`${NOME}.png`, PASTA_SAIDA), png);
await writeFile(new URL(`${NOME}.xml`, PASTA_SAIDA), xml);
console.log(`Fonte gerada em assets/fonte/ (${xml.match(/<char /g).length} glifos).`);
