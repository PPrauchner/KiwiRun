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
import { FISICA, PULO, TILE } from '../src/logica/pulo.js';
import { PREDADORES, buscarFase } from '../src/logica/catalogo.js';
import { NOME, TILESET_PORTO } from '../scripts/tileset.js';

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

test('a Pecuária versionada tem uma Samambaia-prateada escondida atrás da camada frente', async () => {
  const mapa = JSON.parse(await readFile(new URL('../assets/mapas/pecuaria.tmj', import.meta.url), 'utf8'));
  const frente = mapa.layers.find((camada) => camada.name === 'frente');
  const atrasDaFrente = objetosChamados(mapa, 'samambaia')
    .filter(({ x, y }) => frente.data[Math.floor(y / TILE) * mapa.width + Math.floor(x / TILE)] > 0);

  assert.equal(atrasDaFrente.length, 1);
});

test('cada Predador vira uma área "predador" com a espécie no tipo, um tile acima do chão entre as colunas da patrulha', () => {
  const mapa = gerarMapa(descricao({ predadores: [{ especie: 'rato', de: 3, ate: 7 }] }));
  const [predador] = objetosChamados(mapa, 'predador');

  assert.deepEqual(
    { type: predador.type, x: predador.x, y: predador.y, width: predador.width, height: predador.height },
    { type: 'rato', x: 3 * TILE, y: (mapa.height - 3 - 1) * TILE, width: 5 * TILE, height: TILE },
  );
});

test('patrulha de Predador sobre um vão ou um degrau é recusada', () => {
  assert.throws(() => gerarMapa(descricao({ predadores: [{ especie: 'rato', de: 8, ate: 13 }] })), /predador/i);
  const comDegrau = descricao({ trechos: [{ chao: 5, altura: 3 }, { chao: 5, altura: 4 }] });
  assert.throws(() => gerarMapa({ ...comDegrau, predadores: [{ especie: 'rato', de: 2, ate: 7 }] }), /predador/i);
});

test('a Pecuária versionada tem Predadores das três espécies do catálogo', async () => {
  const mapa = JSON.parse(await readFile(new URL('../assets/mapas/pecuaria.tmj', import.meta.url), 'utf8'));
  const especies = objetosChamados(mapa, 'predador').map((objeto) => objeto.type);

  assert.deepEqual([...new Set(especies)].sort(), [...PREDADORES].sort());
});

test('cada Ovelha vira uma área "ovelha" um tile acima do chão entre as colunas do trajeto', () => {
  const mapa = gerarMapa(descricao({ ovelhas: [{ de: 2, ate: 6 }] }));
  const [ovelha] = objetosChamados(mapa, 'ovelha');

  assert.deepEqual(
    { x: ovelha.x, y: ovelha.y, width: ovelha.width, height: ovelha.height },
    { x: 2 * TILE, y: (mapa.height - 3 - 1) * TILE, width: 5 * TILE, height: TILE },
  );
});

test('trajeto de Ovelha sobre um vão ou um degrau é recusado', () => {
  assert.throws(() => gerarMapa(descricao({ ovelhas: [{ de: 8, ate: 13 }] })), /ovelha/i);
  const comDegrau = descricao({ trechos: [{ chao: 5, altura: 3 }, { chao: 5, altura: 4 }] });
  assert.throws(() => gerarMapa({ ...comDegrau, ovelhas: [{ de: 1, ate: 7 }] }), /ovelha/i);
});

