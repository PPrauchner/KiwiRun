/**
 * @file Cena Fase genérica: monta qualquer Fase a partir do seu mapa `.tmj` e do Catálogo.
 *
 * O Kiwi anda e pula (física Arcade em passo fixo de 60/s); a borda inferior do mapa é
 * Zona de queda e devolve o Kiwi ao Checkpoint (por ora, só o início); tocar o fim vence
 * a Fase e, por ora, volta à Tela inicial. O teclado é provisório até o Input unificado.
 */
import { buscarFase } from '../logica/catalogo.js';
import { criarControlePulo } from '../logica/controle-pulo.js';
import { FISICA, TILE } from '../logica/pulo.js';
import { TEXTURA_KIWI, TEXTURA_TILESET } from './preload.js';

/** Tamanho da hitbox do Kiwi, menor que o sprite de 18×18, e seu deslocamento nele. */
const HITBOX = Object.freeze({ largura: 10, altura: 11, x: 4, y: 7 });
/** Zona morta da câmera e quanto ela olha à frente do Kiwi, em pixels. */
const ZONA_MORTA = Object.freeze({ largura: 60, altura: 48 });
const OLHAR_A_FRENTE = 48;
const SUAVIDADE_CAMERA = 0.12;
const COR_CEU = '#5fcde4';

/** Teclas provisórias: setas/WASD para andar, Espaço, ↑ ou W para pular. */
const TECLAS = Object.freeze({
  esquerda: ['LEFT', 'A'],
  direita: ['RIGHT', 'D'],
  pular: ['SPACE', 'UP', 'W'],
});

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

export class Fase extends Phaser.Scene {
  constructor() {
    super('fase');
  }

  /** @param {{ faseId: string }} dados - A Fase a montar. */
  init({ faseId }) {
    this.fase = buscarFase(faseId);
    this.chaveMapa = `mapa-${this.fase.id}`;
    this.venceu = false;
  }

  preload() {
    this.load.tilemapTiledJSON(this.chaveMapa, this.fase.mapa);
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

    this.configurarCamera(mapa);
    this.configurarTeclado();
    this.controlePulo = criarControlePulo();
    this.physics.world.on('worldstep', (dt) => this.passoDoKiwi(dt));
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

  configurarTeclado() {
    const teclado = this.input.keyboard;
    const criar = (nomes) => nomes.map((nome) => teclado.addKey(nome));
    this.teclas = {
      esquerda: criar(TECLAS.esquerda),
      direita: criar(TECLAS.direita),
      pular: criar(TECLAS.pular),
    };
    this.apertouPular = false;
    for (const tecla of this.teclas.pular) tecla.on('down', () => { this.apertouPular = true; });
  }

  /**
   * Um passo fixo de física: andar, pular e a Zona de queda.
   *
   * @param {number} dt - Segundos do passo.
   */
  passoDoKiwi(dt) {
    if (this.venceu) return;
    const segurado = (teclas) => teclas.some((tecla) => tecla.isDown);
    const direcao = Number(segurado(this.teclas.direita)) - Number(segurado(this.teclas.esquerda));
    const { body } = this.kiwi;

    body.setVelocityX(direcao * FISICA.velocidadeAndar);
    body.setVelocityY(this.controlePulo.atualizar({
      dt,
      noChao: body.blocked.down,
      apertou: this.apertouPular,
      segurando: segurado(this.teclas.pular),
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

  voltarAoCheckpoint() {
    this.kiwi.body.reset(this.checkpoint.x, this.checkpoint.y);
  }

  vencer() {
    if (this.venceu) return;
    this.venceu = true;
    this.scene.start('tela-inicial');
  }
}
