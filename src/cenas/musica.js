/**
 * @file Música numa cena: cada tela pede o andamento dela, e a trilha do jogo (registro
 * `trilha`) decide se a música recomeça — só quando o andamento muda. O som do Phaser é um
 * só para o jogo, então a faixa segue tocando entre as cenas e o Silêncio a corta junto com
 * os efeitos.
 */
import { andamentosDoJogo, chaveMusica } from '../logica/musica.js';

/** Abaixo dos efeitos, que precisam se destacar sobre a música. */
const VOLUME_MUSICA = 0.5;

/**
 * Toca o tema no andamento da cena, em loop, se ele ainda não está tocando.
 *
 * @param {Phaser.Scene} cena - A cena que abre, com o registro `trilha` do jogo.
 * @param {number} andamento - O andamento da cena, em batidas por minuto.
 */
export function tocarMusica(cena, andamento) {
  if (!cena.registry.get('trilha').tocar(andamento)) return;
  for (const outro of andamentosDoJogo()) cena.sound.get(chaveMusica(outro))?.stop();
  const chave = chaveMusica(andamento);
  const faixa = cena.sound.get(chave) ?? cena.sound.add(chave, { loop: true, volume: VOLUME_MUSICA });
  faixa.play();
}
