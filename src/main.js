/**
 * @file Ponto de entrada: configura o Phaser e abre a Tela inicial.
 *
 * O Phaser vem vendorizado como script global (`vendor/phaser/`), sem etapa de build.
 */
import { criarTextos } from './logica/textos.js';
import { criarTeclado, registraTecla } from './logica/input.js';
import { criarRecordes } from './logica/recorde.js';
import { criarSilencio } from './logica/silencio.js';
import { manterTelaAcesa } from './logica/tela-acesa.js';
import { Preload } from './cenas/preload.js';
import { TelaInicial } from './cenas/tela-inicial.js';
import { Menu } from './cenas/menu.js';
import { Fase } from './cenas/fase.js';
import { Placar } from './cenas/placar.js';
import { Iniciais } from './cenas/iniciais.js';
import { Pausa } from './cenas/pausa.js';
import { Creditos } from './cenas/creditos.js';
import { FISICA } from './logica/pulo.js';

/** Resolução interna; o Phaser escala para caber na janela, com barras fora de 16:9. */
const LARGURA = 640;
const ALTURA = 360;

// Um registro de teclas para o jogo inteiro, para a tecla segurada numa troca de tela
// continuar segurada e o Input da tela nova travá-la. As teclas do jogo não rolam a página.
const teclado = criarTeclado();
window.addEventListener('keydown', (evento) => {
  if (!registraTecla(evento.code)) return;
  evento.preventDefault();
  if (!evento.repeat) teclado.apertar(evento.code);
});
window.addEventListener('keyup', (evento) => teclado.soltar(evento.code));
window.addEventListener('blur', () => teclado.soltarTudo());

/**
 * @returns {Storage | null} O `localStorage`, ou `null` se o navegador o recusar.
 */
function armazenamentoDoNavegador() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

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
    preBoot: (instancia) => {
      instancia.registry.set('textos', criarTextos());
      instancia.registry.set('teclado', teclado);
      instancia.registry.set('recordes', criarRecordes(armazenamentoDoNavegador()));
      instancia.registry.set('silencio', criarSilencio(armazenamentoDoNavegador()));
    },
  },
  // A Pausa vem depois da Fase para ser desenhada por cima dela.
  scene: [Preload, TelaInicial, Menu, Creditos, Fase, Pausa, Iniciais, Placar],
});

// A tela do notebook do evento não pode apagar no meio de uma Fase.
manterTelaAcesa(navigator, document);

// Exposto para o smoke (Playwright) inspecionar a cena ativa.
window.kiwirun = { jogo };
