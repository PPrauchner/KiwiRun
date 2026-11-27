/**
 * @file Smoke no navegador: abre o jogo servido localmente no Chromium (Playwright),
 * espera a Tela inicial, troca o idioma para EN (o Menu sai em inglês, nada vai ao
 * `localStorage` e recarregar volta ao PT), aperta uma tecla, confere o Menu (cursor na Pecuária, Mundos e
 * Fases em breve marcados, Esc de volta à Tela inicial), os Créditos (abertos pelo Menu, com
 * o grupo, os pacotes Kenney, o Phaser e as fontes dos Fatos por Fase, M silenciando, Esc e
 * "Voltar" de volta ao Menu), escolhe a Pecuária, espera ela
 * carregada e confere o HUD,
 * a Fase parada até o primeiro input, a coleta de um Item, as Samambaias-prateadas e a
 * Fila de Fatos, a volta ao Checkpoint, e os Predadores: Captura, o pulinho do arminho, contato lateral e a
 * invulnerabilidade depois de voltar, as Placas no idioma atual e as Ovelhas (paradas até o
 * primeiro input, atravessadas de lado, levando o Kiwi montado e devolvendo-o ao Checkpoint
 * quando ele fica prensado), as Iniciais do primeiro Recorde (o pulo segurado não
 * confirma, digitar letras sem mover o cursor, Esc volta uma letra), o Placar com "Novo
 * Recorde" (Tempo final, Itens por tipo, Capturas por espécie, Fatos e "???", com "Próxima
 * Fase"), o bloqueio de entrada (o pulo segurado ao tocar o fim não escolhe nada no Placar,
 * e o pulo segurado ao entrar por "Jogar de novo" não faz o Kiwi pular), a Fase recomeçada
 * do zero, Esc do Placar ao Menu, o Recorde no Menu antes e depois de recarregar a página, e
 * Shift+Backspace por 3 s na Tela inicial zerando os Recordes, e a Pausa: Esc antes do primeiro
 * input não dá a partida, Esc congela o cronômetro e o Fato, "Controles" em PT, perder o foco
 * e desconectar o controle abrem a Pausa, "Reiniciar a Fase" com o pulo segurado recomeça do
 * zero sem o Kiwi pular, e "Menu" sai para o Menu; e a Volta por inatividade, com os tempos
 * encurtados: aviso e Volta no Menu (em EN, volta em PT), na Fase, na Pausa e no Placar, "---"
 * nas Iniciais e nenhum aviso na Tela inicial; os efeitos sonoros de pular, coletar, capturar e
 * achar uma Samambaia-prateada; e o Silêncio: M e Select com o ícone, persistindo ao recarregar
 * e na Volta, sem descongelar a Fase nem a Pausa, e M digitando nas Iniciais; a música: sem
 * reiniciar entre Tela inicial, Menu, Créditos e Placar, trocando de andamento na Pecuária e
 * cortada pelo Silêncio; e o aviso de toque:
 * ausente no desktop, presente com toque emulado (com o link do Pages, sem Wake Lock no
 * navegador, e qualquer tecla abrindo o Menu), com a Wake Lock pedida ao abrir; e o Porto, escolhido
 * no Menu: guindastes e esteiras parados até o primeiro input, as esteiras empurrando o Kiwi no
 * sentido marcado, o guindaste levando-o montado e devolvendo-o ao Checkpoint quando ele fica
 * prensado, e o fim abrindo o Placar. Falha também se houver erro no console ou
 * requisição fora da origem.
 *
 * Uso: `npm run smoke`. Sai com código 1 e a lista de problemas quando algo falha.
 */
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { iniciarServidor } from './servidor.js';
import { criarTextos } from '../src/logica/textos.js';
import { VERSAO } from '../src/logica/versao.js';
import { DURACAO_FATO } from '../src/logica/fila-fatos.js';
import { buscarFase, chaveNomeItem, chaveNomePredador, COMPORTAMENTO_PREDADOR, MUNDOS } from '../src/logica/catalogo.js';
import { SEGUNDOS_INVULNERAVEL } from '../src/logica/captura.js';
import { SEGUNDOS_PRESO } from '../src/logica/ovelha.js';
import { SEGUNDOS_BLOQUEIO } from '../src/logica/input.js';
import { arredondarDecimos, SEGUNDOS_ZERAR, textoRecorde } from '../src/logica/recorde.js';
import { chaveOpcaoPausa, LINHAS_CONTROLES } from '../src/logica/menu-pausa.js';
import { chaveEfeito } from '../src/logica/efeitos.js';
import { ANDAMENTO_BASE, andamentoDaFase, chaveMusica } from '../src/logica/musica.js';
import { CHAVES_TELA_CREDITOS, fontesPorFase, SECOES_CREDITOS } from '../src/logica/creditos.js';

const LIMITE_MS = 15_000;
const CENA_TELA_INICIAL = 'tela-inicial';
const CENA_MENU = 'menu';
const CENA_CREDITOS = 'creditos';
const CENA_FASE = 'fase';
const CENA_PLACAR = 'placar';
const CENA_INICIAIS = 'iniciais';
const CENA_PAUSA = 'pausa';
const FASE_PECUARIA = 'pecuaria';
const MAPA_PECUARIA = new URL('../assets/mapas/pecuaria.tmj', import.meta.url);
const FASE_PORTO = 'porto';
const MAPA_PORTO = new URL('../assets/mapas/porto.tmj', import.meta.url);
/** Quanto esperar para ver se algo se mexe (ou não), em ms. */
const ESPERA_MS = 400;
/** Quanto esperar o bloqueio de entrada de uma tela nova vencer, em ms. */
const ESPERA_BLOQUEIO_MS = SEGUNDOS_BLOQUEIO * 1000 + 200;
/** Onde pôr o Kiwi para o arminho dar o pulinho sem encostar nele (pixels), e quanto esperar o meio dele. */
const DISTANCIA_PULINHO = 40;
const ESPERA_PULINHO_MS = COMPORTAMENTO_PREDADOR.arminho.pulinho.segundos * 500;
/** De quantos pixels acima do Predador o Kiwi cai para capturá-lo: pouco, para o rato, rápido, não escapar. */
const QUEDA_CAPTURA = 16;

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
 *   fatosEncontrados: number, capturas: number, invulneravel: number, predadores: { x: number, y: number }[],
 *   ovelhas: { x: number, y: number }[], checkpoint: { x: number, y: number } }>}
 *   O estado; `predadores` são os que ainda estão na Fase e `checkpoint`, o ativo.
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
      ovelhas: fase.ovelhas.getChildren().map((ovelha) => ({ x: ovelha.x, y: ovelha.y })),
      checkpoint: { ...fase.checkpoint },
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
  if (!parado.textos.includes(criarTextos().tempo(0))) problemas.push(`HUD sem o tempo zerado: ${parado.textos}`);
  if (!parado.textos.includes(`0/${itens.length}`)) problemas.push(`HUD sem "0/${itens.length}": ${parado.textos}`);
  if (parado.y !== antes.y || parado.segundos !== 0) problemas.push('a Fase se mexeu antes do primeiro input');
  if (JSON.stringify(parado.predadores) !== JSON.stringify(antes.predadores)) problemas.push('um Predador se mexeu antes do primeiro input');
  if (parado.ovelhas.length === 0) problemas.push('a Pecuária abriu sem Ovelhas');
  if (JSON.stringify(parado.ovelhas) !== JSON.stringify(antes.ovelhas)) problemas.push('uma Ovelha se mexeu antes do primeiro input');
  for (const { type: chave } of await objetosDaPecuaria('placa')) {
    if (!parado.textos.includes(criarTextos().t(chave))) problemas.push(`Placa sem o texto "${criarTextos().t(chave)}"`);
  }

  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.down('ArrowRight');
  await pagina.waitForTimeout(ESPERA_MS);
  await pagina.keyboard.up('ArrowRight');
  const andou = await estadoDaFase(pagina);
  if (andou.x <= antes.x || andou.segundos <= 0) problemas.push('mover não deu a partida na Fase e no cronômetro');
  if (andou.predadores.every((predador, i) => predador.x === antes.predadores[i].x)) problemas.push('os Predadores não patrulham depois do primeiro input');
  if (andou.ovelhas.every((ovelha, i) => ovelha.x === antes.ovelhas[i].x)) problemas.push('as Ovelhas não andam depois do primeiro input');

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
  problemas.push(...await verificarOvelhas(pagina, levarKiwi));
  return problemas;
}

