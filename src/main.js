/**
 * @file Ponto de entrada: configura o Phaser e abre a Tela inicial.
 *
 * O Phaser vem vendorizado como script global (`vendor/phaser/`), sem etapa de build.
 */
import { criarTextos } from './logica/textos.js';
import { Preload } from './cenas/preload.js';
import { TelaInicial } from './cenas/tela-inicial.js';
import { Fase } from './cenas/fase.js';
import { FISICA } from './logica/pulo.js';

/** Resolução interna; o Phaser escala para caber na janela, com barras fora de 16:9. */
const LARGURA = 640;
const ALTURA = 360;

const jogo = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'jogo',
  width: LARGURA,
  height: ALTURA,
  backgroundColor: '#1b2a3a',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: FISICA.gravidade }, fps: FISICA.passosPorSegundo, fixedStep: true },
  },
  callbacks: {
    preBoot: (instancia) => instancia.registry.set('textos', criarTextos()),
  },
  scene: [Preload, TelaInicial, Fase],
});

// Exposto para o smoke (Playwright) inspecionar a cena ativa.
window.kiwirun = { jogo };
