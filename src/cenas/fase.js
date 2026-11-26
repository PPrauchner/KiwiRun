/**
 * @file Cena Fase genérica: monta qualquer Fase a partir do seu mapa `.tmj` e do Catálogo.
 *
 * O Kiwi anda e pula (física Arcade em passo fixo de 60/s); a borda inferior do mapa é
 * Zona de queda e devolve o Kiwi ao último Checkpoint por que passou (o início é o
 * primeiro), mantendo os Itens, as Samambaias-prateadas e os Fatos já encontrados; tocar o
 * fim vence a Fase e abre o Placar, com os Itens por tipo e as Capturas por espécie. Até o
 * primeiro mover ou pular, a Fase
 * e o cronômetro ficam parados. O HUD mostra o Tempo gasto, os Itens em "X/Y" e as
 * Samambaias-prateadas em "X/3"; pegar uma põe o seu Fato na Fila de Fatos, mostrada no topo
 * da tela sem pausar o jogo. Os Predadores patrulham entre as pontas da sua área no mapa:
 * cair sobre um é Captura (armadilha, quique e o nome da espécie flutuando); qualquer outro
 * contato devolve o Kiwi ao Checkpoint, onde ele fica invulnerável, piscando, por ~1 s. Os
 * controles vêm do Input unificado, que ignora a entrada nos primeiros ~0,5 s da Fase.
 *
 * Start ou Esc, a janela perder o foco (Alt+Tab, notificação) ou um controle desconectar
 * abrem a Pausa por cima e pausam esta cena: o jogo, o cronômetro e a Fila de Fatos param
 * com ela. Antes do primeiro input, continuar devolve a Fase ainda congelada.
 */
import { buscarFase, chaveNomePredador, imagemItem } from '../logica/catalogo.js';
import { resolverContato, SEGUNDOS_INVULNERAVEL, SEGUNDOS_ROTULO_CAPTURA } from '../logica/captura.js';
import { criarControlePulo } from '../logica/controle-pulo.js';
import { criarCronometro } from '../logica/cronometro.js';
import { criarFilaDeFatos, LARGURA_FATO } from '../logica/fila-fatos.js';
import { criarInput } from '../logica/input.js';
import { calcularPlacarDaTentativa } from '../logica/placar.js';
import { FISICA, TILE } from '../logica/pulo.js';
import { FONTE, TEXTURA_KIWI, TEXTURA_QUADROS_TILESET, TEXTURA_SAMAMBAIA, TEXTURA_TILESET, texturaPredador } from './preload.js';
import { lerEntrada } from './entrada.js';
import { criarVigiaInatividade } from './inatividade.js';

/** Tamanho da hitbox do Kiwi, menor que o sprite de 18×18, e seu deslocamento nele. */
const HITBOX = Object.freeze({ largura: 10, altura: 11, x: 4, y: 7 });
/** Zona morta da câmera e quanto ela olha à frente do Kiwi, em pixels. */
const ZONA_MORTA = Object.freeze({ largura: 60, altura: 48 });
const OLHAR_A_FRENTE = 48;
const SUAVIDADE_CAMERA = 0.12;
const COR_CEU = '#5fcde4';

/** Quadros do Kenney no tileset (ids base 0): a bandeira em 2 quadros e o mastro. */
const QUADROS_BANDEIRA = Object.freeze([111, 112]);
const QUADRO_MASTRO = 131;
const QUADROS_POR_SEGUNDO_BANDEIRA = 4;
const ANIMACAO_BANDEIRA = 'bandeira';
/** Bandeira de um Checkpoint ainda não ativado: apagada e parada. */
const TINTA_INATIVO = 0x777777;