/**
 * Confere a primeira Ovelha: de lado, o Kiwi a atravessa sem subir; caindo sobre ela, fica
 * montado e é levado; prensado contra uma parede em cima dela, volta ao Checkpoint.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, com a Fase andando.
 * @param {(x: number, y: number) => Promise<void>} levarKiwi - Põe o Kiwi num ponto.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarOvelhas(pagina, levarKiwi) {
  const problemas = [];
  // Recomeça a primeira Ovelha a 2 tiles da ponta esquerda, indo para a direita: sobra trajeto.
  const ovelha = await pagina.evaluate((cena) => {
    const [primeira] = window.kiwirun.jogo.scene.getScene(cena).ovelhas.getChildren();
    const velocidade = Math.abs(primeira.body.velocity.x);
    primeira.body.reset(primeira.getData('minX') + 36, primeira.y);
    primeira.setVelocityX(velocidade);
    return { x: primeira.x, y: primeira.y };
  }, CENA_FASE);

  await levarKiwi(ovelha.x + 6, ovelha.y);
  await pagina.waitForTimeout(ESPERA_MS / 4);
  const deLado = await estadoDaFase(pagina);
  if (deLado.y < ovelha.y - 2) problemas.push('o Kiwi encostado de lado subiu na Ovelha em vez de atravessá-la');

  const [agora] = deLado.ovelhas;
  await levarKiwi(agora.x + 6, agora.y - 20);
  await pagina.waitForTimeout(ESPERA_MS / 2);
  const montado = await estadoDaFase(pagina);
  await pagina.waitForTimeout(ESPERA_MS);
  const levado = await estadoDaFase(pagina);
  const andouOvelha = levado.ovelhas[0].x - montado.ovelhas[0].x;
  if (montado.y > montado.ovelhas[0].y - 8) problemas.push(`o Kiwi não ficou montado na Ovelha: ${montado.y} sobre ${montado.ovelhas[0].y}`);
  if (andouOvelha === 0 || Math.abs(levado.x - montado.x - andouOvelha) > 2) problemas.push(`a Ovelha não levou o Kiwi montado: Ovelha andou ${andouOvelha}, Kiwi ${levado.x - montado.x}`);

  // Uma parede logo à frente do Kiwi montado o prensa enquanto a Ovelha anda.
  await pagina.evaluate((cena) => {
    const fase = window.kiwirun.jogo.scene.getScene(cena);
    const parede = fase.add.zone(fase.kiwi.x + 8, fase.kiwi.y, 4, 54);
    fase.physics.add.existing(parede, true);
    fase.physics.add.collider(fase.kiwi, parede);
    window.paredeDoSmoke = parede;
  }, CENA_FASE);
  await pagina.waitForTimeout(SEGUNDOS_PRESO * 1000 + ESPERA_MS);
  const preso = await estadoDaFase(pagina);
  await pagina.evaluate(() => window.paredeDoSmoke.destroy());
  if (Math.abs(preso.x - preso.checkpoint.x) > 4) problemas.push(`preso numa Ovelha, o Kiwi não voltou ao Checkpoint: ${preso.x}`);
  return problemas;
}

/**
 * @param {import('playwright').Page} pagina - A página do jogo.
 * @param {string} cena - A chave da cena.
 * @returns {Promise<boolean>} Se a cena está ativa agora.
 */
function cenaAtiva(pagina, cena) {
  return pagina.evaluate((chave) => window.kiwirun.jogo.scene.isActive(chave), cena);
}

/**
 * Na Pecuária recém-aberta, ainda parada: Esc abre a Pausa sem dar a partida no cronômetro, e
 * Esc a fecha com a Fase ainda congelada.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, com a Fase recém-aberta.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarPausaAntesDoInput(pagina) {
  const problemas = [];
  const antes = await estadoDaFase(pagina);
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('Escape');
  if (!(await esperarCena(pagina, CENA_PAUSA))) return ['Esc na Fase não abriu a Pausa'];
  const textos = criarTextos();
  const pausa = await textosDaCena(pagina, CENA_PAUSA);
  for (const chave of ['pausa.titulo', ...['continuar', 'reiniciar', 'controles', 'menu'].map(chaveOpcaoPausa)]) {
    if (!pausa.includes(textos.t(chave))) problemas.push(`Pausa sem o texto "${textos.t(chave)}"`);
  }
  await pagina.waitForTimeout(ESPERA_MS / 4);
  await pagina.keyboard.press('Escape');
  if (!(await esperarCena(pagina, CENA_FASE))) return [...problemas, 'Esc na Pausa não voltou à Fase'];
  await pagina.waitForTimeout(ESPERA_MS);
  const depois = await estadoDaFase(pagina);
  if (depois.segundos !== 0 || depois.y !== antes.y) problemas.push('abrir a Pausa antes do primeiro input deu a partida na Fase');
  return problemas;
}

/**
 * Com a Fase andando: Esc congela o cronômetro e o Fato na tela, "Controles" mostra o 8BitDo
 * e o teclado em PT, continuar retoma; perder o foco e desconectar o controle abrem a Pausa.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, com a Fase andando.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarPausaAndando(pagina) {
  const problemas = [];
  const textos = criarTextos();
  // Um Fato na tela antes da Pausa, sem pegar a última Samambaia-prateada (o Placar confere o "???").
  const [{ type: chaveFato }] = await objetosDaPecuaria('samambaia');
  await pagina.evaluate(([cena, chave]) => window.kiwirun.jogo.scene.getScene(cena).filaFatos.enfileirar(chave), [CENA_FASE, chaveFato]);
  await pagina.waitForTimeout(ESPERA_MS / 2);
  const fatoNaTela = await pagina.evaluate((cena) => window.kiwirun.jogo.scene.getScene(cena).filaFatos.atual, CENA_FASE);
  await pagina.keyboard.press('Escape');
  if (!(await esperarCena(pagina, CENA_PAUSA))) return ['Esc na Fase andando não abriu a Pausa'];
  const aberta = await estadoDaFase(pagina);
  await pagina.waitForTimeout(DURACAO_FATO * 1000 + ESPERA_MS);
  const parada = await estadoDaFase(pagina);
  if (parada.segundos !== aberta.segundos) problemas.push('o cronômetro andou com a Pausa aberta');
  if (fatoNaTela === null || !parada.textos.includes(textos.t(fatoNaTela))) problemas.push('o Fato na tela saiu com a Pausa aberta');

  // Controles: duas descidas e confirmar; Enter volta às opções.
  for (const tecla of ['ArrowDown', 'ArrowDown', 'Enter']) {
    await pagina.keyboard.press(tecla);
    await pagina.waitForTimeout(ESPERA_MS / 4);
  }
  const controles = await textosDaCena(pagina, CENA_PAUSA);
  const esperados = ['controles.titulo', 'controles.8bitdo', 'controles.teclado',
    ...LINHAS_CONTROLES.flatMap(({ chaveAcao, chave8BitDo, chaveTeclado }) => [chaveAcao, chave8BitDo, chaveTeclado])];
  for (const chave of esperados) {
    if (!controles.includes(textos.t(chave))) problemas.push(`Controles sem o texto "${textos.t(chave)}"`);
  }
  await pagina.keyboard.press('Enter');
  await pagina.waitForTimeout(ESPERA_MS / 4);
  await pagina.keyboard.press('Escape');
  if (!(await esperarCena(pagina, CENA_FASE))) return [...problemas, 'Esc na Pausa não a fechou depois dos Controles'];
  await pagina.waitForTimeout(ESPERA_MS);
  if ((await estadoDaFase(pagina)).segundos <= parada.segundos) problemas.push('continuar não retomou o cronômetro');

  for (const [evento, nome] of [['blur', 'perder o foco'], ['gamepaddisconnected', 'desconectar o controle']]) {
    await pagina.evaluate((tipo) => window.dispatchEvent(new Event(tipo)), evento);
    if (!(await esperarCena(pagina, CENA_PAUSA))) {
      problemas.push(`${nome} não abriu a Pausa`);
      continue;
    }
    await pagina.waitForTimeout(ESPERA_MS / 4);
    await pagina.keyboard.press('Escape');
    if (!(await esperarCena(pagina, CENA_FASE))) return [...problemas, `Esc não fechou a Pausa aberta por ${nome}`];
  }
  return problemas;
}

/**
 * Do Menu, abre a Pecuária, anda, coleta um Item, passa por um Checkpoint e captura um
 * Predador; "Reiniciar a Fase" com o pulo segurado recomeça do zero sem o Kiwi pular, e
 * "Menu" na Pausa vai ao Menu.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, no Menu.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarReiniciar(pagina) {
  const problemas = [];
  const itens = await objetosDaPecuaria('item');
  const predadores = await objetosDaPecuaria('predador');
  const [checkpoint] = await objetosDaPecuaria('checkpoint');
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('Enter');
  if (!(await esperarCena(pagina, CENA_FASE))) return ['Enter no Menu não abriu a Pecuária de novo'];
  await pagina.waitForFunction((cena) => window.kiwirun.jogo.scene.getScene(cena)?.kiwi?.active === true, CENA_FASE, { timeout: LIMITE_MS });
  const { x: inicioX } = await estadoDaFase(pagina);
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.down('ArrowRight');
  await pagina.waitForTimeout(ESPERA_MS / 4);
  await pagina.keyboard.up('ArrowRight');
  const levarKiwi = (x, y) => pagina.evaluate(([cena, alvoX, alvoY]) => {
    window.kiwirun.jogo.scene.getScene(cena).kiwi.body.reset(alvoX, alvoY);
  }, [CENA_FASE, x, y]);
  await levarKiwi(itens[0].x, itens[0].y);
  await pagina.waitForTimeout(ESPERA_MS / 2);
  await levarKiwi(checkpoint.x, checkpoint.y - 9);
  await pagina.waitForTimeout(ESPERA_MS / 2);
  const [alvo] = (await estadoDaFase(pagina)).predadores;
  await levarKiwi(alvo.x, alvo.y - QUEDA_CAPTURA);
  await pagina.waitForFunction((cena) => window.kiwirun.jogo.scene.getScene(cena).capturas > 0, CENA_FASE, { timeout: 2000 }).catch(() => {});
  const antes = await estadoDaFase(pagina);
  if (antes.capturas !== 1 || antes.textos.includes(`0/${itens.length}`)) problemas.push('a preparação do reinício não coletou um Item nem capturou');

  await pagina.keyboard.press('Escape');
  if (!(await esperarCena(pagina, CENA_PAUSA))) return [...problemas, 'Esc na Fase não abriu a Pausa para reiniciar'];
  await pagina.waitForTimeout(ESPERA_MS / 4);
  await pagina.keyboard.press('ArrowDown');
  await pagina.waitForTimeout(ESPERA_MS / 4);
  await pagina.keyboard.down('Space');
  if (!(await esperarCena(pagina, CENA_FASE))) return [...problemas, '"Reiniciar a Fase" não reabriu a Fase'];
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS + ESPERA_MS);
  const deNovo = await estadoDaFase(pagina);
  const checkpointAtivo = await pagina.evaluate((cena) => window.kiwirun.jogo.scene.getScene(cena).checkpoint.x, CENA_FASE);
  await pagina.keyboard.up('Space');
  if (deNovo.segundos !== 0 || deNovo.vy !== 0) problemas.push('o pulo segurado ao reiniciar fez o Kiwi pular na Fase');
  if (deNovo.capturas !== 0 || deNovo.fatosEncontrados !== 0 || deNovo.predadores.length !== predadores.length) {
    problemas.push('"Reiniciar a Fase" não zerou as Capturas e as Samambaias-prateadas nem devolveu os Predadores');
  }
  if (!deNovo.textos.includes(`0/${itens.length}`)) problemas.push('"Reiniciar a Fase" não zerou os Itens');
  if (checkpointAtivo !== inicioX || deNovo.x !== inicioX) problemas.push('"Reiniciar a Fase" não voltou ao Checkpoint do início');

  await pagina.waitForTimeout(ESPERA_MS / 4);
  await pagina.keyboard.press('Escape');
  if (!(await esperarCena(pagina, CENA_PAUSA))) return [...problemas, 'Esc não abriu a Pausa depois de reiniciar'];
  for (const tecla of ['ArrowDown', 'ArrowDown', 'ArrowDown', 'Enter']) {
    await pagina.keyboard.press(tecla);
    await pagina.waitForTimeout(ESPERA_MS / 4);
  }
  if (!(await esperarCena(pagina, CENA_MENU))) problemas.push('"Menu" na Pausa não foi ao Menu');
  if (await cenaAtiva(pagina, CENA_FASE) || await cenaAtiva(pagina, CENA_PAUSA)) problemas.push('a Fase ou a Pausa ficaram abertas depois de ir ao Menu');
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

  await levarKiwi(alvo.x, alvo.y - QUEDA_CAPTURA);
  await pagina.waitForFunction((cena) => window.kiwirun.jogo.scene.getScene(cena).capturas > 0, CENA_FASE, { timeout: 2000 }).catch(() => {});
  const capturou = await estadoDaFase(pagina);
  if (capturou.capturas !== 1 || capturou.predadores.length !== inicio.predadores.length - 1) problemas.push('cair sobre um Predador não o capturou');
  if (capturou.vy >= 0) problemas.push('a Captura não fez o Kiwi quicar');
  if (!capturou.textos.includes(nome)) problemas.push(`a Captura não mostrou o nome da espécie "${nome}"`);

  // Espera o Kiwi assentar (fim do quique e do rótulo); o próximo Predador é o arminho, que
  // dá um pulinho quando o Kiwi chega perto, sem encostar nele.
  await levarKiwi(checkpoint.x, checkpoint.y - 9);
  await pagina.waitForTimeout(ESPERA_MS * 3);
  const { predadores: [arminho] } = await estadoDaFase(pagina);
  await levarKiwi(arminho.x - DISTANCIA_PULINHO, arminho.y);
  await pagina.waitForTimeout(ESPERA_PULINHO_MS);
  const { predadores: [pulando] } = await estadoDaFase(pagina);
  if (!(pulando.y < arminho.y)) problemas.push(`o arminho não deu o pulinho com o Kiwi perto: ${arminho.y} → ${pulando.y}`);

  // Encosta de lado no arminho, de volta ao chão.
  await levarKiwi(checkpoint.x, checkpoint.y - 9);
  await pagina.waitForTimeout(ESPERA_MS * 2);
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
  // Longe dos Predadores: parado dentro de um, o fim da invulnerabilidade o devolve ao Checkpoint de novo.
  await levarKiwi(checkpoint.x, checkpoint.y - 9);
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
 * @param {import('playwright').Page} pagina - A página do jogo.
 * @param {string} cena - A chave da cena.
 * @returns {Promise<string[]>} Os textos visíveis da cena.
 */
