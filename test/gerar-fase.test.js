/**
 * @file Gerador de Fase: formato Tiled, limites do pulo e recusa de sobrescrever sem --force.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gerarMapa } from '../scripts/gerar-fase.js';
import { PULO, TILE } from '../src/logica/pulo.js';
import { buscarFase } from '../src/logica/catalogo.js';

const SCRIPT = fileURLToPath(new URL('../scripts/gerar-fase.js', import.meta.url));

/** Uma descrição mínima de Fase: chão, vão, chão. */
function descricao(campos = {}) {
  return {
    altura: 20,
    trechos: [{ chao: 10, altura: 3 }, { vao: 2 }, { chao: 10, altura: 3 }],
    plataformas: [],
    ...campos,
  };
}

/** Roda o gerador como o autor roda, devolvendo o código de saída. */
function rodarGerador(...argumentos) {
  return spawnSync(process.execPath, [SCRIPT, 'pecuaria', ...argumentos], { encoding: 'utf8' });
}

test('o mapa gerado é Tiled: finito, ortogonal, sem compressão e com o tileset embutido', () => {
  const mapa = gerarMapa(descricao());

  assert.equal(mapa.type, 'map');
  assert.equal(mapa.orientation, 'orthogonal');
  assert.equal(mapa.infinite, false);
  assert.equal(mapa.tilewidth, TILE);
  assert.equal(mapa.tileheight, TILE);
  assert.equal(mapa.tilesets.length, 1);
  assert.ok(mapa.tilesets[0].image, 'tileset embutido tem imagem');
  assert.equal(mapa.tilesets[0].source, undefined);
  for (const camada of mapa.layers.filter((candidata) => candidata.type === 'tilelayer')) {
    assert.ok(Array.isArray(camada.data), `${camada.name} sem compressão`);
    assert.equal(camada.data.length, mapa.width * mapa.height);
    assert.equal(camada.encoding, undefined);
  }
});

test('o mapa tem as camadas fundo, colisao, frente e a de objetos, nessa ordem', () => {
  const mapa = gerarMapa(descricao());

  assert.deepEqual(
    mapa.layers.map((camada) => [camada.name, camada.type]),
    [['fundo', 'tilelayer'], ['colisao', 'tilelayer'], ['frente', 'tilelayer'], ['objetos', 'objectgroup']],
  );
});

test('o mapa marca o início sobre o primeiro chão e o fim sobre o último', () => {
  const mapa = gerarMapa(descricao());
  const objetos = mapa.layers.find((camada) => camada.name === 'objetos').objects;
  const inicio = objetos.find((objeto) => objeto.name === 'inicio');
  const fim = objetos.find((objeto) => objeto.name === 'fim');
  const topoDoChao = (mapa.height - 3) * TILE;

  assert.equal(inicio.y, topoDoChao);
  assert.ok(inicio.x < 10 * TILE);
  assert.ok(fim.x > 12 * TILE);
  assert.equal(fim.y + fim.height, topoDoChao);
});

test('o vão fica sem chão até a borda inferior do mapa', () => {
  const mapa = gerarMapa(descricao());
  const colisao = mapa.layers.find((camada) => camada.name === 'colisao');
  const colunaDoVao = 10;

  for (let linha = 0; linha < mapa.height; linha += 1) {
    assert.equal(colisao.data[linha * mapa.width + colunaDoVao], 0);
  }
});

test('a plataforma de mão única tem a propriedade no tileset', () => {
  const mapa = gerarMapa(descricao({ plataformas: [{ coluna: 3, largura: 3, alturaSobreChao: 3 }] }));
  const colisao = mapa.layers.find((camada) => camada.name === 'colisao');
  const linha = mapa.height - 3 - 3;
  const gid = colisao.data[linha * mapa.width + 4];
  const tileset = mapa.tilesets[0];
  const tile = tileset.tiles.find((candidato) => candidato.id === gid - tileset.firstgid);

  assert.ok(gid > 0);
  assert.deepEqual(tile.properties, [{ name: 'umaMao', type: 'bool', value: true }]);
});