test('trajeto de Ovelha com algo sólido onde o Kiwi fica em cima dela é recusado: sem vão de esmagamento', () => {
  const plataformaBaixa = [{ coluna: 4, largura: 2, alturaSobreChao: 2 }];
  assert.throws(() => gerarMapa(descricao({ plataformas: plataformaBaixa, ovelhas: [{ de: 2, ate: 6 }] })), /esmag/);
  const paredeAoLado = descricao({ trechos: [{ chao: 5, altura: 3 }, { chao: 5, altura: 5 }] });
  assert.throws(() => gerarMapa({ ...paredeAoLado, ovelhas: [{ de: 1, ate: 4 }] }), /esmag/);
  const plataformaAlta = [{ coluna: 4, largura: 2, alturaSobreChao: 3 }];
  assert.doesNotThrow(() => gerarMapa(descricao({ plataformas: plataformaAlta, ovelhas: [{ de: 2, ate: 6 }] })));
});

test('cada Placa vira um ponto "placa" no chão, com a chave do texto no tipo e a ação na propriedade, sobre um tile de placa', () => {
  const mapa = gerarMapa(descricao({ placas: [{ coluna: 4, chave: 'placa.teste', acao: 'pular' }] }));
  const [placa] = objetosChamados(mapa, 'placa');
  const fundo = mapa.layers.find((camada) => camada.name === 'fundo');
  const topoDoChao = mapa.height - 3;

  assert.deepEqual(
    { type: placa.type, x: placa.x, y: placa.y, point: placa.point, properties: placa.properties },
    { type: 'placa.teste', x: 4.5 * TILE, y: topoDoChao * TILE, point: true, properties: [{ name: 'acao', type: 'string', value: 'pular' }] },
  );
  assert.ok(fundo.data[(topoDoChao - 1) * mapa.width + 4] > 0);
});

test('Placa sobre um vão é recusada', () => {
  assert.throws(() => gerarMapa(descricao({ placas: [{ coluna: 10, chave: 'placa.teste', acao: 'pular' }] })), /placa/);
});

test('a Pecuária versionada ensina no início: a Placa de capturar antes de um Predador sozinho em chão plano, e a de pular mais alto', async () => {
  const mapa = JSON.parse(await readFile(new URL('../assets/mapas/pecuaria.tmj', import.meta.url), 'utf8'));
  const placas = objetosChamados(mapa, 'placa');
  const [primeiro, ...outros] = objetosChamados(mapa, 'predador').sort((a, b) => a.x - b.x);
  const capturar = placas.find((placa) => placa.type === 'placa.capturar');
  const [inicio] = objetosChamados(mapa, 'inicio');

  assert.deepEqual(placas.map((placa) => placa.type).sort(), ['placa.capturar', 'placa.pular_alto']);
  for (const placa of placas) assert.ok(placa.x > inicio.x && placa.x < 20 * TILE, `${placa.type} fora do início`);
  assert.ok(capturar.x < primeiro.x, 'a Placa de capturar vem antes do Predador');
  assert.ok(outros.every((predador) => predador.x > primeiro.x + primeiro.width + 10 * TILE), 'o primeiro Predador não está sozinho');
});

test('a Pecuária versionada tem Ovelhas e Checkpoints a no máximo ~20 s de percurso entre si', async () => {
  const mapa = JSON.parse(await readFile(new URL('../assets/mapas/pecuaria.tmj', import.meta.url), 'utf8'));
  const marcos = [...objetosChamados(mapa, 'inicio'), ...objetosChamados(mapa, 'checkpoint'), ...objetosChamados(mapa, 'fim')]
    .map((objeto) => objeto.x).sort((a, b) => a - b);
  // Andar é o mínimo; o percurso real (pulos, voltas) leva bem mais, daí a folga de 4×.
  const maiorDistancia = (20 / 4) * FISICA.velocidadeAndar;

  assert.ok(objetosChamados(mapa, 'ovelha').length > 0);
  marcos.slice(1).forEach((x, i) => assert.ok(x - marcos[i] <= maiorDistancia, `${marcos[i]} → ${x}`));
});

/** O gid na camada `nome` do mapa, na coluna e na linha dadas. */
function gidEm(mapa, nome, coluna, linha) {
  return mapa.layers.find((camada) => camada.name === nome).data[linha * mapa.width + coluna];
}