function textosDaCena(pagina, cena) {
  return pagina.evaluate((chave) => window.kiwirun.jogo.scene.getScene(chave).children.list
    .filter((objeto) => objeto.type === 'BitmapText' && objeto.visible)
    .map((objeto) => objeto.text), cena);
}

/**
 * Na Tela inicial, a seta para a direita troca para EN sem sair dela e o Menu abre em
 * inglês; nada de idioma vai ao `localStorage`, e recarregar a página volta ao PT. Termina
 * na Tela inicial recarregada.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, na Tela inicial.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarIdioma(pagina) {
  const problemas = [];
  const textos = criarTextos();
  const armazenado = () => pagina.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  const antes = await armazenado();

  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('ArrowRight');
  await pagina.waitForTimeout(ESPERA_MS / 4);
  textos.definirIdioma('en');
  if (!(await pagina.evaluate((cena) => window.kiwirun.jogo.scene.isActive(cena), CENA_TELA_INICIAL))) {
    return ['a seta para a direita saiu da Tela inicial'];
  }
  const telaEn = await textosDaCena(pagina, CENA_TELA_INICIAL);
  for (const chave of ['tela_inicial.aperte', 'tela_inicial.saudacao']) {
    if (!telaEn.includes(textos.t(chave))) problemas.push(`Tela inicial em EN sem "${textos.t(chave)}"`);
  }

  await pagina.keyboard.press('Enter');
  if (!(await esperarCena(pagina, CENA_MENU))) return [...problemas, 'Enter na Tela inicial em EN não abriu o Menu'];
  const menuEn = await textosDaCena(pagina, CENA_MENU);
  for (const chave of ['menu.titulo', 'mundo.economia-tecnologia', 'fase.pecuaria', 'menu.voltar']) {
    if (!menuEn.includes(textos.t(chave))) problemas.push(`Menu em EN sem "${textos.t(chave)}"`);
  }
  if ((await armazenado()) !== antes) problemas.push(`trocar o idioma gravou no localStorage: ${await armazenado()}`);

  await pagina.reload();
  await pagina.waitForFunction((cena) => window.kiwirun?.jogo?.scene.isActive(cena), CENA_TELA_INICIAL, { timeout: LIMITE_MS });
  const recarregada = await textosDaCena(pagina, CENA_TELA_INICIAL);
  const aperteEmPt = criarTextos().t('tela_inicial.aperte');
  if (!recarregada.includes(aperteEmPt)) problemas.push(`recarregar não voltou ao PT: ${recarregada}`);
  return problemas;
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
 * Do Menu (cursor na Pecuária), desce dos Mundos até "Créditos" e o confirma.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, no Menu recém-aberto.
 * @returns {Promise<boolean>} Se os Créditos abriram.
 */
async function abrirCreditos(pagina) {
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  for (const tecla of ['ArrowLeft', 'ArrowDown', 'Enter']) {
    await pagina.keyboard.press(tecla);
    await pagina.waitForTimeout(ESPERA_MS / 4);
  }
  return esperarCena(pagina, CENA_CREDITOS);
}