test('vão mais largo que o alcance do pulo é recusado', () => {
  const trechos = [{ chao: 10, altura: 3 }, { vao: PULO.segurado.alcance + 1 }, { chao: 10, altura: 3 }];

  assert.throws(() => gerarMapa(descricao({ trechos })), /vão/);
});

test('vão no alcance seguido de subida é recusado: o alcance cai quando o pouso sobe', () => {
  const trechos = [{ chao: 10, altura: 3 }, { vao: PULO.segurado.alcance }, { chao: 10, altura: 3 + PULO.segurado.altura }];

  assert.throws(() => gerarMapa(descricao({ trechos })), /vão/);
});

test('vão curto seguido de subida que o pulo vence é aceito', () => {
  const trechos = [{ chao: 10, altura: 3 }, { vao: 2 }, { chao: 10, altura: 3 + PULO.segurado.altura }];

  assert.doesNotThrow(() => gerarMapa(descricao({ trechos })));
});

test('degrau mais alto que o pulo é recusado', () => {
  const trechos = [{ chao: 10, altura: 3 }, { chao: 10, altura: 3 + PULO.segurado.altura + 1 }];

  assert.throws(() => gerarMapa(descricao({ trechos })), /degrau/);
});

test('plataforma acima do alcance do pulo é recusada', () => {
  const plataformas = [{ coluna: 3, largura: 3, alturaSobreChao: PULO.segurado.altura + 1 }];

  assert.throws(() => gerarMapa(descricao({ plataformas })), /plataforma/);
});

test('sem --force, o gerador falha sobre um .tmj existente e não o altera', async () => {
  const saida = join(await mkdtemp(join(tmpdir(), 'kiwirun-')), 'pecuaria.tmj');
  await writeFile(saida, 'original');

  const resultado = rodarGerador('--saida', saida);

  assert.notEqual(resultado.status, 0);
  assert.equal(await readFile(saida, 'utf8'), 'original');
});

test('com --force, o gerador sobrescreve o .tmj existente', async () => {
  const saida = join(await mkdtemp(join(tmpdir(), 'kiwirun-')), 'pecuaria.tmj');
  await writeFile(saida, 'original');

  const resultado = rodarGerador('--saida', saida, '--force');

  assert.equal(resultado.status, 0, resultado.stderr);
  assert.equal(JSON.parse(await readFile(saida, 'utf8')).type, 'map');
});

test('a descrição da Pecuária cabe no pulo e o .tmj versionado tem o que a cena Fase lê', async () => {
  const { default: pecuaria } = await import('../scripts/fases/pecuaria.js');
  assert.doesNotThrow(() => gerarMapa(pecuaria));

  // Lê o arquivo, não o gerador: depois de salvo no Tiled ele continua valendo.
  const mapa = JSON.parse(await readFile(new URL('../assets/mapas/pecuaria.tmj', import.meta.url), 'utf8'));
  const nomes = mapa.layers.map((camada) => camada.name);
  const objetos = mapa.layers.find((camada) => camada.name === 'objetos').objects.map((objeto) => objeto.name);

  assert.deepEqual(nomes, ['fundo', 'colisao', 'frente', 'objetos']);
  assert.ok(objetos.includes('inicio') && objetos.includes('fim'));
  assert.equal(mapa.infinite, false);
});

/** Os objetos do mapa com esse nome. */
function objetosChamados(mapa, nome) {
  return mapa.layers.find((camada) => camada.name === 'objetos').objects.filter((objeto) => objeto.name === nome);
}

