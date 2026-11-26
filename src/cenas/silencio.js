/**
 * @file Silêncio numa cena: M ou Select (a ação `silenciar` do Input) ligam e desligam todo
 * som do jogo, e enquanto ele estiver ligado o ícone de som cortado aparece no canto inferior
 * esquerdo. O estado vem do registro `silencio` do jogo, persistido no `localStorage`.
 *
 * O som do Phaser é um só para o jogo: silenciar numa cena silencia todas. O ícone de cada
 * cena aberta acompanha a troca, inclusive o da Fase congelada sob a Pausa.
 */
import { TEXTURA_SILENCIO } from './preload.js';

const MARGEM = 6;
/** Acima de tudo que as cenas desenham, HUD da Fase incluído. */
const PROFUNDIDADE_ICONE = 1000;
/** Evento do jogo emitido quando o Silêncio muda, para o ícone de toda cena aberta. */
const EVENTO_SILENCIO = 'kiwirun-silencio';

/**
 * Aplica ao som do jogo o estado gravado do Silêncio; chamado uma vez, no Preload.
 *
 * @param {Phaser.Scene} cena - Qualquer cena, com o registro `silencio` do jogo.
 */
export function aplicarSilencio(cena) {
  cena.sound.mute = cena.registry.get('silencio').ligado;
}

/**
 * @typedef {Object} ControleSilencio
 * @property {(acoes: import('../logica/input.js').Acoes) => void} atualizar - Alterna o
 *   Silêncio se `silenciar` foi apertado no quadro.
 */

/**
 * Põe o ícone do Silêncio na cena e devolve o que a cena chama a cada quadro.
 *
 * @param {Phaser.Scene} cena - A cena, com o registro `silencio` do jogo.
 * @returns {ControleSilencio} O controle do Silêncio da cena.
 */
export function criarControleSilencio(cena) {
  const silencio = cena.registry.get('silencio');
  const icone = cena.add.image(MARGEM, cena.scale.height - MARGEM, TEXTURA_SILENCIO)
    .setOrigin(0, 1)
    .setScrollFactor(0)
    .setDepth(PROFUNDIDADE_ICONE);
  const mostrar = () => icone.setVisible(silencio.ligado);
  mostrar();
  cena.game.events.on(EVENTO_SILENCIO, mostrar);
  cena.events.once(Phaser.Scenes.Events.SHUTDOWN, () => cena.game.events.off(EVENTO_SILENCIO, mostrar));

  return {
    atualizar({ silenciar }) {
      if (!silenciar) return;
      cena.sound.mute = silencio.alternar();
      cena.game.events.emit(EVENTO_SILENCIO);
    },
  };
}
