/**
 * @file Codificador PNG RGBA mínimo, sem dependências, para os geradores de sprites.
 */
import { deflateSync } from 'node:zlib';

const TABELA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
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
 * @param {Buffer} dados - O conteúdo do bloco.
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
 * @param {number} largura - Em pixels.
 * @param {number} altura - Em pixels.
 * @param {(x: number, y: number) => number | null} cor - Cor do pixel como 0xRRGGBB, ou null para transparente.
 * @returns {Buffer} O arquivo PNG.
 */
export function codificarPng(largura, altura, cor) {
  const cabecalho = Buffer.alloc(13);
  cabecalho.writeUInt32BE(largura, 0);
  cabecalho.writeUInt32BE(altura, 4);
  cabecalho.writeUInt8(8, 8); // bits por canal
  cabecalho.writeUInt8(6, 9); // RGBA

  const bruto = Buffer.alloc(altura * (1 + largura * 4));
  for (let y = 0; y < altura; y += 1) {
    const inicio = y * (1 + largura * 4); // primeiro byte da linha: filtro 0
    for (let x = 0; x < largura; x += 1) {
      const rgb = cor(x, y);
      if (rgb === null) continue;
      bruto.writeUInt32BE(((rgb << 8) | 0xff) >>> 0, inicio + 1 + x * 4);
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    blocoPng('IHDR', cabecalho),
    blocoPng('IDAT', deflateSync(bruto, { level: 9 })),
    blocoPng('IEND', Buffer.alloc(0)),
  ]);
}