/**
 * Os Créditos: "Créditos" no Menu os abre, com o grupo, os pacotes Kenney, o Phaser e as
 * fontes dos Fatos de cada Fase; M silencia e mostra o ícone; Esc e o botão "Voltar"
 * (confirmar) voltam ao Menu. Termina no Menu, com som.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, no Menu recém-aberto.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarCreditos(pagina) {
  const problemas = [];
  const textos = criarTextos();
  if (!(await abrirCreditos(pagina))) return ['"Créditos" no Menu não abriu os Créditos'];

  const chaves = [...CHAVES_TELA_CREDITOS, ...SECOES_CREDITOS.flatMap((secao) => [secao.chaveTitulo, ...secao.chavesLinhas])];
  const esperados = chaves.map((chave) => textos.t(chave));
  for (const { chaveNome, fontes } of fontesPorFase(MUNDOS)) esperados.push(textos.t(chaveNome), ...fontes);
  const visiveis = await textosDaCena(pagina, CENA_CREDITOS);
  for (const esperado of esperados) {
    if (!visiveis.includes(esperado)) problemas.push(`Créditos sem o texto "${esperado}"`);
  }

  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('KeyM');
  await pagina.waitForTimeout(ESPERA_MS / 4);
  if (!(await esperarSilencio(pagina, CENA_CREDITOS, true))) problemas.push('M nos Créditos não silenciou nem mostrou o ícone');
  await pagina.keyboard.press('KeyM');
  await pagina.waitForTimeout(ESPERA_MS / 4);
  if (!(await esperarSilencio(pagina, CENA_CREDITOS, false))) problemas.push('M de novo nos Créditos não devolveu o som');

  await pagina.keyboard.press('Escape');
  if (!(await esperarCena(pagina, CENA_MENU))) return [...problemas, 'Esc nos Créditos não voltou ao Menu'];
  if (!(await abrirCreditos(pagina))) return [...problemas, '"Créditos" no Menu não reabriu os Créditos'];
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('Enter');
  if (!(await esperarCena(pagina, CENA_MENU))) problemas.push('"Voltar" nos Créditos não voltou ao Menu');
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
 * @returns {Promise<{ textos: string[], opcoes: string[], opcao: string, tempoGasto: number }>}
 *   Os textos e as opções do Placar, e o Tempo gasto que ele recebeu.
 */