/** HUD: tamanho nativo da fonte bitmap, margem da tela e profundidade acima de tudo. */
const TAMANHO_FONTE_HUD = 12;
const MARGEM_HUD = 6;
const PROFUNDIDADE_HUD = 100;
/** Faixa escura atrás do Fato, para ler sobre o céu: folga em volta do texto e opacidade. */
const FOLGA_FATO = 4;
const COR_FUNDO_FATO = 0x1b2a3a;
const OPACIDADE_FUNDO_FATO = 0.8;

/** Predador: hitbox no sprite de 18×18 e velocidade da patrulha, em pixels por segundo. */
const HITBOX_PREDADOR = Object.freeze({ largura: 14, altura: 10, x: 2, y: 8 });
const VELOCIDADE_PREDADOR = 30;
/** Armadilha da Captura: a caixa que desce sobre o Predador, e quanto o rótulo sobe. */
const COR_ARMADILHA = 0x8f563b;
const COR_BORDA_ARMADILHA = 0x45283c;
const SUBIDA_ROTULO = 10;
/** Piscar do Kiwi invulnerável: trocas por segundo e opacidade na fase apagada. */
const PISCADAS_POR_SEGUNDO = 10;
const OPACIDADE_PISCANDO = 0.3;

/**
 * Diz se um tile é atravessável por baixo, lendo a propriedade `umaMao` do tileset
 * no formato do Phaser ou no do Tiled (lista de `{ name, value }`).
 *
 * @param {Phaser.Tilemaps.Tile} tile - O tile da camada de colisão.
 * @returns {boolean} Se o tile é uma plataforma de mão única.
 */
function ehUmaMao(tile) {
  const propriedades = tile.properties;
  if (Array.isArray(propriedades)) return propriedades.some((p) => p.name === 'umaMao' && p.value === true);
  return propriedades?.umaMao === true;
}

/**
 * Conta os objetos do mapa por tipo, na ordem em que cada tipo aparece primeiro.
 *
 * @param {Phaser.Types.Tilemaps.TiledObject[]} objetos - Objetos do mapa.
 * @returns {Record<string, number>} Quantos objetos de cada tipo.
 */
function contarPorTipo(objetos) {
  const contagem = {};
  for (const { type } of objetos) contagem[type] = (contagem[type] ?? 0) + 1;
  return contagem;
}

/**
 * @param {string} item - Id do Item no catálogo.
 * @returns {string} A chave da textura do Item.
 */
function texturaItem(item) {
  return `item-${item}`;
}

export class Fase extends Phaser.Scene {
  constructor() {
    super('fase');
  }

  /** @param {{ faseId: string }} dados - A Fase a montar. */
  init({ faseId }) {
    this.fase = buscarFase(faseId);
    this.chaveMapa = `mapa-${this.fase.id}`;
    this.venceu = false;
    this.coletados = 0;
    /** @type {Record<string, number>} Itens coletados, por id do Item. */
    this.coletadosPorItem = {};
    /** @type {string[]} Chaves dos Fatos já encontrados, na ordem em que foram pegos. */
    this.fatosEncontrados = [];
    this.filaFatos = criarFilaDeFatos();
    this.capturas = 0;
    /** @type {Record<string, number>} Capturas, por espécie. */
    this.capturasPorEspecie = {};
    /** Segundos de invulnerabilidade que restam depois de voltar ao Checkpoint. */
    this.invulneravel = 0;
  }

  preload() {
    this.load.tilemapTiledJSON(this.chaveMapa, this.fase.mapa);
    for (const item of this.fase.itens) this.load.image(texturaItem(item), imagemItem(item));
  }

