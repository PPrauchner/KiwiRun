/**
 * @file Fatos: todo Fato que o catálogo referencia tem fonte registrada e cabe na tela,
 * com no máximo 90 caracteres e 2 linhas na largura da Fila de Fatos, em cada idioma.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MUNDOS } from '../src/logica/catalogo.js';
import { DICIONARIOS } from '../src/logica/textos.js';
import { LARGURA_FATO, LINHAS_FATO } from '../src/logica/fila-fatos.js';
import FONTES_FATOS from '../src/conteudo/fontes-fatos.js';

const MAXIMO_CARACTERES = 90;
const URL_FONTE = new URL('../assets/fonte/kiwirun.xml', import.meta.url);

/** As chaves de Fato de todas as Fases do catálogo. */
const CHAVES = MUNDOS.flatMap((mundo) => mundo.fases).flatMap((fase) => fase.chavesFato);

/**
 * Lê o avanço horizontal de cada caractere da fonte bitmap (BMFont XML).
 *
 * @returns {Promise<Map<string, number>>} Pixels que cada caractere avança.
 */
async function avancosDaFonte() {
  const xml = await readFile(URL_FONTE, 'utf8');
  const avancos = [...xml.matchAll(/<char id="(\d+)"[^>]*xadvance="(\d+)"/g)];
  return new Map(avancos.map(([, id, avanco]) => [String.fromCodePoint(Number(id)), Number(avanco)]));
}

/**
 * Quebra o texto por palavras, como o `setMaxWidth` do BitmapText do Phaser.
 *
 * @param {string} texto - O Fato.
 * @param {Map<string, number>} avancos - Avanço de cada caractere, em pixels.
 * @param {number} largura - Largura máxima da linha, em pixels.
 * @returns {string[]} As linhas.
 */
function quebrarEmLinhas(texto, avancos, largura) {
  const medir = (trecho) => [...trecho].reduce((soma, caractere) => soma + (avancos.get(caractere) ?? 0), 0);
  const linhas = [];
  for (const palavra of texto.split(' ')) {
    const ultima = linhas.at(-1);
    if (ultima !== undefined && medir(`${ultima} ${palavra}`) <= largura) linhas[linhas.length - 1] = `${ultima} ${palavra}`;
    else linhas.push(palavra);
  }
  return linhas;
}

test('a Pecuária referencia três Fatos', () => {
  const pecuaria = MUNDOS.flatMap((mundo) => mundo.fases).find((fase) => fase.id === 'pecuaria');

  assert.equal(pecuaria.chavesFato.length, 3);
});

test('o Porto referencia três Fatos', () => {
  const porto = MUNDOS.flatMap((mundo) => mundo.fases).find((fase) => fase.id === 'porto');

  assert.equal(porto.chavesFato.length, 3);
});

test('os Fatos da Pecuária são os definitivos, sem a marca de provisório', () => {
  const pecuaria = MUNDOS.flatMap((mundo) => mundo.fases).find((fase) => fase.id === 'pecuaria');

  for (const chave of pecuaria.chavesFato) assert.equal(FONTES_FATOS[chave].provisorio, false, `${chave} ainda provisório`);
});

test('todo Fato referenciado tem fonte registrada', () => {
  for (const chave of CHAVES) {
    const registro = FONTES_FATOS[chave];
    assert.ok(registro && registro.fonte.trim() !== '', `${chave} sem fonte`);
  }
});

test('todo Fato referenciado tem no máximo 90 caracteres em cada idioma', () => {
  for (const [idioma, dicionario] of Object.entries(DICIONARIOS)) {
    for (const chave of CHAVES) {
      assert.ok([...dicionario[chave]].length <= MAXIMO_CARACTERES, `${idioma}.${chave} passa de ${MAXIMO_CARACTERES}`);
    }
  }
});

test('todo Fato referenciado cabe em 2 linhas na largura da fonte bitmap', async () => {
  const avancos = await avancosDaFonte();

  for (const [idioma, dicionario] of Object.entries(DICIONARIOS)) {
    for (const chave of CHAVES) {
      const linhas = quebrarEmLinhas(dicionario[chave], avancos, LARGURA_FATO);
      assert.ok(linhas.length <= LINHAS_FATO, `${idioma}.${chave} ocupa ${linhas.length} linhas: ${linhas.join(' | ')}`);
    }
  }
});
