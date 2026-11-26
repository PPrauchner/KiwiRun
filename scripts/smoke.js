/**
 * @file Smoke no navegador: abre o jogo servido localmente no Chromium (Playwright),
 * espera a Tela inicial, aperta uma tecla, confere o Menu (cursor na Pecuária, Mundos e
 * Fases em breve marcados, Esc de volta à Tela inicial), escolhe a Pecuária, espera ela
 * carregada e confere o HUD,
 * a Fase parada até o primeiro input, a coleta de um Item, as Samambaias-prateadas e a
 * Fila de Fatos, a volta ao Checkpoint, e os Predadores: Captura, contato lateral e a
 * invulnerabilidade depois de voltar, o Placar ao tocar o fim (Tempo final, Itens por tipo,
 * Capturas por espécie, Fatos e "???", sem "Próxima Fase"), o bloqueio de entrada (o pulo
 * segurado ao tocar o fim não escolhe nada no Placar, e o pulo segurado ao entrar por "Jogar
 * de novo" não faz o Kiwi pular), a Fase recomeçada do zero e Esc do Placar ao Menu. Falha
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
import { DURACAO_FATO } from '../src/logica/fila-fatos.js';
import { chaveNomeItem, chaveNomePredador } from '../src/logica/catalogo.js';
import { SEGUNDOS_INVULNERAVEL } from '../src/logica/captura.js';
import { SEGUNDOS_BLOQUEIO } from '../src/logica/input.js';

const LIMITE_MS = 15_000;
const CENA_TELA_INICIAL = 'tela-inicial';
const CENA_MENU = 'menu';
const CENA_FASE = 'fase';
const CENA_PLACAR = 'placar';
const MAPA_PECUARIA = new URL('../assets/mapas/pecuaria.tmj', import.meta.url);
/** Quanto esperar para ver se algo se mexe (ou não), em ms. */
const ESPERA_MS = 400;
/** Quanto esperar o bloqueio de entrada de uma tela nova vencer, em ms. */
const ESPERA_BLOQUEIO_MS = SEGUNDOS_BLOQUEIO * 1000 + 200;

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
 * @returns {Promise<{ textos: string[], x: number, y: number, vy: number, segundos: number,
 *   fatosEncontrados: number, capturas: number, invulneravel: number, predadores: { x: number, y: number }[] }>}
 *   O estado; `predadores` são os que ainda estão na Fase.
 */
