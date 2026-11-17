/**
 * @file O lançador do evento (`jogar.bat`): servidor estático em PowerShell e o
 * script que o sobe, detecta a porta ocupada e abre o navegador.
 *
 * Só roda no Windows, onde o lançador existe; nos outros sistemas fica pulado.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SO_WINDOWS = { skip: process.platform !== 'win32' && 'o lançador só existe no Windows' };
const RAIZ_REPO = fileURLToPath(new URL('..', import.meta.url));
const SERVIDOR_PS1 = join(RAIZ_REPO, 'scripts', 'servidor.ps1');
const LANCADOR_PS1 = join(RAIZ_REPO, 'scripts', 'lancador.ps1');
const LIMITE_MS = 15_000;

/** O tipo MIME que cada extensão de arquivo do jogo deve receber. */
const MIME_ESPERADO = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.tmj': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Acha uma porta TCP livre agora.
 *
 * @returns {Promise<number>} A porta.
 */
function portaLivre() {
  return new Promise((resolver) => {
    const sonda = createServer().listen(0, 'localhost', () => {
      const { port } = sonda.address();
      sonda.close(() => resolver(port));
    });
  });
}

/**
 * Roda um script PowerShell até o fim.
 *
 * @param {string} script - Caminho do `.ps1`.
 * @param {string[]} args - Argumentos do script.
 * @returns {Promise<{codigo: number, saida: string}>} Código de saída e stdout+stderr.
 */
function rodarPs1(script, args) {
  return new Promise((resolver) => {
    const filho = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, ...args]);
    let saida = '';
    filho.stdout.on('data', (pedaco) => { saida += pedaco; });
    filho.stderr.on('data', (pedaco) => { saida += pedaco; });
    filho.on('close', (codigo) => resolver({ codigo, saida }));
  });
}

/**
 * Espera um endereço responder.
 *
 * @param {string} url - O endereço.
 * @returns {Promise<void>}
 */
async function esperarNoAr(url) {
  const fim = Date.now() + LIMITE_MS;
  while (Date.now() < fim) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((pronto) => setTimeout(pronto, 150));
    }
  }
  throw new Error(`${url} não respondeu em ${LIMITE_MS} ms`);
}

/**
 * Sobe o `servidor.ps1` como processo filho (sem janela).
 *
 * @param {string} raiz - Pasta servida.
 * @param {number} porta - Porta.
 * @returns {Promise<{url: string, fechar: () => void}>} O servidor no ar.
 */
async function subirServidorPs1(raiz, porta) {
  const filho = spawn('powershell.exe', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', SERVIDOR_PS1, '-Raiz', raiz, '-Porta', String(porta),
  ], { stdio: 'ignore' });
  const url = `http://localhost:${porta}/`;
  await esperarNoAr(url);
  return { url, fechar: () => filho.kill() };
}

/**
 * Lista, recursivamente, os arquivos de uma pasta.
 *
 * @param {string} pasta - Caminho absoluto.
 * @returns {Promise<string[]>} Caminhos absolutos dos arquivos.
 */
async function arquivosEm(pasta) {
  const entradas = await readdir(pasta, { withFileTypes: true, recursive: true });
  return entradas.filter((entrada) => entrada.isFile()).map((entrada) => join(entrada.parentPath, entrada.name));
}

test('o servidor entrega cada tipo de arquivo do jogo com o MIME certo', SO_WINDOWS, async () => {
  const raiz = await mkdtemp(join(tmpdir(), 'kiwirun-mime-'));
  for (const extensao of Object.keys(MIME_ESPERADO)) {
    await writeFile(join(raiz, `amostra${extensao}`), 'x');
  }
  const servidor = await subirServidorPs1(raiz, await portaLivre());
  try {
    for (const [extensao, mime] of Object.entries(MIME_ESPERADO)) {
      const resposta = await fetch(`${servidor.url}amostra${extensao}`);
      assert.equal(resposta.status, 200, extensao);
      assert.equal(resposta.headers.get('content-type'), mime, extensao);
    }
  } finally {
    servidor.fechar();
    await rm(raiz, { recursive: true, force: true });
  }
});

test('toda extensão de arquivo que o jogo carrega tem MIME definido', async () => {
  const arquivos = [
    join(RAIZ_REPO, 'index.html'),
    ...(await arquivosEm(join(RAIZ_REPO, 'src'))),
    ...(await arquivosEm(join(RAIZ_REPO, 'assets'))),
    join(RAIZ_REPO, 'vendor', 'phaser', 'phaser.min.js'),
  ];
  const semMime = arquivos.filter((arquivo) => !(extname(arquivo) in MIME_ESPERADO));

  assert.deepEqual(semMime, []);
});

test('o servidor entrega o index.html na raiz e responde 404 ao que não existe', SO_WINDOWS, async () => {
  const servidor = await subirServidorPs1(RAIZ_REPO, await portaLivre());
  try {
    const raiz = await fetch(servidor.url);
    assert.equal(raiz.status, 200);
    assert.equal(raiz.headers.get('content-type'), MIME_ESPERADO['.html']);
    assert.match(await raiz.text(), /<html/i);

    const inexistente = await fetch(`${servidor.url}nao-existe.png`);
    assert.equal(inexistente.status, 404);
  } finally {
    servidor.fechar();
  }
});

test('o lançador com outro programa na porta avisa com clareza e encerra com erro', SO_WINDOWS, async () => {
  const porta = await portaLivre();
  const outro = createServer((_, resposta) => resposta.end('outro')).listen(porta, 'localhost');
  try {
    const { codigo, saida } = await rodarPs1(LANCADOR_PS1, ['-Porta', String(porta), '-SemNavegador']);

    assert.equal(codigo, 1);
    assert.match(saida, new RegExp(`porta ${porta}.*outro programa`, 'i'));
  } finally {
    await new Promise((pronto) => outro.close(pronto));
  }
});

test('o lançador com o KiwiRun já no ar não sobe outro servidor, só reabre o navegador', SO_WINDOWS, async () => {
  const servidor = await subirServidorPs1(RAIZ_REPO, await portaLivre());
  try {
    const porta = new URL(servidor.url).port;
    const { codigo, saida } = await rodarPs1(LANCADOR_PS1, ['-Porta', porta, '-SemNavegador']);

    assert.equal(codigo, 0, saida);
    assert.match(saida, /já está no ar/i);
    assert.doesNotMatch(saida, /servidor iniciado/i);
  } finally {
    servidor.fechar();
  }
});

test('o lançador com a porta livre sobe o servidor numa janela própria', SO_WINDOWS, async () => {
  const porta = await portaLivre();
  const { codigo, saida } = await rodarPs1(LANCADOR_PS1, ['-Porta', String(porta), '-SemNavegador']);
  const pid = Number(saida.match(/servidor iniciado \(PID (\d+)\)/i)?.[1]);
  try {
    assert.equal(codigo, 0, saida);
    assert.ok(pid, saida);

    const resposta = await fetch(`http://localhost:${porta}/`);
    assert.equal(resposta.status, 200);
  } finally {
    if (pid) process.kill(pid);
  }
});