test('cada Item vira um ponto "item" com o id no tipo, no centro do tile acima do chão', () => {
  const mapa = gerarMapa(descricao({ itens: [{ coluna: 4, item: 'la', alturaSobreChao: 1 }, { coluna: 15, item: 'leite', alturaSobreChao: 3 }] }));
  const itens = objetosChamados(mapa, 'item');
  const topoDoChao = mapa.height - 3;

  assert.deepEqual(
    itens.map(({ type, x, y, point }) => ({ type, x, y, point })),
    [
      { type: 'la', x: 4.5 * TILE, y: (topoDoChao - 0.5) * TILE, point: true },
      { type: 'leite', x: 15.5 * TILE, y: (topoDoChao - 2.5) * TILE, point: true },
    ],
  );
  assert.equal(new Set(mapa.layers.find((camada) => camada.name === 'objetos').objects.map((objeto) => objeto.id)).size, 4);
});

test('Item sobre um vão ou fora do alcance do pulo é recusado', () => {
  assert.throws(() => gerarMapa(descricao({ itens: [{ coluna: 10, item: 'la', alturaSobreChao: 1 }] })), /item/);
  const altoDemais = PULO.segurado.altura + 2;
  assert.throws(() => gerarMapa(descricao({ itens: [{ coluna: 4, item: 'la', alturaSobreChao: altoDemais }] })), /item/);
});

test('cada Checkpoint vira um ponto "checkpoint" pousado no chão da coluna', () => {
  const mapa = gerarMapa(descricao({ checkpoints: [14] }));
  const [checkpoint] = objetosChamados(mapa, 'checkpoint');

  assert.equal(checkpoint.x, 14.5 * TILE);
  assert.equal(checkpoint.y, (mapa.height - 3) * TILE);
  assert.equal(checkpoint.point, true);
});

test('Checkpoint sobre um vão é recusado', () => {
  assert.throws(() => gerarMapa(descricao({ checkpoints: [10] })), /checkpoint/);
});

test('a Pecuária versionada tem Checkpoint e só Itens do tema que o catálogo declara', async () => {
  const mapa = JSON.parse(await readFile(new URL('../assets/mapas/pecuaria.tmj', import.meta.url), 'utf8'));
  const tipos = objetosChamados(mapa, 'item').map((objeto) => objeto.type);

  assert.ok(tipos.length > 0);
  assert.deepEqual([...new Set(tipos)].sort(), [...buscarFase('pecuaria').itens].sort());
  assert.ok(objetosChamados(mapa, 'checkpoint').length > 0);
});

test('cada Samambaia-prateada vira um ponto "samambaia" com a chave do Fato no tipo', () => {
  const mapa = gerarMapa(descricao({ samambaias: [{ coluna: 5, chave: 'fato.teste.1', alturaSobreChao: 2 }] }));
  const [samambaia] = objetosChamados(mapa, 'samambaia');

  assert.deepEqual(
    { type: samambaia.type, x: samambaia.x, y: samambaia.y, point: samambaia.point },
    { type: 'fato.teste.1', x: 5.5 * TILE, y: (mapa.height - 3 - 1.5) * TILE, point: true },
  );
});

test('a Samambaia-prateada escondida fica atrás de um tile da camada frente', () => {
  const visivel = gerarMapa(descricao({ samambaias: [{ coluna: 5, chave: 'fato.teste.1', alturaSobreChao: 1 }] }));
  const escondida = gerarMapa(descricao({ samambaias: [{ coluna: 5, chave: 'fato.teste.1', alturaSobreChao: 1, escondida: true }] }));
  const tileDaFrente = (mapa) => {
    const frente = mapa.layers.find((camada) => camada.name === 'frente');
    return frente.data[(mapa.height - 3 - 1) * mapa.width + 5];
  };

  assert.equal(tileDaFrente(visivel), 0);
  assert.ok(tileDaFrente(escondida) > 0);
});

test('Samambaia-prateada sobre um vão ou fora do alcance do pulo é recusada', () => {
  assert.throws(() => gerarMapa(descricao({ samambaias: [{ coluna: 10, chave: 'fato.teste.1', alturaSobreChao: 1 }] })), /samambaia/i);
  const altoDemais = PULO.segurado.altura + 2;
  assert.throws(() => gerarMapa(descricao({ samambaias: [{ coluna: 4, chave: 'fato.teste.1', alturaSobreChao: altoDemais }] })), /samambaia/i);
});

