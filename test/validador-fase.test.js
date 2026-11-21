/**
 * @file Validador de Fase: um mapa mínimo inválido por regra, um válido, e os mapas reais
 * de cada Fase do catálogo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MUNDOS, PREDADORES } from '../src/logica/catalogo.js';
import { DICIONARIOS as TEXTOS } from '../src/logica/textos.js';
import { validarCatalogo, validarFase } from '../src/logica/validador-fase.js';

const DICIONARIOS = {
  pt: { 'fato.teste.1': 'um', 'fato.teste.2': 'dois', 'fato.teste.3': 'três' },
  en: { 'fato.teste.1': 'one', 'fato.teste.2': 'two', 'fato.teste.3': 'three' },
};
const CONTEXTO = { dicionarios: DICIONARIOS, predadores: ['rato'] };

/** Uma Fase jogável de teste, com três chaves de Fato. */
function faseValida() {
  return {
    id: 'teste',
    chaveNome: 'fase.teste',
    emBreve: false,
    mapa: 'assets/mapas/teste.tmj',
    itens: ['la'],
    chavesFato: ['fato.teste.1', 'fato.teste.2', 'fato.teste.3'],
    tempoReferencia: 60,
  };
}

/** Um mapa Tiled mínimo de 10×5 tiles de 18 px que cumpre todas as regras. */
function mapaValido() {
  const ponto = (id, name, type, x, y) => ({ id, name, type, point: true, x, y, width: 0, height: 0 });
  return {
    width: 10,
    height: 5,
    tilewidth: 18,
    tileheight: 18,
    infinite: false,
    tilesets: [{ firstgid: 1, name: 'tileset', image: '../tiles/tileset.png' }],
    layers: [
      { type: 'tilelayer', name: 'colisao', width: 10, height: 5, data: Array(50).fill(0) },
      {
        type: 'objectgroup',
        name: 'objetos',
        objects: [
          ponto(1, 'inicio', '', 9, 72),
          { id: 2, name: 'fim', type: '', x: 162, y: 18, width: 18, height: 54 },
          ponto(3, 'item', 'la', 30, 60),
          ponto(4, 'samambaia', 'fato.teste.1', 40, 60),
          ponto(5, 'samambaia', 'fato.teste.2', 60, 60),
          ponto(6, 'samambaia', 'fato.teste.3', 80, 60),
          ponto(7, 'predador', 'rato', 100, 72),
        ],
      },
    ],
  };
}

/** Os objetos da camada `objetos` do mapa. */
function objetos(mapa) {
  return mapa.layers.find((camada) => camada.type === 'objectgroup').objects;
}

/** As regras dos problemas devolvidos. */
function regras(problemas) {
  return problemas.map((problema) => problema.regra);
}

test('um mapa mínimo válido não tem problemas', () => {
  assert.deepEqual(validarFase(faseValida(), mapaValido(), CONTEXTO), []);
});

test('mapa sem início é problema', () => {
  const mapa = mapaValido();
  objetos(mapa).splice(0, 1);

  assert.deepEqual(regras(validarFase(faseValida(), mapa, CONTEXTO)), ['inicio']);
});

test('mapa sem fim é problema', () => {
  const mapa = mapaValido();
  objetos(mapa).splice(1, 1);

  assert.deepEqual(regras(validarFase(faseValida(), mapa, CONTEXTO)), ['fim']);
});

test('mapa sem a camada `objetos` é problema', () => {
  const mapa = mapaValido();
  mapa.layers[1].name = 'Object Layer 1';

  assert.ok(regras(validarFase(faseValida(), mapa, CONTEXTO)).includes('camada-objetos'));
});

test('objeto fora da camada `objetos` não conta para a Fase', () => {
  const mapa = mapaValido();
  const [inicio] = objetos(mapa).splice(0, 1);
  mapa.layers.push({ type: 'objectgroup', name: 'Object Layer 1', objects: [inicio] });

  assert.deepEqual(regras(validarFase(faseValida(), mapa, CONTEXTO)), ['inicio']);
});

test('mapa com duas Samambaias-prateadas é problema', () => {
  const mapa = mapaValido();
  const fase = faseValida();
  objetos(mapa).splice(5, 1);
  fase.chavesFato.pop();

  assert.deepEqual(regras(validarFase(fase, mapa, CONTEXTO)), ['samambaias']);
});

test('Samambaia-prateada com chave de Fato fora do catálogo da Fase é problema', () => {
  const mapa = mapaValido();
  objetos(mapa)[5].type = 'fato.outra.1';

  assert.ok(regras(validarFase(faseValida(), mapa, CONTEXTO)).includes('chave-fato'));
});

test('chave de Fato repetida entre as Samambaias-prateadas é problema', () => {
  const mapa = mapaValido();
  objetos(mapa)[5].type = 'fato.teste.2';

  assert.ok(regras(validarFase(faseValida(), mapa, CONTEXTO)).includes('chave-repetida'));
});

