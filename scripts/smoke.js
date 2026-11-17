/**
 * @file Smoke no navegador: abre o jogo servido localmente no Chromium (Playwright),
 * espera a Tela inicial, aperta uma tecla, espera a Pecuária carregada e falha se houver
 * erro no console ou requisição fora da origem.
 *
 * Uso: `npm run smoke`. Sai com código 1 e a lista de problemas quando algo falha.
 */
import { chromium } from 'playwright';
import { iniciarServidor } from './servidor.js';
import { criarTextos } from '../src/logica/textos.js';
import { VERSAO } from '../src/logica/versao.js';

const LIMITE_MS = 15_000;
const CENA_TELA_INICIAL = 'tela-inicial';
const CENA_FASE = 'fase';

/**
 * Abre o jogo e devolve o que deu errado.
 *
 * @param {string} url - Endereço do jogo servido localmente.
 * @returns {Promise<string[]>} Os problemas encontrados; vazio se tudo passou.
 */
async function verificarJogo(url) {
  const problemas = [];
  const origem = new URL(url).origin;
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 720 } });

  try {
    pagina.on('console', (mensagem) => {
      if (mensagem.type() === 'error') problemas.push(`erro no console: ${mensagem.text()}`);
    });
    pagina.on('pageerror', (erro) => problemas.push(`exceção na página: ${erro.message}`));
    pagina.on('request', (requisicao) => {
      const alvo = new URL(requisicao.url());
      if (/^https?:$/.test(alvo.protocol) && alvo.origin !== origem) {
        problemas.push(`requisição fora da origem: ${requisicao.url()}`);
      }
    });

    await pagina.goto(url);
    await pagina.waitForFunction(
      (cena) => window.kiwirun?.jogo?.scene.isActive(cena),
      CENA_TELA_INICIAL,
      { timeout: LIMITE_MS },
    );

    const tela = await pagina.evaluate((cena) => {
      const { jogo } = window.kiwirun;
      const textos = jogo.scene.getScene(cena).children.list
        .filter((objeto) => objeto.type === 'BitmapText')
        .map((objeto) => objeto.text);
      return { largura: jogo.config.width, altura: jogo.config.height, textos };
    }, CENA_TELA_INICIAL);

    if (tela.largura !== 640 || tela.altura !== 360) {
      problemas.push(`resolução interna ${tela.largura}×${tela.altura}, esperada 640×360`);
    }
    const textos = criarTextos();
    const esperados = [
      textos.t('tela_inicial.aperte'),
      textos.t('tela_inicial.saudacao'),
      textos.t('tela_inicial.versao', { versao: VERSAO }),
    ];
    for (const esperado of esperados) {
      if (!tela.textos.includes(esperado)) problemas.push(`Tela inicial sem o texto "${esperado}"`);
    }
  } catch (erro) {
    problemas.push(`Tela inicial não abriu: ${erro.message}`);
    await navegador.close();
    return problemas;
  }

  try {
    await pagina.keyboard.press('Enter');
    await pagina.waitForFunction(
      (cena) => window.kiwirun.jogo.scene.getScene(cena)?.kiwi?.active === true,
      CENA_FASE,
      { timeout: LIMITE_MS },
    );
    const fase = await pagina.evaluate((cena) => {
      const { fase: dados, kiwi } = window.kiwirun.jogo.scene.getScene(cena);
      return { id: dados.id, temKiwi: Boolean(kiwi.body) };
    }, CENA_FASE);
    if (fase.id !== 'pecuaria' || !fase.temKiwi) problemas.push(`Fase aberta: ${JSON.stringify(fase)}`);
  } catch (erro) {
    problemas.push(`Pecuária não carregou depois de apertar uma tecla: ${erro.message}`);
  } finally {
    await navegador.close();
  }
  return problemas;
}

const servidor = await iniciarServidor();
const problemas = await verificarJogo(servidor.url);
await servidor.fechar();

if (problemas.length > 0) {
  console.error(`Smoke falhou:\n- ${problemas.join('\n- ')}`);
  process.exit(1);
}
console.log('Smoke ok: Tela inicial e Pecuária abertas, sem erro no console nem requisição fora da origem.');