  create() {
    const mapa = this.make.tilemap({ key: this.chaveMapa });
    const tileset = mapa.addTilesetImage(mapa.tilesets[0].name, TEXTURA_TILESET);
    mapa.createLayer('fundo', tileset);
    const colisao = mapa.createLayer('colisao', tileset);
    const frente = mapa.createLayer('frente', tileset);
    colisao.setCollisionByExclusion([-1]);
    colisao.forEachTile((tile) => {
      if (tile.index >= 0 && ehUmaMao(tile)) tile.setCollision(false, false, true, false);
    });

    const objetos = mapa.getObjectLayer('objetos').objects;
    const inicio = objetos.find((objeto) => objeto.name === 'inicio');
    const fim = objetos.find((objeto) => objeto.name === 'fim');
    this.checkpoint = { x: inicio.x, y: inicio.y - TILE / 2 };
    this.limiteQueda = mapa.heightInPixels + TILE;

    this.physics.world.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels, true, true, true, false);
    this.kiwi = this.criarKiwi();
    frente.setDepth(this.kiwi.depth + 1);
    this.physics.add.collider(this.kiwi, colisao);

    const chegada = this.add.zone(fim.x, fim.y, fim.width, fim.height).setOrigin(0);
    this.physics.add.existing(chegada, true);
    this.physics.add.overlap(this.kiwi, chegada, () => this.vencer());

    if (!this.anims.exists(ANIMACAO_BANDEIRA)) {
      this.anims.create({
        key: ANIMACAO_BANDEIRA,
        frames: this.anims.generateFrameNumbers(TEXTURA_QUADROS_TILESET, { frames: [...QUADROS_BANDEIRA] }),
        frameRate: QUADROS_POR_SEGUNDO_BANDEIRA,
        repeat: -1,
      });
    }
    this.criarItens(objetos.filter((objeto) => objeto.name === 'item'));
    this.criarSamambaias(objetos.filter((objeto) => objeto.name === 'samambaia'));
    for (const checkpoint of objetos.filter((objeto) => objeto.name === 'checkpoint')) this.criarCheckpoint(checkpoint);
    this.criarPredadores(objetos.filter((objeto) => objeto.name === 'predador'));

    this.configurarCamera(mapa);
    this.entrada = criarInput();
    this.acoes = null;
    this.apertouPular = false;
    this.controlePulo = criarControlePulo();
    this.physics.world.on('worldstep', (dt) => this.passoDoKiwi(dt));
    this.ouvirPausa();