test('Fato sem texto em algum idioma é problema', () => {
  const contexto = { ...CONTEXTO, dicionarios: { pt: DICIONARIOS.pt, en: { ...DICIONARIOS.en } } };
  delete contexto.dicionarios.en['fato.teste.2'];

  assert.deepEqual(regras(validarFase(faseValida(), mapaValido(), contexto)), ['fato-sem-texto']);
});

test('Item fora do catálogo da Fase é problema', () => {
  const mapa = mapaValido();
  objetos(mapa)[2].type = 'foguete';

  assert.deepEqual(regras(validarFase(faseValida(), mapa, CONTEXTO)), ['item']);
});

test('espécie de Predador fora do catálogo é problema', () => {
  const mapa = mapaValido();
  objetos(mapa)[6].type = 'leao';

  assert.deepEqual(regras(validarFase(faseValida(), mapa, CONTEXTO)), ['predador']);
});

test('objeto fora do mapa é problema', () => {
  const mapa = mapaValido();
  objetos(mapa)[2].x = 10 * 18 + 1;

  assert.deepEqual(regras(validarFase(faseValida(), mapa, CONTEXTO)), ['fora-do-mapa']);
});

test('área que passa da borda do mapa é problema', () => {
  const mapa = mapaValido();
  objetos(mapa)[1].y = 5 * 18 - 10;

  assert.deepEqual(regras(validarFase(faseValida(), mapa, CONTEXTO)), ['fora-do-mapa']);
});

test('mapa infinito é problema', () => {
  const mapa = mapaValido();
  mapa.infinite = true;

  assert.deepEqual(regras(validarFase(faseValida(), mapa, CONTEXTO)), ['infinito']);
});

test('tileset externo é problema', () => {
  const mapa = mapaValido();
  mapa.tilesets = [{ firstgid: 1, source: 'tileset.tsj' }];

  assert.deepEqual(regras(validarFase(faseValida(), mapa, CONTEXTO)), ['tileset-externo']);
});

test('camada comprimida é problema', () => {
  const mapa = mapaValido();
  Object.assign(mapa.layers[0], { encoding: 'base64', compression: 'zlib', data: 'eJw=' });

  assert.deepEqual(regras(validarFase(faseValida(), mapa, CONTEXTO)), ['compressao']);
});

/** Um catálogo de teste: um Mundo com a Fase de teste e uma Fase em breve, sem mapa. */
function catalogo(fase = faseValida()) {
  const emBreve = { id: 'depois', chaveNome: 'fase.depois', emBreve: true, mapa: null, itens: [], chavesFato: [], tempoReferencia: null };
  return [{ id: 'mundo', chaveNome: 'mundo.mundo', emBreve: false, fases: [fase, emBreve] }];
}

test('Fase em breve sem mapa não é problema', () => {
  const carregarMapa = (caminho) => (caminho === 'assets/mapas/teste.tmj' ? mapaValido() : null);

  assert.deepEqual(validarCatalogo(catalogo(), carregarMapa, CONTEXTO), []);
});

test('Fase jogável sem mapa é problema', () => {
  const problemas = validarCatalogo(catalogo(), () => null, CONTEXTO);

  assert.deepEqual(problemas.map(({ fase, regra }) => [fase, regra]), [['teste', 'sem-mapa']]);
});

test('Fase jogável sem caminho de mapa no catálogo é problema', () => {
  const fase = { ...faseValida(), mapa: null };

  assert.deepEqual(regras(validarCatalogo(catalogo(fase), () => mapaValido(), CONTEXTO)), ['sem-mapa']);
});

test('os problemas do mapa de uma Fase do catálogo levam o id da Fase', () => {
  const mapa = mapaValido();
  mapa.infinite = true;

  const problemas = validarCatalogo(catalogo(), () => mapa, CONTEXTO);

  assert.deepEqual(problemas.map(({ fase, regra }) => [fase, regra]), [['teste', 'infinito']]);
});

/**
 * Lê um `.tmj` a partir da raiz do repositório.
 *
 * @param {string} caminho - Caminho do mapa no catálogo.
 * @returns {object | null} O mapa, ou `null` se o arquivo não existe.
 */
function lerMapaDoRepo(caminho) {
  try {
    return JSON.parse(readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8'));
  } catch (erro) {
    if (erro.code === 'ENOENT') return null;
    throw erro;
  }
}

/**
 * Tolerância temporária: a Pecuária ainda não tem Samambaias-prateadas. A fatia de
 * Samambaias-prateadas remove esta exceção.
 */
const TOLERADOS = [{ fase: 'pecuaria', regra: 'samambaias' }];

test('o mapa de cada Fase do catálogo passa no Validador de Fase', () => {
  const problemas = validarCatalogo(MUNDOS, lerMapaDoRepo, { dicionarios: TEXTOS, predadores: PREDADORES })
    .filter((problema) => !TOLERADOS.some(({ fase, regra }) => problema.fase === fase && problema.regra === regra));

  const relatorio = problemas.map(({ fase, mensagem }) => `- ${fase}: ${mensagem}`).join('\n');
  assert.equal(problemas.length, 0, `Fases com problemas:\n${relatorio}`);
});
