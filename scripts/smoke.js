/**
 * @file Smoke no navegador: abre o jogo servido localmente no Chromium (Playwright),
 * espera a Tela inicial, aperta uma tecla, espera a Pecuária carregada e confere o HUD,
 * a Fase parada até o primeiro input, a coleta de um Item e a volta ao Checkpoint. Falha
 * também se houver erro no console ou requisição fora da origem.
 *
 * Uso: `npm run smoke`. Sai com código 1 e a lista de problemas quando algo falha.
 */
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { iniciarServidor } from './servidor.js';
import { criarTextos } from '../src/logica/textos.js';
import { VERSAO } from '../src/logica/versao.js';
import { formatarTempo } from '../src/logica/cronometro.js';

const LIMITE_MS = 15_000;
const CENA_TELA_INICIAL = 'tela-inicial';
const CENA_FASE = 'fase';
const MAPA_PECUARIA = new URL('../assets/mapas/pecuaria.tmj', import.meta.url);
/** Quanto esperar para ver se algo se mexe (ou não), em ms. */
const ESPERA_MS = 400;

/**
 * Os objetos da camada `objetos` do mapa da Pecuária com esse nome.
 *
 * @param {string} nome - `item` ou `checkpoint`.
 * @returns {Promise<{ x: number, y: number }[]>} Os objetos.
 */
async function objetosDaPecuaria(nome) {
  const mapa = JSON.parse(await readFile(MAPA_PECUARIA, 'utf8'));
  return mapa.layers.find((camada) => camada.name === 'objetos').objects.filter((objeto) => objeto.name === nome);
}

/**
 * Lê da cena Fase o que o smoke confere: textos do HUD, posição do Kiwi e o cronômetro.
 *
 * @param {import('playwright').Page} pagina - A página do jogo.
 * @returns {Promise<{ textos: string[], x: number, y: number, segundos: number }>} O estado.
 */
function estadoDaFase(pagina) {
  return pagina.evaluate((cena) => {
    const fase = window.kiwirun.jogo.scene.getScene(cena);
    const textos = fase.children.list.filter((objeto) => objeto.type === 'BitmapText').map((objeto) => objeto.text);
    return { textos, x: fase.kiwi.x, y: fase.kiwi.y, segundos: fase.cronometro.segundos };
  }, CENA_FASE);
}

/**
 * Confere, na Pecuária aberta, o HUD, o congelamento antes do primeiro input, a coleta e o
 * Checkpoint.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, com a Fase ativa.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarItensECheckpoints(pagina) {
  const problemas = [];
  const itens = await objetosDaPecuaria('item');
  const [checkpoint] = await objetosDaPecuaria('checkpoint');

  const antes = await estadoDaFase(pagina);
  await pagina.waitForTimeout(ESPERA_MS);
  const parado = await estadoDaFase(pagina);
  if (!parado.textos.includes(formatarTempo(0))) problemas.push(`HUD sem o tempo zerado: ${parado.textos}`);
  if (!parado.textos.includes(`0/${itens.length}`)) problemas.push(`HUD sem "0/${itens.length}": ${parado.textos}`);
  if (parado.y !== antes.y || parado.segundos !== 0) problemas.push('a Fase se mexeu antes do primeiro input');

  await pagina.keyboard.down('ArrowRight');
  await pagina.waitForTimeout(ESPERA_MS);
  await pagina.keyboard.up('ArrowRight');
  const andou = await estadoDaFase(pagina);
  if (andou.x <= antes.x || andou.segundos <= 0) problemas.push('mover não deu a partida na Fase e no cronômetro');

  // Leva o Kiwi ao primeiro Item, depois ao Checkpoint, e o derruba na Zona de queda.
  const levarKiwi = (x, y) => pagina.evaluate(([cena, alvoX, alvoY]) => {
    window.kiwirun.jogo.scene.getScene(cena).kiwi.body.reset(alvoX, alvoY);
  }, [CENA_FASE, x, y]);
  await levarKiwi(itens[0].x, itens[0].y);
  await pagina.waitForTimeout(ESPERA_MS);
  if (!(await estadoDaFase(pagina)).textos.includes(`1/${itens.length}`)) problemas.push('coletar um Item não atualizou o HUD');

  await levarKiwi(checkpoint.x, checkpoint.y - 9);
  await pagina.waitForTimeout(ESPERA_MS);
  await levarKiwi(checkpoint.x, 10_000);
  await pagina.waitForTimeout(ESPERA_MS);
  const voltou = await estadoDaFase(pagina);
  if (Math.abs(voltou.x - checkpoint.x) > 2 || voltou.y > checkpoint.y) {
    problemas.push(`cair não devolveu o Kiwi ao Checkpoint: ${voltou.x},${voltou.y}`);
  }
  if (!voltou.textos.includes(`1/${itens.length}`)) problemas.push('voltar ao Checkpoint perdeu os Itens coletados');
  return problemas;
}

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
    problemas.push(...await verificarItensECheckpoints(pagina));
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
console.log('Smoke ok: Tela inicial e Pecuária abertas, HUD, Itens e Checkpoint funcionando, sem erro no console nem requisição fora da origem.');
