/**
 * @file Aviso e Volta por inatividade numa cena: mostra "Ainda está aí? 10..." no centro nos
 * últimos segundos e, na hora da Volta, para todas as cenas, restaura o PT e abre a Tela
 * inicial. O Silêncio não é tocado.
 *
 * Os tempos vêm do registro `temposInatividade` quando presente (o smoke os encurta); senão
 * valem os padrões do módulo Inatividade.
 */
import { FONTE } from './preload.js';
import { avaliarInatividade } from '../logica/inatividade.js';
import { IDIOMA_PADRAO } from '../logica/textos.js';

const TAMANHO_FONTE = 12;
const COR_FUNDO = 0x1b2a3a;
const OPACIDADE_FUNDO = 0.85;
const COR_AVISO = 0xffd166;
const ALTURA_FAIXA = 48;
/** Acima de tudo que as cenas desenham, HUD da Fase incluído. */
const PROFUNDIDADE_AVISO = 1000;
const CENA_TELA_INICIAL = 'tela-inicial';

/**
 * @typedef {Object} VigiaInatividade
 * @property {(segundosSemInput: number) => boolean} atualizar - Mostra ou esconde o aviso
 *   e diz se a Volta aconteceu neste quadro (a cena não deve seguir com o quadro).
 * @property {() => void} esconder - Esconde o aviso fora do quadro (a Pausa aberta pela
 *   perda de foco), para ele não ficar congelado com a cena.
 */

/**
 * Cria o vigia da inatividade de uma cena, com o aviso escondido.
 *
 * @param {Phaser.Scene} cena - A cena que vigia, com os registros `textos` do jogo.
 * @param {{ comAviso?: boolean, aoVoltar?: () => void }} [opcoes] - `comAviso` falso na Tela
 *   inicial; `aoVoltar` roda antes da Volta (as Iniciais gravam "---").
 * @returns {VigiaInatividade} O vigia.
 */
export function criarVigiaInatividade(cena, { comAviso = true, aoVoltar } = {}) {
  const textos = cena.registry.get('textos');
  const { width: largura, height: altura } = cena.scale;
  const fixo = (objeto) => objeto.setScrollFactor(0).setDepth(PROFUNDIDADE_AVISO).setVisible(false);
  const fundo = fixo(cena.add.rectangle(largura / 2, altura / 2, largura, ALTURA_FAIXA, COR_FUNDO, OPACIDADE_FUNDO));
  const aviso = fixo(cena.add.bitmapText(largura / 2, altura / 2, FONTE, '', TAMANHO_FONTE * 2).setOrigin(0.5).setTint(COR_AVISO));

  /** Para as outras cenas (a Fase sob a Pausa), volta ao PT e abre a Tela inicial. */
  function voltar() {
    aoVoltar?.();
    textos.definirIdioma(IDIOMA_PADRAO);
    for (const outra of cena.scene.manager.getScenes(false)) {
      if (outra !== cena && (outra.sys.isActive() || outra.sys.isPaused())) cena.scene.stop(outra.scene.key);
    }
    cena.scene.start(CENA_TELA_INICIAL);
  }

  /** @param {boolean} mostrar */
  function exibir(mostrar) {
    fundo.setVisible(mostrar);
    aviso.setVisible(mostrar);
  }

  return {
    atualizar(segundosSemInput) {
      const { contagem, volta } = avaliarInatividade(segundosSemInput, cena.registry.get('temposInatividade'));
      if (volta) {
        voltar();
        return true;
      }
      const mostrar = comAviso && contagem !== null;
      if (mostrar) aviso.setText(textos.t('inatividade.aviso', { segundos: String(contagem) }));
      exibir(mostrar);
      return false;
    },
    esconder() {
      exibir(false);
    },
  };
}