/** O tileset do mapa a que um gid pertence: o de maior `firstgid` que não passa dele. */
function tilesetDoGid(mapa, gid) {
  return mapa.tilesets.filter((tileset) => tileset.firstgid <= gid).sort((a, b) => b.firstgid - a.firstgid)[0];
}

test('sem piso de cais, o mapa só embute o tileset Kenney', () => {
  assert.deepEqual(gerarMapa(descricao()).tilesets.map((tileset) => tileset.name), [NOME]);
});

test('o piso de cais pinta o chão com o concreto do tileset do Porto, embutido depois do Kenney', () => {
  const mapa = gerarMapa(descricao({ piso: 'cais' }));
  const topoDoChao = mapa.height - 3;
  const [kenney, porto] = mapa.tilesets;

  assert.deepEqual(mapa.tilesets.map((tileset) => tileset.name), [NOME, TILESET_PORTO.nome]);
  assert.equal(porto.firstgid, kenney.firstgid + kenney.tilecount);
  assert.equal(porto.source, undefined);
  for (const linha of [topoDoChao, topoDoChao + 1]) {
    assert.equal(tilesetDoGid(mapa, gidEm(mapa, 'colisao', 4, linha)).name, TILESET_PORTO.nome);
  }
});

test('no cais, o vão mostra o mar no fundo, sem nada sólido', () => {
  const mapa = gerarMapa(descricao({ piso: 'cais' }));

  assert.ok(gidEm(mapa, 'fundo', 10, mapa.height - 1) > 0);
  assert.equal(gidEm(mapa, 'colisao', 10, mapa.height - 1), 0);
});

test('a pilha de contêineres é sólida sobre o chão, da altura e largura pedidas, no tileset do Porto', () => {
  const mapa = gerarMapa(descricao({ piso: 'cais', conteineres: [{ coluna: 3, largura: 2, altura: 3 }] }));
  const topoDoChao = mapa.height - 3;

  for (const coluna of [3, 4]) {
    for (let linha = topoDoChao - 3; linha < topoDoChao; linha += 1) {
      assert.equal(tilesetDoGid(mapa, gidEm(mapa, 'colisao', coluna, linha)).name, TILESET_PORTO.nome, `${coluna},${linha}`);
    }
    assert.equal(gidEm(mapa, 'colisao', coluna, topoDoChao - 4), 0);
  }
  assert.equal(gidEm(mapa, 'colisao', 5, topoDoChao - 1), 0);
});

test('pilha de contêineres mais alta que o pulo, ou sobre um vão, é recusada', () => {
  assert.throws(() => gerarMapa(descricao({ conteineres: [{ coluna: 3, largura: 2, altura: PULO.segurado.altura + 1 }] })), /contêiner/);
  assert.throws(() => gerarMapa(descricao({ conteineres: [{ coluna: 9, largura: 2, altura: 1 }] })), /contêiner/);
});

test('cada esteira vira uma área "esteira" no tile de cima do chão, com o sentido na propriedade', () => {
  const mapa = gerarMapa(descricao({ esteiras: [{ de: 3, ate: 7, sentido: -1 }] }));
  const [esteira] = objetosChamados(mapa, 'esteira');

  assert.deepEqual(
    { x: esteira.x, y: esteira.y, width: esteira.width, height: esteira.height, properties: esteira.properties },
    { x: 3 * TILE, y: (mapa.height - 3) * TILE, width: 5 * TILE, height: TILE, properties: [{ name: 'sentido', type: 'int', value: -1 }] },
  );
});

test('esteira sobre um vão, ou com sentido que não é 1 nem -1, é recusada', () => {
  assert.throws(() => gerarMapa(descricao({ esteiras: [{ de: 8, ate: 13, sentido: 1 }] })), /esteira/);
  assert.throws(() => gerarMapa(descricao({ esteiras: [{ de: 2, ate: 6, sentido: 0 }] })), /esteira/);
});