function estadoDaFase(pagina) {
  return pagina.evaluate((cena) => {
    const fase = window.kiwirun.jogo.scene.getScene(cena);
    const textos = fase.children.list
      .filter((objeto) => objeto.type === 'BitmapText' && objeto.visible)
      .map((objeto) => objeto.text);
    const fatosEncontrados = fase.fatosEncontrados?.length ?? 0;
    const predadores = fase.predadores.getChildren()
      .filter((predador) => predador.body.enable)
      .map((predador) => ({ x: predador.x, y: predador.y }));
    return {
      textos,
      x: fase.kiwi.x,
      y: fase.kiwi.y,
      vy: fase.kiwi.body.velocity.y,
      segundos: fase.cronometro.segundos,
      fatosEncontrados,
      capturas: fase.capturas,
      invulneravel: fase.invulneravel,
      predadores,
    };
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
  if (JSON.stringify(parado.predadores) !== JSON.stringify(antes.predadores)) problemas.push('um Predador se mexeu antes do primeiro input');

  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.down('ArrowRight');
  await pagina.waitForTimeout(ESPERA_MS);
  await pagina.keyboard.up('ArrowRight');
  const andou = await estadoDaFase(pagina);
  if (andou.x <= antes.x || andou.segundos <= 0) problemas.push('mover não deu a partida na Fase e no cronômetro');
  if (andou.predadores.every((predador, i) => predador.x === antes.predadores[i].x)) problemas.push('os Predadores não patrulham depois do primeiro input');

  // Leva o Kiwi ao primeiro Item, depois ao Checkpoint, e o derruba na Zona de queda.
  const levarKiwi = (x, y) => pagina.evaluate(([cena, alvoX, alvoY]) => {
    window.kiwirun.jogo.scene.getScene(cena).kiwi.body.reset(alvoX, alvoY);
  }, [CENA_FASE, x, y]);
  await levarKiwi(itens[0].x, itens[0].y);
  await pagina.waitForTimeout(ESPERA_MS);
  if (!(await estadoDaFase(pagina)).textos.includes(`1/${itens.length}`)) problemas.push('coletar um Item não atualizou o HUD');

  // Duas Samambaias-prateadas seguidas: o segundo Fato espera o primeiro sair da tela.
  const samambaias = await objetosDaPecuaria('samambaia');
  const textos = criarTextos();
  const [fato1, fato2] = samambaias.map((samambaia) => textos.t(samambaia.type));
  if (!(await estadoDaFase(pagina)).textos.includes(`0/${samambaias.length}`)) problemas.push(`HUD sem "0/${samambaias.length}" Samambaias-prateadas`);
  await levarKiwi(samambaias[0].x, samambaias[0].y);
  await pagina.waitForTimeout(ESPERA_MS);
  const pegou = await estadoDaFase(pagina);
  if (!pegou.textos.includes(`1/${samambaias.length}`)) problemas.push('pegar uma Samambaia-prateada não atualizou o HUD');
  if (!pegou.textos.includes(fato1)) problemas.push('pegar uma Samambaia-prateada não mostrou o Fato');
  if (pegou.segundos <= andou.segundos) problemas.push('mostrar o Fato parou o cronômetro');
  await levarKiwi(samambaias[1].x, samambaias[1].y);
  await pagina.waitForTimeout(ESPERA_MS);
  const duas = await estadoDaFase(pagina);
  if (!duas.textos.includes(fato1) || duas.textos.includes(fato2)) problemas.push('o segundo Fato não esperou o primeiro sair');
  await pagina.waitForTimeout(DURACAO_FATO * 1000);
  if (!(await estadoDaFase(pagina)).textos.includes(fato2)) problemas.push('o segundo Fato não apareceu depois do primeiro');

  await levarKiwi(checkpoint.x, checkpoint.y - 9);
  await pagina.waitForTimeout(ESPERA_MS);
  await levarKiwi(checkpoint.x, 10_000);
  await pagina.waitForTimeout(ESPERA_MS);
  const voltou = await estadoDaFase(pagina);
  if (Math.abs(voltou.x - checkpoint.x) > 2 || voltou.y > checkpoint.y) {
    problemas.push(`cair não devolveu o Kiwi ao Checkpoint: ${voltou.x},${voltou.y}`);
  }
  if (!voltou.textos.includes(`1/${itens.length}`)) problemas.push('voltar ao Checkpoint perdeu os Itens coletados');
  if (!voltou.textos.includes(`2/${samambaias.length}`) || voltou.fatosEncontrados !== 2) {
    problemas.push('voltar ao Checkpoint perdeu as Samambaias-prateadas ou os Fatos encontrados');
  }
  problemas.push(...await verificarPredadores(pagina, levarKiwi, checkpoint));
  return problemas;
}

/**
 * Confere a Captura (cair sobre um Predador), a volta ao Checkpoint por contato lateral e a
 * invulnerabilidade logo depois, sem o Predador capturado voltar.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, com a Fase andando.
 * @param {(x: number, y: number) => Promise<void>} levarKiwi - Põe o Kiwi num ponto.
 * @param {{ x: number, y: number }} checkpoint - O Checkpoint ativo.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarPredadores(pagina, levarKiwi, checkpoint) {
  const problemas = [];
  const inicio = await estadoDaFase(pagina);
  const [alvo] = inicio.predadores;
  const [area] = await objetosDaPecuaria('predador');
  const nome = criarTextos().t(chaveNomePredador(area.type));

  await levarKiwi(alvo.x, alvo.y - 40);
  await pagina.waitForFunction((cena) => window.kiwirun.jogo.scene.getScene(cena).capturas > 0, CENA_FASE, { timeout: 2000 }).catch(() => {});
  const capturou = await estadoDaFase(pagina);
  if (capturou.capturas !== 1 || capturou.predadores.length !== inicio.predadores.length - 1) problemas.push('cair sobre um Predador não o capturou');
  if (capturou.vy >= 0) problemas.push('a Captura não fez o Kiwi quicar');
  if (!capturou.textos.includes(nome)) problemas.push(`a Captura não mostrou o nome da espécie "${nome}"`);

  // Espera o Kiwi assentar (fim do quique e do rótulo) e encosta de lado no próximo Predador.
  await levarKiwi(checkpoint.x, checkpoint.y - 9);
  await pagina.waitForTimeout(ESPERA_MS * 3);
  const { predadores: [proximo] } = await estadoDaFase(pagina);
  await levarKiwi(proximo.x, proximo.y);
  await pagina.waitForTimeout(ESPERA_MS / 4);
  const voltou = await estadoDaFase(pagina);
  if (Math.abs(voltou.x - checkpoint.x) > 4) problemas.push(`encostar de lado num Predador não devolveu o Kiwi ao Checkpoint: ${voltou.x}`);
  if (!(voltou.invulneravel > 0)) problemas.push('voltar ao Checkpoint não deixou o Kiwi invulnerável');
  if (voltou.predadores.length !== capturou.predadores.length || voltou.capturas !== 1) problemas.push('o Predador capturado voltou ou a Captura se perdeu');

  // Ainda invulnerável: encostar de lado atravessa sem efeito.
  const { predadores: [deNovo] } = voltou;
  await levarKiwi(deNovo.x, deNovo.y);
  await pagina.waitForTimeout(50);
  const atravessou = await estadoDaFase(pagina);
  if (Math.abs(atravessou.x - checkpoint.x) <= 4) problemas.push('invulnerável, o contato lateral ainda devolveu o Kiwi ao Checkpoint');
  await pagina.waitForTimeout(SEGUNDOS_INVULNERAVEL * 1000 + ESPERA_MS);
  if ((await estadoDaFase(pagina)).invulneravel !== 0) problemas.push('a invulnerabilidade não acabou depois de ~1 s');
  return problemas;
}

/**
 * Espera uma cena ficar ativa.
 *
 * @param {import('playwright').Page} pagina - A página do jogo.
 * @param {string} cena - A chave da cena.
 * @returns {Promise<boolean>} Se a cena ficou ativa em até 2 s.
 */
function esperarCena(pagina, cena) {
  return pagina.waitForFunction((chave) => window.kiwirun.jogo.scene.isActive(chave), cena, { timeout: 2000 })
    .then(() => true, () => false);
}

/**
 * Da Tela inicial, confere o Menu: o título, a Pecuária sob o cursor com o Recorde vazio, os
 * Mundos e Fases em breve marcados, e que Esc volta à Tela inicial. Termina no Menu.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, na Tela inicial.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarMenu(pagina) {
  const problemas = [];
  const textos = criarTextos();
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('Enter');
  if (!(await esperarCena(pagina, CENA_MENU))) return ['Enter na Tela inicial não abriu o Menu'];

  const menu = await pagina.evaluate((cena) => {
    const { menu: navegacao, children } = window.kiwirun.jogo.scene.getScene(cena);
    const visiveis = children.list.filter((objeto) => objeto.type === 'BitmapText').map((objeto) => objeto.text);
    return { mundo: navegacao.mundo.id, fase: navegacao.fase?.id, textos: visiveis };
  }, CENA_MENU);
  if (menu.mundo !== 'economia-tecnologia' || menu.fase !== 'pecuaria') problemas.push(`cursor do Menu fora da Pecuária: ${menu.mundo} › ${menu.fase}`);
  const esperados = ['menu.titulo', 'mundo.economia-tecnologia', 'mundo.geografia', 'fase.pecuaria', 'fase.porto', 'menu.sem_recorde', 'menu.voltar', 'menu.creditos']
    .map((chave) => textos.t(chave));
  esperados.push(`(${textos.t('menu.em_breve')})`);
  for (const esperado of esperados) {
    if (!menu.textos.includes(esperado)) problemas.push(`Menu sem o texto "${esperado}"`);
  }

  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('Escape');
  if (!(await esperarCena(pagina, CENA_TELA_INICIAL))) problemas.push('Esc no Menu não voltou à Tela inicial');
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('Enter');
  if (!(await esperarCena(pagina, CENA_MENU))) problemas.push('Enter na Tela inicial não reabriu o Menu');
  return problemas;
}

/**
 * Leva o Kiwi ao fim da Fase.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, com a Fase ativa.
 * @returns {Promise<void>}
 */
async function levarAoFim(pagina) {
  const [fim] = await objetosDaPecuaria('fim');
  await pagina.evaluate(([cena, x, y]) => {
    window.kiwirun.jogo.scene.getScene(cena).kiwi.body.reset(x, y);
  }, [CENA_FASE, fim.x + fim.width / 2, fim.y + fim.height / 2]);
}

/**
 * @param {import('playwright').Page} pagina - A página do jogo.
 * @returns {Promise<{ textos: string[], opcoes: string[], opcao: string }>} Os textos e as
 *   opções do Placar.
 */
function estadoDoPlacar(pagina) {
  return pagina.evaluate((cena) => {
    const placar = window.kiwirun.jogo.scene.getScene(cena);
    const textos = placar.children.list.filter((objeto) => objeto.type === 'BitmapText').map((objeto) => objeto.text);
    return { textos, opcoes: [...placar.menu.opcoes], opcao: placar.menu.opcao };
  }, CENA_PLACAR);
}

/**
 * Segura o pulo e leva o Kiwi ao fim: confere o Placar e que o pulo segurado não escolhe nada
 * nele. Soltar e apertar (segurando) "Jogar de novo" recomeça a Fase do zero sem o Kiwi pular;
 * no fim seguinte, Esc vai do Placar ao Menu.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, com a Fase andando, depois
 *   de um Item, duas Samambaias-prateadas e uma Captura.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarPlacar(pagina) {
  const problemas = [];
  const textos = criarTextos();
  const itens = await objetosDaPecuaria('item');
  const predadores = await objetosDaPecuaria('predador');
  await pagina.keyboard.down('Space');
  await levarAoFim(pagina);
  if (!(await esperarCena(pagina, CENA_PLACAR))) return ['tocar o fim não abriu o Placar'];

  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS + ESPERA_MS);
  if (!(await pagina.evaluate((cena) => window.kiwirun.jogo.scene.isActive(cena), CENA_PLACAR))) {
    return ['o pulo segurado do fim da Fase escolheu uma opção do Placar'];
  }
  const placar = await estadoDoPlacar(pagina);
  const tipoDoPrimeiro = itens[0].type;
  const totalDoTipo = itens.filter((item) => item.type === tipoDoPrimeiro).length;
  // O passeio do smoke pode pegar mais de um Item no caminho: confere só o tipo e o total.
  const nomeDoTipo = textos.t(chaveNomeItem(tipoDoPrimeiro));
  if (!placar.textos.some((texto) => texto.startsWith(`${nomeDoTipo} `) && texto.endsWith(`/${totalDoTipo}`) && !texto.startsWith(`${nomeDoTipo} 0/`))) {
    problemas.push(`Placar sem "${nomeDoTipo} N/${totalDoTipo}" com o Item coletado`);
  }
  const esperados = [
    'placar.titulo', 'placar.tempo_gasto', 'placar.desconto_itens', 'placar.desconto_capturas',
    'placar.desconto_samambaias', 'placar.tempo_final', 'placar.fatos', 'placar.fato_faltando', 'placar.convite',
    'placar.jogar_de_novo', 'placar.menu',
  ].map((chave) => textos.t(chave));
  esperados.push(textos.t('placar.capturas_especie', { nome: textos.t(chaveNomePredador(predadores[0].type)), quantidade: '1' }));
  for (const esperado of esperados) {
    if (!placar.textos.includes(esperado)) problemas.push(`Placar sem o texto "${esperado}"`);
  }
  if (!placar.textos.some((texto) => /^0:\d\d,\d$/.test(texto))) problemas.push('Placar sem tempo com vírgula decimal em PT');
  if (placar.opcoes.includes('proxima')) problemas.push('Placar oferece "Próxima Fase" com o Porto em breve');
  if (placar.opcao !== 'jogar_de_novo') problemas.push(`Placar abriu com o cursor em "${placar.opcao}"`);

  // Jogar de novo, com o pulo segurado ao entrar na Fase.
  await pagina.keyboard.up('Space');
  await pagina.waitForTimeout(ESPERA_MS / 4);
  await pagina.keyboard.down('Space');
  if (!(await esperarCena(pagina, CENA_FASE))) return [...problemas, '"Jogar de novo" não reabriu a Fase'];
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS + ESPERA_MS);
  const deNovo = await estadoDaFase(pagina);
  await pagina.keyboard.up('Space');
  if (deNovo.segundos !== 0 || deNovo.vy !== 0) problemas.push('o pulo segurado do Placar fez o Kiwi pular na Fase');
  if (deNovo.capturas !== 0 || deNovo.fatosEncontrados !== 0 || deNovo.predadores.length !== predadores.length) {
    problemas.push('"Jogar de novo" não recomeçou a Fase do zero');
  }
  if (!deNovo.textos.includes(`0/${itens.length}`)) problemas.push('"Jogar de novo" não zerou os Itens');

  // A Fase fica parada até o primeiro mover: anda um pouco antes de ir ao fim.
  await pagina.keyboard.down('ArrowRight');
  await pagina.waitForTimeout(ESPERA_MS / 4);
  await pagina.keyboard.up('ArrowRight');
  await levarAoFim(pagina);
  if (!(await esperarCena(pagina, CENA_PLACAR))) return [...problemas, 'tocar o fim de novo não abriu o Placar'];
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('Escape');
  if (!(await esperarCena(pagina, CENA_MENU))) problemas.push('Esc no Placar não foi ao Menu');
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
    problemas.push(...await verificarMenu(pagina));
    await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
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
    problemas.push(...await verificarPlacar(pagina));
  } catch (erro) {
    problemas.push(`Pecuária não carregou pelo Menu: ${erro.message}`);
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
console.log('Smoke ok: Tela inicial, Menu e Pecuária abertos, HUD, Itens, Samambaias-prateadas, Fatos, Checkpoint, Predadores, Placar e bloqueio de entrada funcionando, sem erro no console nem requisição fora da origem.');
