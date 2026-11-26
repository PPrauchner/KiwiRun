/**
 * @file Recorde de cada Fase, sem Phaser: o menor Tempo final, em décimos, com as Iniciais
 * de quem o fez, sobre um armazenamento injetável (`localStorage` no jogo).
 *
 * O armazenamento pode estar vazio, corrompido ou indisponível: um Recorde ilegível conta
 * como ausente, e sem armazenamento os Recordes valem só enquanto a página está aberta.
 */

/** Prefixo das chaves; a versão sobe quando os descontos do Placar forem recalibrados. */
const PREFIXO = 'kiwirun:v1:recorde:';
/** As Iniciais gravadas quando a Volta por inatividade cai durante as Iniciais. */
export const INICIAIS_DA_VOLTA = '---';
const INICIAIS_VALIDAS = /^([A-Z]{0,3}|---)$/;

/**
 * @typedef {Object} Recorde
 * @property {number} segundos - O Tempo final arredondado para décimos.
 * @property {string} iniciais - As Iniciais; vazias até o Visitante gravá-las, e
 *   `INICIAIS_DA_VOLTA` se a Volta por inatividade caiu antes.
 */

/**
 * @typedef {Object} Gravado
 * @property {number} decimos - O Tempo final em décimos de segundo.
 * @property {string} iniciais - As Iniciais, possivelmente vazias.
 */

/**
 * @typedef {Object} Recordes
 * @property {(faseId: string) => Recorde | null} ler - O Recorde da Fase, se houver.
 * @property {(faseId: string, tempoFinal: number) => boolean} registrar - Grava o Tempo
 *   final se for Novo Recorde e diz se foi.
 * @property {(faseId: string, iniciais: string) => void} gravarIniciais - Põe as Iniciais
 *   no Recorde da Fase.
 * @property {() => void} zerar - Apaga os Recordes de todas as Fases.
 */

/**
 * O Tempo final como o Recorde o grava, compara e exibe.
 *
 * @param {number} segundos - O Tempo final.
 * @returns {number} O tempo arredondado para décimos.
 */
export function arredondarDecimos(segundos) {
  return Math.round(segundos * 10) / 10;
}

/**
 * @param {string | null} texto - O que estava gravado sob a chave da Fase.
 * @returns {Gravado | null} O Recorde, ou `null` se ausente ou corrompido.
 */
function interpretar(texto) {
  if (texto === null) return null;
  try {
    const { decimos, iniciais } = JSON.parse(texto) ?? {};
    const valido = Number.isInteger(decimos) && decimos >= 0 && typeof iniciais === 'string' && INICIAIS_VALIDAS.test(iniciais);
    return valido ? { decimos, iniciais } : null;
  } catch {
    return null;
  }
}

/**
 * Cria os Recordes sobre um armazenamento.
 *
 * @param {Storage | null} armazenamento - Onde os Recordes ficam; `null` se indisponível.
 * @returns {Recordes} Os Recordes.
 */
export function criarRecordes(armazenamento) {
  /** Cópia do que foi gravado nesta página, lida quando o armazenamento falha. */
  const memoria = new Map();

  /** @param {string} chave @returns {string | null} */
  function lerTexto(chave) {
    try {
      if (armazenamento) return armazenamento.getItem(chave);
    } catch {
      // Indisponível: vale a cópia em memória.
    }
    return memoria.get(chave) ?? null;
  }

  /** @param {string} faseId @param {Gravado} gravado */
  function gravar(faseId, gravado) {
    const texto = JSON.stringify(gravado);
    memoria.set(PREFIXO + faseId, texto);
    try {
      armazenamento?.setItem(PREFIXO + faseId, texto);
    } catch {
      // Indisponível ou cheio: o Recorde fica só em memória.
    }
  }

  /** @param {string} faseId @returns {Gravado | null} */
  const lerGravado = (faseId) => interpretar(lerTexto(PREFIXO + faseId));

  return {
    ler(faseId) {
      const gravado = lerGravado(faseId);
      return gravado && { segundos: gravado.decimos / 10, iniciais: gravado.iniciais };
    },
    registrar(faseId, tempoFinal) {
      const decimos = Math.round(arredondarDecimos(tempoFinal) * 10);
      const atual = lerGravado(faseId);
      if (atual && atual.decimos <= decimos) return false;
      gravar(faseId, { decimos, iniciais: '' });
      return true;
    },
    gravarIniciais(faseId, iniciais) {
      const atual = lerGravado(faseId);
      if (atual) gravar(faseId, { decimos: atual.decimos, iniciais });
    },
    zerar() {
      memoria.clear();
      try {
        if (!armazenamento) return;
        const chaves = Array.from({ length: armazenamento.length }, (_, indice) => armazenamento.key(indice));
        for (const chave of chaves) {
          if (chave?.startsWith(PREFIXO)) armazenamento.removeItem(chave);
        }
      } catch {
        // Indisponível: já não havia nada além da memória.
      }
    },
  };
}

/**
 * O Recorde como aparece no Menu: as Iniciais e o Tempo final no idioma atual, ou "—".
 *
 * @param {Recorde | null} recorde - O Recorde da Fase, se houver.
 * @param {import('./textos.js').Textos} textos - Os Textos no idioma atual.
 * @returns {string} Por exemplo `ABC 42,3 s`.
 */
export function textoRecorde(recorde, textos) {
  if (!recorde) return textos.t('menu.sem_recorde');
  return [recorde.iniciais, textos.tempo(recorde.segundos)].filter(Boolean).join(' ');
}

/** Segundos segurando Shift+Backspace na Tela inicial para zerar os Recordes. */
export const SEGUNDOS_ZERAR = 3;
const SHIFTS = Object.freeze(['ShiftLeft', 'ShiftRight']);

/**
 * @typedef {Object} AtalhoZerar
 * @property {(teclas: Set<string>, dt: number) => boolean} atualizar - Lê as teclas
 *   seguradas num quadro e diz se o atalho disparou nele.
 */

/**
 * Cria o atalho do Apresentador, só de teclado: Shift+Backspace segurados por
 * `SEGUNDOS_ZERAR` disparam uma vez; para disparar de novo, é preciso soltar.
 *
 * @returns {AtalhoZerar} O atalho.
 */
export function criarAtalhoZerar() {
  let segurado = 0;
  let disparou = false;

  return {
    atualizar(teclas, dt) {
      const segurando = teclas.has('Backspace') && SHIFTS.some((tecla) => teclas.has(tecla));
      if (!segurando) {
        segurado = 0;
        disparou = false;
        return false;
      }
      segurado += dt;
      if (disparou || segurado < SEGUNDOS_ZERAR - 1e-9) return false;
      disparou = true;
      return true;
    },
  };
}