    // A Fase fica congelada (e o cronômetro em zero) até o primeiro mover ou pular.
    this.cronometro = criarCronometro();
    this.physics.pause();
    this.criarHud();
    this.inatividade = criarVigiaInatividade(this);
  }

  /**
   * @param {number} _tempo - Relógio do jogo, em ms (não usado).
   * @param {number} delta - Milissegundos desde o quadro anterior.
   */
  update(_tempo, delta) {
    this.acoes = this.entrada.atualizar(lerEntrada(this), delta / 1000);
    if (this.inatividade.atualizar(this.entrada.segundosSemInput)) return;
    if (this.acoes.pausar) {
      this.abrirPausa();
      return;
    }
    // O passo de física pode não rodar neste quadro: o aperto espera por ele.
    if (this.acoes.pular) this.apertouPular = true;
    if (!this.cronometro.iniciado && this.houveMoverOuPular()) {
      this.cronometro.registrarInput();
      this.physics.resume();
    }
    this.cronometro.avancar(delta / 1000);
    this.hudTempo.setText(this.registry.get('textos').tempo(this.cronometro.segundos));
    this.filaFatos.avancar(delta / 1000);
    this.mostrarFato(this.filaFatos.atual);
  }

  /**
   * Liga o que abre a Pausa além de Start/Esc, e o que a Fase faz ao sair dela: um Input
   * sem o bloqueio de ~0,5 s, que só trava o que vem segurado da Pausa.
   */
  ouvirPausa() {
    const abrir = () => this.abrirPausa();
    this.game.events.on(Phaser.Core.Events.BLUR, abrir);
    this.game.events.on(Phaser.Core.Events.HIDDEN, abrir);
    window.addEventListener('gamepaddisconnected', abrir);
    const voltar = () => {
      this.entrada = criarInput({ segundosBloqueio: 0 });
    };
    this.events.on(Phaser.Scenes.Events.RESUME, voltar);
    // Os eventos da cena sobrevivem ao reinício da Fase: cada abertura desliga os seus.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.RESUME, voltar);
      this.game.events.off(Phaser.Core.Events.BLUR, abrir);
      this.game.events.off(Phaser.Core.Events.HIDDEN, abrir);
      window.removeEventListener('gamepaddisconnected', abrir);
    });
  }

  /** Abre a Pausa por cima e congela a Fase, se ela estiver correndo e ainda não terminou. */
  abrirPausa() {
    if (this.venceu || !this.scene.isActive()) return;
    this.scene.launch('pausa', { faseId: this.fase.id });
    this.scene.pause();
  }

  /** @returns {boolean} Se o jogador está movendo ou acabou de pular. */
  houveMoverOuPular() {
    return this.apertouPular || this.acoes.horizontal !== 0;
  }

  /** @param {Phaser.Types.Tilemaps.TiledObject[]} itens - Os pontos `item` do mapa. */
  criarItens(itens) {
    this.totalItens = itens.length;
    this.totalPorItem = contarPorTipo(itens);
    const grupo = this.physics.add.staticGroup();
    for (const { x, y, type } of itens) grupo.create(x, y, texturaItem(type)).setData('item', type);
    this.physics.add.overlap(this.kiwi, grupo, (_kiwi, item) => this.coletar(item));
  }

  /** @param {Phaser.Physics.Arcade.Sprite} item - O Item que o Kiwi tocou. */
  coletar(item) {
    const tipo = item.getData('item');
    item.destroy();
    this.coletados += 1;
    this.coletadosPorItem[tipo] = (this.coletadosPorItem[tipo] ?? 0) + 1;
    this.atualizarHudItens();
  }

  /** @param {Phaser.Types.Tilemaps.TiledObject[]} samambaias - Os pontos `samambaia` do mapa. */
  criarSamambaias(samambaias) {
    this.totalSamambaias = samambaias.length;
    const grupo = this.physics.add.staticGroup();
    for (const { x, y, type } of samambaias) grupo.create(x, y, TEXTURA_SAMAMBAIA).setData('chaveFato', type);
    this.physics.add.overlap(this.kiwi, grupo, (_kiwi, samambaia) => this.pegarSamambaia(samambaia));
  }

  /** @param {Phaser.Physics.Arcade.Sprite} samambaia - A Samambaia-prateada que o Kiwi tocou. */
  pegarSamambaia(samambaia) {
    const chave = samambaia.getData('chaveFato');
    samambaia.destroy();
    this.fatosEncontrados.push(chave);
    this.filaFatos.enfileirar(chave);
    this.atualizarHudSamambaias();
  }

  /**
   * Põe cada Predador na ponta esquerda da sua área, já andando para a direita; a física
   * pausada o segura até o primeiro mover ou pular.
   *
   * @param {Phaser.Types.Tilemaps.TiledObject[]} areas - As áreas `predador` do mapa.
   */
  criarPredadores(areas) {
    this.totalPorEspecie = contarPorTipo(areas);
    this.predadores = this.physics.add.group({ allowGravity: false, immovable: true });
    for (const { x, y, width: largura, height: altura, type: especie } of areas) {
      const predador = this.predadores.create(x + TILE / 2, y + altura - TILE / 2, texturaPredador(especie));
      predador.body.setSize(HITBOX_PREDADOR.largura, HITBOX_PREDADOR.altura).setOffset(HITBOX_PREDADOR.x, HITBOX_PREDADOR.y);
      predador.setData({ especie, minX: x + TILE / 2, maxX: x + largura - TILE / 2 });
      predador.setVelocityX(VELOCIDADE_PREDADOR);
    }
    this.physics.add.overlap(this.kiwi, this.predadores, (_kiwi, predador) => this.tocarPredador(predador));
  }

  /** Vira cada Predador ao chegar a uma ponta da patrulha. */
  patrulhar() {
    for (const predador of this.predadores.getChildren()) {
      const { minX, maxX } = predador.data.values;
      if (predador.x <= minX) predador.setVelocityX(VELOCIDADE_PREDADOR);
      else if (predador.x >= maxX) predador.setVelocityX(-VELOCIDADE_PREDADOR);
      predador.setFlipX(predador.body.velocity.x < 0);
    }
  }

  /** @param {Phaser.Types.Physics.Arcade.SpriteWithDynamicBody} predador - O Predador que o Kiwi tocou. */
  tocarPredador(predador) {
    if (this.venceu || !predador.active) return;
    const { body } = this.kiwi;
    const efeito = resolverContato({
      vy: body.velocity.y,
      baseAnterior: body.prev.y + body.height,
      topoPredador: predador.body.top,
      invulneravel: this.invulneravel > 0,
    });
    if (efeito === 'captura') this.capturar(predador);
    else if (efeito === 'checkpoint') this.voltarAoCheckpoint();
  }

  /**
   * Captura: o Predador sai da Fase numa armadilha (nunca morte), o Kiwi quica e o nome da
   * espécie flutua por ~1 s no idioma atual, fora da Fila de Fatos.
   *
   * @param {Phaser.Types.Physics.Arcade.SpriteWithDynamicBody} predador - O Predador capturado.
   */
  capturar(predador) {
    const { x, y } = predador;
    const especie = predador.getData('especie');
    predador.disableBody(true, false);
    this.capturas += 1;
    this.capturasPorEspecie[especie] = (this.capturasPorEspecie[especie] ?? 0) + 1;
    this.kiwi.body.setVelocityY(this.controlePulo.quicar());

    const duracao = SEGUNDOS_ROTULO_CAPTURA * 1000;
    const armadilha = this.add.rectangle(x, y - TILE, TILE, TILE, COR_ARMADILHA).setStrokeStyle(1, COR_BORDA_ARMADILHA);
    this.tweens.add({ targets: armadilha, y, duration: duracao / 4, onComplete: () => predador.destroy() });
    this.tweens.add({ targets: armadilha, alpha: 0, delay: duracao / 2, duration: duracao / 2, onComplete: () => armadilha.destroy() });

    const nome = this.registry.get('textos').t(chaveNomePredador(especie));
    const rotulo = this.add.bitmapText(x, y - TILE, FONTE, nome, TAMANHO_FONTE_HUD).setOrigin(0.5, 1).setDepth(PROFUNDIDADE_HUD - 1);
    this.tweens.add({ targets: rotulo, y: rotulo.y - SUBIDA_ROTULO, duration: duracao, onComplete: () => rotulo.destroy() });
  }

  /**
   * Põe o mastro e a bandeira de um Checkpoint; passar por ele o ativa.
   *
   * @param {Phaser.Types.Tilemaps.TiledObject} checkpoint - O ponto `checkpoint`, no chão.
   */
  criarCheckpoint({ x, y }) {
    this.add.image(x, y - TILE / 2, TEXTURA_QUADROS_TILESET, QUADRO_MASTRO);
    const bandeira = this.add.sprite(x, y - TILE * 1.5, TEXTURA_QUADROS_TILESET, QUADROS_BANDEIRA[0]).setTint(TINTA_INATIVO);
    const zona = this.add.zone(x, y - TILE, TILE, TILE * 2);
    this.physics.add.existing(zona, true);
    const posicao = { x, y: y - TILE / 2 };
    this.physics.add.overlap(this.kiwi, zona, () => {
      if (this.checkpoint === posicao) return;
      this.checkpoint = posicao;
      bandeira.clearTint().play(ANIMACAO_BANDEIRA);
    });
  }

  /** Tempo gasto à esquerda; à direita, "X/Y" e o ícone do primeiro Item da Fase. */
  criarHud() {
    const { width: largura } = this.scale;
    const fixo = (objeto) => objeto.setScrollFactor(0).setDepth(PROFUNDIDADE_HUD);
    this.hudTempo = fixo(this.add.bitmapText(MARGEM_HUD, MARGEM_HUD, FONTE, this.registry.get('textos').tempo(0), TAMANHO_FONTE_HUD));
    const [primeiroItem] = this.fase.itens;
    const larguraIcone = primeiroItem ? TILE + MARGEM_HUD / 2 : 0;
    if (primeiroItem) {
      fixo(this.add.image(largura - MARGEM_HUD, MARGEM_HUD + TAMANHO_FONTE_HUD / 2, texturaItem(primeiroItem)).setOrigin(1, 0.5));
    }
    // Alinhado à direita: o texto cresce para a esquerda sem cobrir o ícone.
    this.hudItens = fixo(this.add.bitmapText(largura - MARGEM_HUD - larguraIcone, MARGEM_HUD, FONTE, '', TAMANHO_FONTE_HUD).setOrigin(1, 0));
    this.atualizarHudItens();

    // Logo abaixo dos Itens: as Samambaias-prateadas, com o mesmo alinhamento.
    const linhaSamambaias = MARGEM_HUD + TILE;
    fixo(this.add.image(largura - MARGEM_HUD, linhaSamambaias + TAMANHO_FONTE_HUD / 2, TEXTURA_SAMAMBAIA).setOrigin(1, 0.5));
    this.hudSamambaias = fixo(this.add.bitmapText(largura - MARGEM_HUD - TILE - MARGEM_HUD / 2, linhaSamambaias, FONTE, '', TAMANHO_FONTE_HUD).setOrigin(1, 0));
    this.atualizarHudSamambaias();

    // O Fato da vez, centrado no topo, quebrado em até 2 linhas sobre uma faixa escura.
    this.fundoFato = fixo(this.add.rectangle(largura / 2, MARGEM_HUD - FOLGA_FATO, 0, 0, COR_FUNDO_FATO, OPACIDADE_FUNDO_FATO).setOrigin(0.5, 0));
    this.hudFato = fixo(this.add.bitmapText(largura / 2, MARGEM_HUD, FONTE, '', TAMANHO_FONTE_HUD).setOrigin(0.5, 0).setCenterAlign().setMaxWidth(LARGURA_FATO));
    this.chaveFatoNaTela = null;
    this.mostrarFato(null);
  }

  atualizarHudItens() {
    this.hudItens.setText(`${this.coletados}/${this.totalItens}`);
  }

  atualizarHudSamambaias() {
    this.hudSamambaias.setText(`${this.fatosEncontrados.length}/${this.totalSamambaias}`);
  }

  /** @param {string | null} chave - O Fato a mostrar no topo, ou `null` para nenhum. */
  mostrarFato(chave) {
    if (chave === this.chaveFatoNaTela) return;
    this.chaveFatoNaTela = chave;
    const visivel = chave !== null;
    this.hudFato.setText(visivel ? this.registry.get('textos').t(chave) : '').setVisible(visivel);
    const { width: largura, height: altura } = this.hudFato.getTextBounds().global;
    this.fundoFato.setSize(largura + FOLGA_FATO * 2, altura + FOLGA_FATO * 2).setVisible(visivel);
  }

  /** @returns {Phaser.Types.Physics.Arcade.SpriteWithDynamicBody} O Kiwi no Checkpoint. */
  criarKiwi() {
    const kiwi = this.physics.add.sprite(this.checkpoint.x, this.checkpoint.y, TEXTURA_KIWI, 0);
    kiwi.body.setSize(HITBOX.largura, HITBOX.altura).setOffset(HITBOX.x, HITBOX.y);
    kiwi.setCollideWorldBounds(true);
    return kiwi;
  }

  /** @param {Phaser.Tilemaps.Tilemap} mapa - O mapa, cujos limites prendem a câmera. */
  configurarCamera(mapa) {
    const camera = this.cameras.main;
    camera.setBackgroundColor(COR_CEU);
    camera.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels);
    camera.startFollow(this.kiwi, true, SUAVIDADE_CAMERA, SUAVIDADE_CAMERA);
    camera.setDeadzone(ZONA_MORTA.largura, ZONA_MORTA.altura);
    camera.setFollowOffset(-OLHAR_A_FRENTE, 0);
  }

  /**
   * Um passo fixo de física: andar, pular e a Zona de queda.
   *
   * @param {number} dt - Segundos do passo.
   */
  passoDoKiwi(dt) {
    if (this.venceu || !this.acoes) return;
    this.patrulhar();
    this.piscarInvulneravel(dt);
    const direcao = this.acoes.horizontal;
    const { body } = this.kiwi;

    body.setVelocityX(direcao * FISICA.velocidadeAndar);
    body.setVelocityY(this.controlePulo.atualizar({
      dt,
      noChao: body.blocked.down,
      apertou: this.apertouPular,
      segurando: this.acoes.segurandoPulo,
      vy: body.velocity.y,
    }));
    this.apertouPular = false;

    if (direcao !== 0) {
      this.kiwi.setFlipX(direcao < 0);
      this.cameras.main.setFollowOffset(-OLHAR_A_FRENTE * direcao, 0);
    }
    this.animar(direcao, body.blocked.down);

    if (this.kiwi.y > this.limiteQueda) this.voltarAoCheckpoint();
  }

  /**
   * @param {number} direcao - -1, 0 ou 1.
   * @param {boolean} noChao - Se o Kiwi está apoiado.
   */
  animar(direcao, noChao) {
    if (!noChao) this.kiwi.anims.stop().setFrame(3);
    else if (direcao === 0) this.kiwi.anims.stop().setFrame(0);
    else this.kiwi.anims.play('kiwi-andar', true);
  }

  /** Devolve o Kiwi ao último Checkpoint, invulnerável por ~1 s. */
  voltarAoCheckpoint() {
    this.kiwi.body.reset(this.checkpoint.x, this.checkpoint.y);
    this.invulneravel = SEGUNDOS_INVULNERAVEL;
  }

  /** @param {number} dt - Segundos do passo. */
  piscarInvulneravel(dt) {
    this.invulneravel = Math.max(0, this.invulneravel - dt);
    const apagado = this.invulneravel > 0 && Math.floor(this.invulneravel * PISCADAS_POR_SEGUNDO) % 2 === 1;
    this.kiwi.setAlpha(apagado ? OPACIDADE_PISCANDO : 1);
  }

  /** Grava o Recorde assim que a Fase termina; um Novo Recorde passa pelas Iniciais. */
  vencer() {
    if (this.venceu) return;
    this.venceu = true;
    this.cronometro.parar();
    const resultado = this.resultado();
    const { tempoFinal } = calcularPlacarDaTentativa(resultado);
    const novoRecorde = this.registry.get('recordes').registrar(resultado.faseId, tempoFinal);
    this.scene.start(novoRecorde ? 'iniciais' : 'placar', { ...resultado, novoRecorde });
  }

  /** @returns {import('../logica/placar.js').Tentativa} O que a tentativa fez, para o Placar. */
  resultado() {
    return {
      faseId: this.fase.id,
      tempoGasto: this.cronometro.segundos,
      itens: Object.entries(this.totalPorItem).map(([item, total]) => ({ item, coletados: this.coletadosPorItem[item] ?? 0, total })),
      capturas: Object.keys(this.totalPorEspecie).map((especie) => ({ especie, quantidade: this.capturasPorEspecie[especie] ?? 0 })),
      fatosEncontrados: [...this.fatosEncontrados],
    };
  }
}
