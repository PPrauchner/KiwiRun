/**
 * @file Servidor estático mínimo do repositório, para o smoke (e para jogar localmente em dev).
 *
 * Uso direto: `node scripts/servidor.js [porta]` serve a raiz do repositório.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ_REPO = fileURLToPath(new URL('..', import.meta.url));

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.tmj': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

/**
 * @typedef {Object} Servidor
 * @property {string} url - Endereço base, como `http://localhost:1234/`.
 * @property {() => Promise<void>} fechar - Encerra o servidor.
 */

/**
 * Sobe um servidor estático sobre uma pasta.
 *
 * @param {string} [raiz] - Pasta servida; o padrão é a raiz do repositório.
 * @param {number} [porta] - Porta; 0 escolhe uma livre.
 * @returns {Promise<Servidor>} O servidor no ar.
 */
export function iniciarServidor(raiz = RAIZ_REPO, porta = 0) {
  const servidor = createServer(async (pedido, resposta) => {
    const caminho = decodeURIComponent(new URL(pedido.url, 'http://localhost').pathname);
    const arquivo = normalize(join(raiz, caminho.endsWith('/') ? `${caminho}index.html` : caminho));

    if (!arquivo.startsWith(normalize(raiz + sep))) {
      resposta.writeHead(403).end();
      return;
    }
    try {
      const conteudo = await readFile(arquivo);
      const tipo = TIPOS[extname(arquivo)] ?? 'application/octet-stream';
      resposta.writeHead(200, { 'Content-Type': tipo }).end(conteudo);
    } catch {
      resposta.writeHead(404).end();
    }
  });

  return new Promise((resolver) => {
    servidor.listen(porta, 'localhost', () => {
      resolver({
        url: `http://localhost:${servidor.address().port}/`,
        fechar: () => new Promise((pronto) => servidor.close(() => pronto())),
      });
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { url } = await iniciarServidor(RAIZ_REPO, Number(process.argv[2] ?? 8080));
  console.log(`KiwiRun em ${url}`);
}
