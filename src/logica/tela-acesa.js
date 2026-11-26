/**
 * @file Tela acesa, sem Phaser: pede a Screen Wake Lock para a tela não apagar no evento.
 *
 * O navegador solta a trava quando a página fica escondida, então ela é pedida de novo
 * quando a página volta a ficar visível. Onde não há suporte, ou o navegador recusa, o
 * jogo segue sem a trava e sem erro.
 */

const TIPO_TRAVA = 'screen';

/**
 * Pede a trava de tela uma vez, engolindo a falta de suporte e a recusa.
 *
 * @param {Navigator | undefined} navegador - O `navigator`.
 * @returns {Promise<void>} Resolve quando o pedido termina, concedido ou não.
 */
async function pedirTrava(navegador) {
  try {
    await navegador?.wakeLock?.request(TIPO_TRAVA);
  } catch {
    // Recusada (página escondida, sem permissão): a tela pode apagar, o jogo segue.
  }
}

/**
 * Pede a trava de tela agora e de novo a cada vez que a página volta a ficar visível.
 *
 * @param {Navigator | undefined} navegador - O `navigator`.
 * @param {Document | undefined} documento - O `document`, para ouvir a visibilidade.
 * @returns {Promise<void>} Resolve quando o primeiro pedido termina.
 */
export function manterTelaAcesa(navegador, documento) {
  if (!navegador?.wakeLock) return Promise.resolve();
  documento?.addEventListener('visibilitychange', () => {
    if (documento.visibilityState === 'visible') pedirTrava(navegador);
  });
  return pedirTrava(navegador);
}