function estadoDoPlacar(pagina) {
  return pagina.evaluate((cena) => {
    const placar = window.kiwirun.jogo.scene.getScene(cena);
    const textos = placar.children.list.filter((objeto) => objeto.type === 'BitmapText').map((objeto) => objeto.text);
    return { textos, opcoes: [...placar.menu.opcoes], opcao: placar.menu.opcao, tempoGasto: placar.placar.tempoGasto };
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
  if (!(await esperarCena(pagina, CENA_INICIAIS))) return ['o primeiro fim da Pecuária não abriu as Iniciais'];
  problemas.push(...await verificarIniciais(pagina));
  if (!(await esperarCena(pagina, CENA_PLACAR))) return [...problemas, 'gravar as Iniciais não abriu o Placar'];

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
    'placar.titulo', 'placar.novo_recorde', 'placar.tempo_gasto', 'placar.desconto_itens', 'placar.desconto_capturas',
    'placar.desconto_samambaias', 'placar.tempo_final', 'placar.fatos', 'placar.fato_faltando', 'placar.convite',
    'placar.jogar_de_novo', 'placar.menu',
  ].map((chave) => textos.t(chave));
  esperados.push(textos.t('placar.capturas_especie', { nome: textos.t(chaveNomePredador(predadores[0].type)), quantidade: '1' }));
  for (const esperado of esperados) {
    if (!placar.textos.includes(esperado)) problemas.push(`Placar sem o texto "${esperado}"`);
  }
  if (!placar.textos.some((texto) => /^\d+,\d s$/.test(texto))) problemas.push('Placar sem tempo "N,N s" em PT');
  // Arredondado como o Tempo final, para a conta da tela fechar.
  const tempoGasto = textos.tempo(arredondarDecimos(placar.tempoGasto));
  if (!placar.textos.includes(tempoGasto)) problemas.push(`Placar sem o Tempo gasto arredondado "${tempoGasto}"`);
  if (!placar.opcoes.includes('proxima')) problemas.push('o Placar da Pecuária não oferece "Próxima Fase" (o Porto)');
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
  // O segundo passeio costuma ser mais rápido: um Novo Recorde passa de novo pelas Iniciais.
  await pagina.waitForFunction((cenas) => cenas.some((cena) => window.kiwirun.jogo.scene.isActive(cena)), [CENA_INICIAIS, CENA_PLACAR], { timeout: 2000 }).catch(() => {});
  if (await pagina.evaluate((cena) => window.kiwirun.jogo.scene.isActive(cena), CENA_INICIAIS)) {
    await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
    for (const letra of 'ABC') await pagina.keyboard.press(`Key${letra}`);
  }
  if (!(await esperarCena(pagina, CENA_PLACAR))) return [...problemas, 'tocar o fim de novo não abriu o Placar'];
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('Escape');
  if (!(await esperarCena(pagina, CENA_MENU))) problemas.push('Esc no Placar não foi ao Menu');
  return problemas;
}

/**
 * @param {import('playwright').Page} pagina - A página do jogo, com as Iniciais abertas.
 * @returns {Promise<{ letras: string, posicao: number, textos: string[] }>} As letras, o
 *   cursor e os textos das Iniciais.
 */
function estadoDasIniciais(pagina) {
  return pagina.evaluate((cena) => {
    const { iniciais, children } = window.kiwirun.jogo.scene.getScene(cena);
    const textos = children.list.filter((objeto) => objeto.type === 'BitmapText').map((objeto) => objeto.text);
    return { letras: iniciais.letras, posicao: iniciais.posicao, textos };
  }, CENA_INICIAIS);
}

/**
 * @param {import('playwright').Page} pagina - A página do jogo.
 * @returns {Promise<import('../src/logica/recorde.js').Recorde | null>} O Recorde da Pecuária.
 */
function lerRecorde(pagina) {
  return pagina.evaluate((faseId) => window.kiwirun.jogo.registry.get('recordes').ler(faseId), FASE_PECUARIA);
}

/**
 * Nas Iniciais, com o pulo segurado desde o fim da Fase: o pulo não confirma, digitar W e M
 * preenche as letras sem mover o cursor, Esc volta uma letra, a seta para cima troca a letra
 * e "K" grava as Iniciais "WNK" no Recorde. Termina com o pulo ainda segurado.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, com as Iniciais abertas.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarIniciais(pagina) {
  const problemas = [];
  const textos = criarTextos();
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  const inicio = await estadoDasIniciais(pagina);
  if (inicio.letras !== 'AAA' || inicio.posicao !== 0) problemas.push(`Iniciais não começaram em "AAA" na primeira letra: ${JSON.stringify(inicio)}`);
  for (const chave of ['iniciais.titulo', 'iniciais.instrucao']) {
    if (!inicio.textos.includes(textos.t(chave))) problemas.push(`Iniciais sem o texto "${textos.t(chave)}"`);
  }

  await pagina.keyboard.press('KeyW');
  await pagina.keyboard.press('KeyM');
  await pagina.waitForTimeout(ESPERA_MS / 4);
  const digitado = await estadoDasIniciais(pagina);
  if (digitado.letras !== 'WMA' || digitado.posicao !== 2) problemas.push(`digitar W e M não preencheu "WMA": ${JSON.stringify(digitado)}`);

  // Um toque por quadro: na mesma leitura, a ordem entre eles não é garantida.
  for (const tecla of ['Escape', 'ArrowUp', 'Enter']) {
    await pagina.keyboard.press(tecla);
    await pagina.waitForTimeout(ESPERA_MS / 4);
  }
  await pagina.waitForTimeout(ESPERA_MS / 4);
  const corrigido = await estadoDasIniciais(pagina);
  if (corrigido.letras !== 'WNA' || corrigido.posicao !== 2) problemas.push(`Esc e a seta para cima não corrigiram para "WNA": ${JSON.stringify(corrigido)}`);

  await pagina.keyboard.press('KeyK');
  await esperarCena(pagina, CENA_PLACAR);
  const recorde = await lerRecorde(pagina);
  if (recorde?.iniciais !== 'WNK') problemas.push(`as Iniciais gravadas no Recorde não são "WNK": ${JSON.stringify(recorde)}`);
  return problemas;
}

/**
 * No Menu, a Pecuária mostra o Recorde gravado ("ABC 42,3 s"); ele sobrevive a recarregar a
 * página, e segurar Shift+Backspace por 3 s na Tela inicial o zera, com a confirmação, e o
 * Menu volta a "—".
 *
 * @param {import('playwright').Page} pagina - A página do jogo, no Menu, com um Recorde.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarRecorde(pagina) {
  const problemas = [];
  const textos = criarTextos();
  const recorde = await lerRecorde(pagina);
  if (!recorde?.iniciais) return [`a Pecuária terminou sem Recorde com Iniciais: ${JSON.stringify(recorde)}`];
  const esperado = textoRecorde(recorde, textos);
  if (!(await textosDaCena(pagina, CENA_MENU)).includes(esperado)) problemas.push(`Menu sem o Recorde "${esperado}"`);

  await pagina.reload();
  await pagina.waitForFunction((cena) => window.kiwirun?.jogo?.scene.isActive(cena), CENA_TELA_INICIAL, { timeout: LIMITE_MS });
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('Enter');
  if (!(await esperarCena(pagina, CENA_MENU))) return [...problemas, 'Enter na Tela inicial recarregada não abriu o Menu'];
  if (!(await textosDaCena(pagina, CENA_MENU)).includes(esperado)) problemas.push(`o Recorde "${esperado}" não sobreviveu a recarregar a página`);

  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('Escape');
  if (!(await esperarCena(pagina, CENA_TELA_INICIAL))) return [...problemas, 'Esc no Menu não voltou à Tela inicial'];
  const confirmacao = textos.t('tela_inicial.recordes_zerados');
  await pagina.keyboard.down('ShiftLeft');
  await pagina.keyboard.down('Backspace');
  await pagina.waitForTimeout(SEGUNDOS_ZERAR * 1000 - 1000);
  if ((await textosDaCena(pagina, CENA_TELA_INICIAL)).includes(confirmacao) || !(await lerRecorde(pagina))) {
    problemas.push('Shift+Backspace zerou os Recordes antes de 3 s');
  }
  await pagina.waitForTimeout(1000 + ESPERA_MS);
  await pagina.keyboard.up('Backspace');
  await pagina.keyboard.up('ShiftLeft');
  if (!(await textosDaCena(pagina, CENA_TELA_INICIAL)).includes(confirmacao)) problemas.push(`Shift+Backspace por 3 s não mostrou "${confirmacao}"`);
  if (await lerRecorde(pagina)) problemas.push('Shift+Backspace por 3 s não zerou o Recorde');
  const guardados = await pagina.evaluate(() => Object.keys(localStorage).filter((chave) => chave.startsWith('kiwirun:v1:recorde:')));
  if (guardados.length > 0) problemas.push(`zerar deixou Recordes no localStorage: ${guardados}`);

  await pagina.keyboard.press('Enter');
  if (!(await esperarCena(pagina, CENA_MENU))) return [...problemas, 'Enter na Tela inicial não abriu o Menu depois de zerar'];
  if (!(await textosDaCena(pagina, CENA_MENU)).includes(textos.t('menu.sem_recorde'))) problemas.push('o Menu não voltou a "—" depois de zerar');
  return problemas;
}

/** Tempos curtos da Volta por inatividade, para o smoke não esperar 60 s. */
const TEMPOS_INATIVIDADE = Object.freeze({ segundosVolta: 2.5, segundosAviso: 1.5 });
/** Um pouco mais que a Volta encurtada, em ms. */
const ESPERA_VOLTA_MS = TEMPOS_INATIVIDADE.segundosVolta * 1000 + ESPERA_MS;

/**
 * Para as cenas ativas e abre a cena dada, com os tempos curtos da Volta por inatividade.
 *
 * @param {import('playwright').Page} pagina - A página do jogo.
 * @param {string} cena - A chave da cena.
 * @param {object} [dados] - Os dados da cena.
 * @returns {Promise<boolean>} Se a cena ficou ativa.
 */
async function abrirCena(pagina, cena, dados) {
  await pagina.evaluate(({ chave, dadosCena, tempos }) => {
    const { jogo } = window.kiwirun;
    jogo.registry.set('temposInatividade', tempos);
    for (const outra of jogo.scene.getScenes(true)) jogo.scene.stop(outra.scene.key);
    jogo.scene.start(chave, dadosCena);
  }, { chave: cena, dadosCena: dados, tempos: TEMPOS_INATIVIDADE });
  return esperarCena(pagina, cena);
}

/**
 * Espera o aviso "Ainda está aí?" aparecer na cena, no idioma dado.
 *
 * @param {import('playwright').Page} pagina - A página do jogo.
 * @param {string} cena - A chave da cena.
 * @param {import('../src/logica/textos.js').Textos} textos - Os Textos no idioma esperado.
 * @returns {Promise<boolean>} Se o aviso apareceu antes da Volta.
 */
function esperarAviso(pagina, cena, textos) {
  const prefixo = textos.t('inatividade.aviso').split('{')[0];
  return pagina.waitForFunction(({ chave, inicio }) => window.kiwirun.jogo.scene.getScene(chave).children.list
    .some((objeto) => objeto.type === 'BitmapText' && objeto.visible && objeto.text.startsWith(inicio)), { chave: cena, inicio: prefixo }, { timeout: ESPERA_VOLTA_MS })
    .then(() => true, () => false);
}

/**
 * @param {import('playwright').Page} pagina - A página do jogo.
 * @returns {Promise<boolean>} Se a Volta aconteceu: só a Tela inicial ativa, em PT, e nenhuma
 *   cena pausada por baixo.
 */
async function voltou(pagina) {
  const chegou = await pagina.waitForFunction((cena) => window.kiwirun.jogo.scene.isActive(cena), CENA_TELA_INICIAL, { timeout: ESPERA_VOLTA_MS })
    .then(() => true, () => false);
  if (!chegou) return false;
  return pagina.evaluate(() => {
    const { jogo } = window.kiwirun;
    const rodando = jogo.scene.getScenes(false).filter((cena) => cena.sys.isActive() || cena.sys.isPaused()).map((cena) => cena.scene.key);
    return jogo.registry.get('textos').idioma === 'pt' && rodando.length === 1;
  });
}

/**
 * A Volta por inatividade, com os tempos encurtados: no Menu em EN o aviso sai em inglês,
 * qualquer input o cancela e a Volta restaura o PT; na Fase, na Pausa (a Fase por baixo
 * para junto) e no Placar o aviso aparece e a Volta acontece; nas Iniciais a Volta grava
 * "---"; na Tela inicial não há aviso. Termina na Tela inicial.
 *
 * @param {import('playwright').Page} pagina - A página do jogo.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarVolta(pagina) {
  const problemas = [];
  const pt = criarTextos();
  const en = criarTextos();
  en.definirIdioma('en');

  await pagina.evaluate(() => window.kiwirun.jogo.registry.get('textos').definirIdioma('en'));
  await abrirCena(pagina, CENA_MENU);
  if (!(await esperarAviso(pagina, CENA_MENU, en))) problemas.push('o aviso em EN não apareceu no Menu parado');
  await pagina.keyboard.press('ArrowDown');
  await pagina.waitForTimeout(ESPERA_MS / 4);
  const avisoPt = pt.t('inatividade.aviso').split('{')[0];
  const avisoEn = en.t('inatividade.aviso').split('{')[0];
  if ((await textosDaCena(pagina, CENA_MENU)).some((texto) => texto.startsWith(avisoEn))) problemas.push('um input no Menu não cancelou o aviso');
  if (!(await voltou(pagina))) problemas.push('a Volta pelo Menu em EN não abriu a Tela inicial em PT');

  await abrirCena(pagina, CENA_FASE, { faseId: FASE_PECUARIA });
  if (!(await esperarAviso(pagina, CENA_FASE, pt))) problemas.push('o aviso não apareceu na Fase parada');
  if (!(await voltou(pagina))) problemas.push('a Volta pela Fase não abriu só a Tela inicial');

  await abrirCena(pagina, CENA_FASE, { faseId: FASE_PECUARIA });
  await pagina.waitForFunction((cena) => window.kiwirun.jogo.scene.getScene(cena)?.kiwi?.active === true, CENA_FASE, { timeout: LIMITE_MS });
  // A Pausa aberta de fora do quadro (perda de foco) não deixa o aviso da Fase congelado por baixo.
  if (!(await esperarAviso(pagina, CENA_FASE, pt))) problemas.push('o aviso não apareceu na Fase parada antes da Pausa');
  await pagina.evaluate(() => window.kiwirun.jogo.events.emit('blur'));
  if (!(await esperarCena(pagina, CENA_PAUSA))) problemas.push('a perda de foco não abriu a Pausa');
  if ((await textosDaCena(pagina, CENA_FASE)).some((texto) => texto.startsWith(avisoPt))) problemas.push('o aviso da Fase ficou por baixo da Pausa');
  if (!(await esperarAviso(pagina, CENA_PAUSA, pt))) problemas.push('o aviso não apareceu na Pausa parada');
  if (!(await voltou(pagina))) problemas.push('a Volta pela Pausa não abriu só a Tela inicial (a Fase ficou por baixo?)');

  const tentativa = { faseId: FASE_PECUARIA, tempoGasto: 42, itens: [], capturas: [], fatosEncontrados: [], novoRecorde: false };
  await abrirCena(pagina, CENA_PLACAR, tentativa);
  if (!(await esperarAviso(pagina, CENA_PLACAR, pt))) problemas.push('o aviso não apareceu no Placar parado');
  if (!(await voltou(pagina))) problemas.push('a Volta pelo Placar não abriu a Tela inicial');

  await pagina.evaluate((faseId) => {
    const recordes = window.kiwirun.jogo.registry.get('recordes');
    recordes.zerar();
    recordes.registrar(faseId, 42);
  }, FASE_PECUARIA);
  await abrirCena(pagina, CENA_INICIAIS, { ...tentativa, novoRecorde: true });
  if (!(await voltou(pagina))) problemas.push('a Volta pelas Iniciais não abriu a Tela inicial');
  const recorde = await lerRecorde(pagina);
  if (recorde?.iniciais !== '---') problemas.push(`a Volta pelas Iniciais não gravou "---": ${JSON.stringify(recorde)}`);

  await abrirCena(pagina, CENA_TELA_INICIAL);
  const prazoSemAviso = Date.now() + ESPERA_VOLTA_MS;
  while (Date.now() < prazoSemAviso) {
    const textos = await textosDaCena(pagina, CENA_TELA_INICIAL);
    if (textos.some((texto) => texto.startsWith(avisoPt))) {
      problemas.push('a Tela inicial mostrou o aviso');
      break;
    }
    await pagina.waitForTimeout(ESPERA_MS / 4);
  }
  return problemas;
}

/**
 * Passa a registrar os efeitos sonoros tocados em `window.efeitosTocados`, até a página
 * recarregar.
 *
 * @param {import('playwright').Page} pagina - A página do jogo.
 */
function espiarEfeitos(pagina) {
  return pagina.evaluate(() => {
    const { sound } = window.kiwirun.jogo;
    const tocar = sound.play.bind(sound);
    window.efeitosTocados = [];
    sound.play = (chave, configuracao) => {
      window.efeitosTocados.push(chave);
      return tocar(chave, configuracao);
    };
  });
}

/**
 * Confere que cada efeito dado tocou desde `espiarEfeitos`.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, sem recarregar desde a espia.
 * @param {readonly string[]} efeitos - As ações cujo efeito deve ter tocado.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarEfeitos(pagina, efeitos) {
  const tocados = await pagina.evaluate(() => window.efeitosTocados);
  return efeitos.filter((efeito) => !tocados.includes(chaveEfeito(efeito)))
    .map((efeito) => `o efeito "${efeito}" não tocou`);
}

/**
 * Espera o Silêncio chegar ao estado dado: o som do jogo mudo ou não, o ícone de som cortado
 * visível ou não na cena e o `localStorage` de acordo. O Chrome só atualiza o ganho do mute
 * enquanto algum som passa por ele: um efeito toca para a conferência.
 *
 * @param {import('playwright').Page} pagina - A página do jogo.
 * @param {string} cena - A chave da cena.
 * @param {boolean} ligado - O estado esperado.
 * @returns {Promise<boolean>} Se o Silêncio chegou ao estado em até `ESPERA_MS`.
 */
async function esperarSilencio(pagina, cena, ligado) {
  await pagina.evaluate((chave) => window.kiwirun.jogo.sound.play(chave), chaveEfeito('coletar'));
  return pagina.waitForFunction(({ chave, esperado }) => {
    const { jogo } = window.kiwirun;
    const icone = jogo.scene.getScene(chave).children.list.some((objeto) => objeto.texture?.key === 'silencio' && objeto.visible);
    const gravado = localStorage.getItem('kiwirun:v1:silencio') === '1';
    return jogo.sound.mute === esperado && icone === esperado && gravado === esperado;
  }, { chave: cena, esperado: ligado }, { timeout: ESPERA_MS }).then(() => true, () => false);
}

/**
 * Segura o Select de um controle `standard` simulado por alguns quadros e o solta.
 *
 * @param {import('playwright').Page} pagina - A página do jogo.
 */
async function apertarSelect(pagina) {
  const definir = (apertado) => pagina.evaluate((select) => {
    const botoes = Array.from({ length: 17 }, (_, numero) => ({ pressed: select && numero === 8, value: 0 }));
    const controle = { index: 0, connected: true, mapping: 'standard', buttons: botoes, axes: [0, 0, 0, 0] };
    Object.defineProperty(navigator, 'getGamepads', { value: () => [controle], configurable: true });
  }, apertado);
  await definir(true);
  await pagina.waitForTimeout(ESPERA_MS / 4);
  await definir(false);
  await pagina.waitForTimeout(ESPERA_MS / 4);
}

/**
 * O Silêncio: M na Tela inicial silencia, grava no `localStorage` e mostra o ícone; ele
 * sobrevive a recarregar a página e à Volta por inatividade; na Fase congelada, M o desliga sem
 * dar a partida; na Pausa, M volta a silenciar sem descongelar a Fase (o ícone dela acompanha);
 * nas Iniciais, M digita e não silencia, e o Select silencia. Termina com o som ligado. Pular,
 * com som, toca o seu efeito.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, na Tela inicial com som.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarSilencio(pagina) {
  const problemas = [];

  // A perda de foco simulada na Volta suspendeu o áudio do Phaser; o foco de volta o retoma.
  await pagina.evaluate(() => window.kiwirun.jogo.events.emit('focus'));
  await abrirCena(pagina, CENA_TELA_INICIAL);
  if (!(await esperarSilencio(pagina, CENA_TELA_INICIAL, false))) problemas.push('o jogo não começou com som e sem o ícone');
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('KeyM');
  await pagina.waitForTimeout(ESPERA_MS / 4);
  if (!(await esperarSilencio(pagina, CENA_TELA_INICIAL, true))) problemas.push('M na Tela inicial não silenciou nem mostrou o ícone');

  await pagina.reload();
  await pagina.waitForFunction((cena) => window.kiwirun?.jogo?.scene.isActive(cena), CENA_TELA_INICIAL, { timeout: LIMITE_MS });
  if (!(await esperarSilencio(pagina, CENA_TELA_INICIAL, true))) problemas.push('o Silêncio não sobreviveu a recarregar a página');

  await abrirCena(pagina, CENA_MENU);
  if (!(await voltou(pagina))) problemas.push('a Volta pelo Menu silenciado não abriu a Tela inicial');
  if (!(await esperarSilencio(pagina, CENA_TELA_INICIAL, true))) problemas.push('o Silêncio não sobreviveu à Volta por inatividade');

  await abrirCena(pagina, CENA_FASE, { faseId: FASE_PECUARIA });
  await pagina.waitForFunction((cena) => window.kiwirun.jogo.scene.getScene(cena)?.kiwi?.active === true, CENA_FASE, { timeout: LIMITE_MS });
  if (!(await esperarSilencio(pagina, CENA_FASE, true))) problemas.push('a Fase silenciada não mostrou o ícone');
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('KeyM');
  await pagina.waitForTimeout(ESPERA_MS);
  if (!(await esperarSilencio(pagina, CENA_FASE, false))) problemas.push('M na Fase não devolveu o som nem escondeu o ícone');
  if ((await estadoDaFase(pagina)).segundos !== 0) problemas.push('M deu a partida na Fase congelada');
  // Com som: o primeiro Espaço dá a partida (o Kiwi assenta no chão) e o segundo pula.
  await espiarEfeitos(pagina);
  for (let pulo = 0; pulo < 2; pulo += 1) {
    await pagina.keyboard.press('Space');
    await pagina.waitForTimeout(ESPERA_MS);
  }
  problemas.push(...await verificarEfeitos(pagina, ['pular']));

  await pagina.keyboard.press('Escape');
  if (!(await esperarCena(pagina, CENA_PAUSA))) return [...problemas, 'Esc na Fase não abriu a Pausa'];
  await pagina.waitForTimeout(ESPERA_MS / 4);
  await pagina.keyboard.press('KeyM');
  await pagina.waitForTimeout(ESPERA_MS / 4);
  if (!(await esperarSilencio(pagina, CENA_PAUSA, true))) problemas.push('M na Pausa não silenciou');
  if (!(await esperarSilencio(pagina, CENA_FASE, true))) problemas.push('o ícone da Fase sob a Pausa não acompanhou o Silêncio');
  const congelada = await pagina.evaluate(({ fase, pausa }) => {
    const { scene } = window.kiwirun.jogo;
    return scene.isPaused(fase) && scene.isActive(pausa);
  }, { fase: CENA_FASE, pausa: CENA_PAUSA });
  if (!congelada) problemas.push('M na Pausa descongelou a Fase ou fechou a Pausa');

  const tentativa = { faseId: FASE_PECUARIA, tempoGasto: 42, itens: [], capturas: [], fatosEncontrados: [], novoRecorde: true };
  await abrirCena(pagina, CENA_INICIAIS, tentativa);
  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('KeyM');
  await pagina.waitForTimeout(ESPERA_MS / 4);
  if (!(await esperarSilencio(pagina, CENA_INICIAIS, true))) problemas.push('M nas Iniciais mexeu no Silêncio');
  if ((await estadoDasIniciais(pagina)).letras !== 'MAA') problemas.push('M nas Iniciais não digitou a letra');
  await apertarSelect(pagina);
  if (!(await esperarSilencio(pagina, CENA_INICIAIS, false))) problemas.push('o Select nas Iniciais não devolveu o som');
  return problemas;
}

/**
 * Lê os textos da Tela inicial.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, com a Tela inicial ativa.
 * @returns {Promise<string[]>} Os textos bitmap da cena.
 */
function textosDaTelaInicial(pagina) {
  return pagina.evaluate((cena) => window.kiwirun.jogo.scene.getScene(cena).children.list
    .filter((objeto) => objeto.type === 'BitmapText')
    .map((objeto) => objeto.text), CENA_TELA_INICIAL);
}

/**
 * Passa a registrar em `window.musicasIniciadas` a chave de cada faixa de música que (re)começa.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, com a música já tocando.
 */
function espiarMusica(pagina) {
  return pagina.evaluate(() => {
    const { sound } = window.kiwirun.jogo;
    const faixa = sound.getAll().find((som) => som.key.startsWith('musica-'));
    const prototipo = Object.getPrototypeOf(faixa);
    const tocar = prototipo.play;
    window.musicasIniciadas = [];
    prototipo.play = function play(...argumentos) {
      if (this.key.startsWith('musica-')) window.musicasIniciadas.push(this.key);
      return tocar.apply(this, argumentos);
    };
  });
}

/**
 * @param {import('playwright').Page} pagina - A página do jogo.
 * @returns {Promise<{ tocando: string[], iniciadas: string[] }>} As faixas de música tocando e
 *   as que (re)começaram desde `espiarMusica`.
 */
function estadoDaMusica(pagina) {
  return pagina.evaluate(() => ({
    tocando: window.kiwirun.jogo.sound.getAll().filter((som) => som.key.startsWith('musica-') && som.isPlaying).map((som) => som.key),
    iniciadas: [...window.musicasIniciadas],
  }));
}

/**
 * A música: tocando no andamento base na Tela inicial, segue sem reiniciar no Menu, nos
 * Créditos e no Placar; a Pecuária troca para o andamento dela, e o Placar seguinte volta ao
 * base; o Silêncio a corta. Termina no Placar, com som.
 *
 * @param {import('playwright').Page} pagina - A página do jogo, com som.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarMusica(pagina) {
  const problemas = [];
  const base = chaveMusica(ANDAMENTO_BASE);
  const daFase = chaveMusica(andamentoDaFase(buscarFase(FASE_PECUARIA)));
  const tentativa = { faseId: FASE_PECUARIA, tempoGasto: 42, itens: [], capturas: [], fatosEncontrados: [], novoRecorde: false };

  await abrirCena(pagina, CENA_TELA_INICIAL);
  await espiarMusica(pagina);
  for (const [cena, dados] of [[CENA_MENU], [CENA_CREDITOS], [CENA_PLACAR, tentativa]]) {
    await abrirCena(pagina, cena, dados);
    const musica = await estadoDaMusica(pagina);
    if (musica.iniciadas.length > 0) problemas.push(`ir à cena ${cena} reiniciou a música: ${musica.iniciadas}`);
    if (musica.tocando.join() !== base) problemas.push(`na cena ${cena}, a música tocando era "${musica.tocando}", não "${base}"`);
  }

  await abrirCena(pagina, CENA_FASE, { faseId: FASE_PECUARIA });
  const naFase = await estadoDaMusica(pagina);
  if (naFase.iniciadas.join() !== daFase || naFase.tocando.join() !== daFase) {
    problemas.push(`a Pecuária não trocou para "${daFase}": ${JSON.stringify(naFase)}`);
  }
  await abrirCena(pagina, CENA_PLACAR, tentativa);
  const noPlacar = await estadoDaMusica(pagina);
  if (noPlacar.iniciadas.join() !== [daFase, base].join() || noPlacar.tocando.join() !== base) {
    problemas.push(`o Placar depois da Fase não voltou a "${base}": ${JSON.stringify(noPlacar)}`);
  }

  await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
  await pagina.keyboard.press('KeyM');
  if (!(await esperarSilencio(pagina, CENA_PLACAR, true))) problemas.push('M no Placar não cortou a música');
  await pagina.keyboard.press('KeyM');
  if (!(await esperarSilencio(pagina, CENA_PLACAR, false))) problemas.push('M no Placar não devolveu a música');
  return problemas;
}

/**
 * Lê da cena Fase o que o smoke do Porto confere: o Kiwi, os guindastes, as lonas das esteiras,
 * o Checkpoint ativo e o cronômetro.
 *
 * @param {import('playwright').Page} pagina - A página do jogo.
 * @returns {Promise<{ id: string, x: number, y: number, base: number, segundos: number,
 *   checkpoint: { x: number, y: number }, guindastes: { x: number, y: number, largura: number, topo: number }[],
 *   lonas: number[] }>} O estado.
 */
function estadoDoPorto(pagina) {
  return pagina.evaluate((cena) => {
    const fase = window.kiwirun.jogo.scene.getScene(cena);
    return {
      id: fase.fase.id,
      x: fase.kiwi.x,
      y: fase.kiwi.y,
      base: fase.kiwi.body.bottom,
      segundos: fase.cronometro.segundos,
      checkpoint: { ...fase.checkpoint },
      guindastes: fase.guindastes.getChildren().map((viga) => ({ x: viga.x, y: viga.y, largura: viga.width, topo: viga.body.top })),
      lonas: fase.lonasEsteira.map((lona) => lona.tilePositionX),
    };
  }, CENA_FASE);
}

/**
 * Põe o Kiwi de pé num ponto da Fase, parado.
 *
 * @param {import('playwright').Page} pagina - A página do jogo.
 * @param {number} x - Centro do Kiwi, em pixels.
 * @param {number} base - Onde ficam os pés do Kiwi, em pixels.
 * @returns {Promise<void>}
 */
function porKiwi(pagina, x, base) {
  return pagina.evaluate(([cena, cx, pes]) => {
    const { kiwi } = window.kiwirun.jogo.scene.getScene(cena);
    kiwi.body.reset(cx, pes - (kiwi.body.bottom - kiwi.y) - 1);
  }, [CENA_FASE, x, base]);
}

/**
 * Num navegador novo, escolhe o Porto no Menu (uma Fase abaixo da Pecuária) e confere: o
 * Porto aberto, com guindastes e esteiras parados até o primeiro input; cada esteira
 * empurrando o Kiwi parado no seu sentido; o guindaste levando o Kiwi montado; o Kiwi
 * prensado contra um teto num guindaste voltando ao Checkpoint; e o fim abrindo o Placar.
 *
 * @param {import('playwright').Browser} navegador - O navegador do smoke.
 * @param {string} url - O endereço do jogo.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarPorto(navegador, url) {
  const problemas = [];
  const contexto = await navegador.newContext({ viewport: { width: 1280, height: 720 } });
  const pagina = await contexto.newPage();
  pagina.on('console', (mensagem) => {
    if (mensagem.type() === 'error') problemas.push(`erro no console no Porto: ${mensagem.text()}`);
  });
  pagina.on('pageerror', (erro) => problemas.push(`exceção na página no Porto: ${erro.message}`));
  try {
    const mapa = JSON.parse(await readFile(MAPA_PORTO, 'utf8'));
    const objetos = mapa.layers.find((camada) => camada.name === 'objetos').objects;
    await pagina.goto(url);
    await pagina.waitForFunction((cena) => window.kiwirun?.jogo?.scene.isActive(cena), CENA_TELA_INICIAL, { timeout: LIMITE_MS });
    await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
    await pagina.keyboard.press('Enter');
    if (!(await esperarCena(pagina, CENA_MENU))) return ['Enter na Tela inicial não abriu o Menu do Porto'];
    await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
    await pagina.keyboard.press('ArrowDown');
    await pagina.waitForTimeout(ESPERA_MS / 4);
    const sobCursor = await pagina.evaluate((cena) => window.kiwirun.jogo.scene.getScene(cena).menu.fase?.id, CENA_MENU);
    if (sobCursor !== FASE_PORTO) return [`abaixo da Pecuária, o cursor do Menu foi a "${sobCursor}", não ao Porto`];
    await pagina.keyboard.press('Enter');
    await pagina.waitForFunction(
      (cena) => window.kiwirun.jogo.scene.getScene(cena)?.kiwi?.active === true,
      CENA_FASE,
      { timeout: LIMITE_MS },
    );

    const antes = await estadoDoPorto(pagina);
    if (antes.id !== FASE_PORTO) return [`o Menu abriu "${antes.id}", não o Porto`];
    if (antes.guindastes.length === 0 || antes.lonas.length === 0) problemas.push('o Porto abriu sem guindastes ou sem esteiras');
    await pagina.waitForTimeout(ESPERA_MS);
    const parado = await estadoDoPorto(pagina);
    if (JSON.stringify(parado.guindastes) !== JSON.stringify(antes.guindastes) || JSON.stringify(parado.lonas) !== JSON.stringify(antes.lonas)) {
      problemas.push('guindastes ou esteiras se mexeram antes do primeiro input');
    }

    // O primeiro mover dá a partida na Fase.
    await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
    await pagina.keyboard.down('ArrowRight');
    await pagina.waitForTimeout(ESPERA_MS / 4);
    await pagina.keyboard.up('ArrowRight');
    if ((await estadoDoPorto(pagina)).segundos === 0) problemas.push('o primeiro mover não deu a partida no Porto');

    for (const esteira of objetos.filter((objeto) => objeto.name === 'esteira')) {
      const sentido = esteira.properties.find((propriedade) => propriedade.name === 'sentido').value;
      await porKiwi(pagina, esteira.x + esteira.width / 2, esteira.y);
      await pagina.waitForTimeout(ESPERA_MS / 4);
      const inicio = await estadoDoPorto(pagina);
      await pagina.waitForTimeout(ESPERA_MS);
      const depois = await estadoDoPorto(pagina);
      if (Math.sign(depois.x - inicio.x) !== sentido) problemas.push(`a esteira de sentido ${sentido} não empurrou o Kiwi parado: ${inicio.x} → ${depois.x}`);
      if (JSON.stringify(depois.lonas) === JSON.stringify(inicio.lonas)) problemas.push('as lonas das esteiras não rolaram com a Fase andando');
    }

    // Montado no guindaste, o Kiwi sobe e desce com a viga, de pé sobre ela.
    const [viga] = (await estadoDoPorto(pagina)).guindastes;
    await porKiwi(pagina, viga.x + viga.largura / 2, viga.topo);
    await pagina.waitForTimeout(ESPERA_MS / 4);
    const montado = await estadoDoPorto(pagina);
    await pagina.waitForTimeout(ESPERA_MS * 2);
    const levado = await estadoDoPorto(pagina);
    const [vigaAntes] = montado.guindastes;
    const [vigaDepois] = levado.guindastes;
    if (vigaDepois.y === vigaAntes.y) problemas.push('o guindaste não se mexeu com a Fase andando');
    if (Math.abs(levado.base - vigaDepois.topo) > 2 || Math.sign(levado.y - montado.y) !== Math.sign(vigaDepois.y - vigaAntes.y)) {
      problemas.push(`o guindaste não levou o Kiwi montado: viga ${vigaAntes.y} → ${vigaDepois.y}, Kiwi ${montado.y} → ${levado.y} (pés ${levado.base})`);
    }

    // Um teto logo acima do Kiwi montado no guindaste que sobe o prensa: ele volta ao Checkpoint.
    const { checkpoint } = levado;
    await pagina.waitForFunction((cena) => {
      const [primeira] = window.kiwirun.jogo.scene.getScene(cena).guindastes.getChildren();
      return primeira.y >= primeira.getData('maxY') - 1;
    }, CENA_FASE, { timeout: LIMITE_MS });
    const [noBaixo] = (await estadoDoPorto(pagina)).guindastes;
    await porKiwi(pagina, noBaixo.x + noBaixo.largura / 2, noBaixo.topo);
    await pagina.waitForTimeout(ESPERA_MS / 8);
    await pagina.evaluate((cena) => {
      const fase = window.kiwirun.jogo.scene.getScene(cena);
      const [primeira] = fase.guindastes.getChildren();
      // Um tile sólido na camada de colisão, logo acima da cabeça do Kiwi, como um teto do mapa.
      const colisao = fase.children.list.find((objeto) => objeto.layer?.name === 'colisao');
      const linha = Math.floor((fase.kiwi.body.top - 2) / 18) - 1;
      for (let coluna = Math.floor(primeira.x / 18); coluna < Math.ceil((primeira.x + primeira.width) / 18); coluna += 1) {
        colisao.putTileAt(1, coluna, linha).setCollision(true, true, true, true);
      }
    }, CENA_FASE);
    const voltou = await pagina.waitForFunction(
      ([cena, x, y]) => {
        const { kiwi } = window.kiwirun.jogo.scene.getScene(cena);
        return Math.abs(kiwi.x - x) < 2 && Math.abs(kiwi.y - y) < 4;
      },
      [CENA_FASE, checkpoint.x, checkpoint.y],
      { timeout: 3000 },
    ).then(() => true, () => false);
    if (!voltou) problemas.push('o Kiwi prensado num guindaste não voltou ao Checkpoint');

    const fim = objetos.find((objeto) => objeto.name === 'fim');
    await pagina.evaluate(([cena, x, y]) => {
      window.kiwirun.jogo.scene.getScene(cena).kiwi.body.reset(x, y);
    }, [CENA_FASE, fim.x + fim.width / 2, fim.y + fim.height / 2]);
    const terminou = await pagina.waitForFunction(
      (cenas) => cenas.some((cena) => window.kiwirun.jogo.scene.isActive(cena)),
      [CENA_INICIAIS, CENA_PLACAR],
      { timeout: 2000 },
    ).then(() => true, () => false);
    if (!terminou) problemas.push('tocar o fim do Porto não abriu as Iniciais nem o Placar');
  } catch (erro) {
    problemas.push(`Porto não carregou pelo Menu: ${erro.message}`);
  } finally {
    await contexto.close();
  }
  return problemas;
}

/**
 * Abre o jogo num aparelho de toque emulado, sem Wake Lock no navegador: a Tela inicial mostra
 * "Jogue no computador" com o link do Pages, nada quebra, e uma tecla abre o Menu mesmo assim.
 *
 * @param {import('playwright').Browser} navegador - O navegador do smoke.
 * @param {string} url - O endereço do jogo.
 * @returns {Promise<string[]>} Os problemas encontrados.
 */
async function verificarToque(navegador, url) {
  const problemas = [];
  const contexto = await navegador.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const pagina = await contexto.newPage();
  pagina.on('console', (mensagem) => {
    if (mensagem.type() === 'error') problemas.push(`erro no console com toque: ${mensagem.text()}`);
  });
  pagina.on('pageerror', (erro) => problemas.push(`exceção na página com toque: ${erro.message}`));
  await pagina.addInitScript(() => {
    delete Navigator.prototype.wakeLock;
  });
  try {
    await pagina.goto(url);
    await pagina.waitForFunction((cena) => window.kiwirun?.jogo?.scene.isActive(cena), CENA_TELA_INICIAL, { timeout: LIMITE_MS });
    const textos = await textosDaTelaInicial(pagina);
    for (const chave of ['tela_inicial.toque', 'tela_inicial.link']) {
      const esperado = criarTextos().t(chave);
      if (!textos.includes(esperado)) problemas.push(`com toque, a Tela inicial não mostrou "${esperado}"`);
    }
    await pagina.waitForTimeout(ESPERA_BLOQUEIO_MS);
    await pagina.keyboard.press('Enter');
    await pagina.waitForFunction((cena) => window.kiwirun.jogo.scene.isActive(cena), CENA_MENU, { timeout: LIMITE_MS });
  } catch (erro) {
    problemas.push(`com toque, o jogo não seguiu da Tela inicial ao Menu: ${erro.message}`);
  } finally {
    await contexto.close();
  }
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
  // O headless não destrava o áudio com o input simulado: sem isto, o som nunca roda e o mute
  // do Phaser não chega a valer.
  const navegador = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 720 } });

  // Conta os pedidos de Wake Lock; a recusa do headless não pode virar erro no console.
  await pagina.addInitScript(() => {
    window.kiwirunPedidosTrava = 0;
    const trava = navigator.wakeLock;
    if (!trava) return;
    const pedir = trava.request.bind(trava);
    trava.request = (tipo) => {
      window.kiwirunPedidosTrava += 1;
      return pedir(tipo);
    };
  });

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
    if (tela.textos.includes(textos.t('tela_inicial.toque'))) problemas.push('no desktop, a Tela inicial mostrou o aviso de toque');
    if ((await pagina.evaluate(() => window.kiwirunPedidosTrava)) < 1) problemas.push('o jogo não pediu a Wake Lock');
  } catch (erro) {
    problemas.push(`Tela inicial não abriu: ${erro.message}`);
    await navegador.close();
    return problemas;
  }

  try {
    problemas.push(...await verificarIdioma(pagina));
    problemas.push(...await verificarMenu(pagina));
    problemas.push(...await verificarCreditos(pagina));
    await espiarEfeitos(pagina);
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
    problemas.push(...await verificarPausaAntesDoInput(pagina));
    problemas.push(...await verificarItensECheckpoints(pagina));
    problemas.push(...await verificarPausaAndando(pagina));
    problemas.push(...await verificarPlacar(pagina));
    problemas.push(...await verificarEfeitos(pagina, ['coletar', 'capturar', 'samambaia']));
    problemas.push(...await verificarRecorde(pagina));
    problemas.push(...await verificarReiniciar(pagina));
    problemas.push(...await verificarVolta(pagina));
    problemas.push(...await verificarSilencio(pagina));
    problemas.push(...await verificarMusica(pagina));
    problemas.push(...await verificarToque(navegador, url));
    problemas.push(...await verificarPorto(navegador, url));
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
console.log('Smoke ok: Tela inicial, seletor PT | EN, Menu, Créditos e Pecuária abertos, HUD, Itens, Samambaias-prateadas, Fatos, Checkpoint, Predadores, Placas, Ovelhas, Iniciais, Placar, Recorde (recarregar e zerar), Pausa, bloqueio de entrada, Volta por inatividade, efeitos sonoros, Silêncio, música, aviso de toque, Wake Lock e o Porto (guindastes e esteiras) funcionando, sem erro no console nem requisição fora da origem.');
