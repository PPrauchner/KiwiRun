/**
 * @file Validador de Fase: confere um mapa Tiled carregado contra o catálogo e os Textos,
 * sem Phaser, e devolve a lista de problemas (vazia quando a Fase está boa).
 *
 * Objetos da Fase: `inicio`, `fim`, `item` (id do Item no tipo), `samambaia` (chave do Fato
 * no tipo), `predador` (espécie no tipo), `placa` (chave do texto no tipo, ação na
 * propriedade `acao`) e `ovelha`. Vãos e degraus não são conferidos aqui: quem os
 * recusa é o gerador de Fase.
 */

import { chaveNomePredador } from './catalogo.js';
import { acaoDaPlaca, BOTOES_DA_ACAO } from './placa.js';

/**
 * @typedef {Object} Problema
 * @property {string} regra - Código curto da regra violada.
 * @property {string} mensagem - O problema, para ler no terminal.
 */

const SAMAMBAIAS_POR_FASE = 3;

/**
 * Os valores que aparecem mais de uma vez na lista.
 *
 * @param {string[]} valores - A lista.
 * @returns {string[]} Cada valor repetido, uma vez.
 */
function repetidas(valores) {
  return [...new Set(valores.filter((valor, indice) => valores.indexOf(valor) !== indice))];
}

/** A camada de objetos que a cena da Fase lê; objetos de outras camadas não entram na Fase. */
const CAMADA_OBJETOS = 'objetos';

/**
 * Valida o mapa de uma Fase.
 *
 * @param {import('./catalogo.js').Fase} fase - A Fase, como está no catálogo.
 * @param {object} mapa - O `.tmj` carregado (formato Tiled JSON).
 * @param {{ dicionarios: Record<string, Record<string, string>>, predadores: readonly string[] }} contexto
 *   - Os Textos por idioma e as espécies de Predador do catálogo.
 * @returns {Problema[]} Os problemas da Fase.
 */
export function validarFase(fase, mapa, contexto) {
  const problemas = [];
  const problema = (regra, mensagem) => problemas.push({ regra, mensagem });
  const camadaObjetos = mapa.layers.find((camada) => camada.type === 'objectgroup' && camada.name === CAMADA_OBJETOS);
  if (!camadaObjetos) problema('camada-objetos', `mapa sem a camada de objetos \`${CAMADA_OBJETOS}\``);
  const objetos = camadaObjetos?.objects ?? [];
  const comNome = (nome) => objetos.filter((objeto) => objeto.name === nome);

  if (mapa.infinite) problema('infinito', 'mapa infinito; a Fase precisa de mapa finito');
  for (const tileset of mapa.tilesets) {
    if ('source' in tileset) problema('tileset-externo', `tileset externo ${tileset.source}; embuta-o no mapa`);
  }
  for (const camada of mapa.layers.filter((candidata) => candidata.type === 'tilelayer')) {
    if (camada.compression || camada.encoding === 'base64') {
      problema('compressao', `camada ${camada.name} comprimida; salve-a como CSV/array`);
    }
  }

  const larguraPx = mapa.width * mapa.tilewidth;
  const alturaPx = mapa.height * mapa.tileheight;
  for (const objeto of objetos) {
    const dentro = objeto.x >= 0 && objeto.y >= 0
      && objeto.x + (objeto.width ?? 0) <= larguraPx && objeto.y + (objeto.height ?? 0) <= alturaPx;
    if (!dentro) problema('fora-do-mapa', `objeto ${objeto.id} (${objeto.name}) fora do mapa`);
  }

  if (comNome('inicio').length === 0) problema('inicio', 'mapa sem objeto `inicio`');
  if (comNome('fim').length === 0) problema('fim', 'mapa sem objeto `fim`');

  const chavesNoMapa = comNome('samambaia').map((samambaia) => samambaia.type);
  if (chavesNoMapa.length !== SAMAMBAIAS_POR_FASE) {
    problema('samambaias', `${chavesNoMapa.length} Samambaias-prateadas no mapa; a Fase pede ${SAMAMBAIAS_POR_FASE}`);
  }
  const foraDoCatalogo = chavesNoMapa.filter((chave) => !fase.chavesFato.includes(chave));
  const semSamambaia = fase.chavesFato.filter((chave) => !chavesNoMapa.includes(chave));
  if (foraDoCatalogo.length > 0 || semSamambaia.length > 0) {
    problema('chave-fato', `chaves de Fato do mapa não coincidem com as do catálogo (fora do catálogo: ${foraDoCatalogo.join(', ') || '-'}; sem Samambaia-prateada: ${semSamambaia.join(', ') || '-'})`);
  }
  for (const chave of new Set([...repetidas(chavesNoMapa), ...repetidas(fase.chavesFato)])) {
    problema('chave-repetida', `chave de Fato ${chave} repetida`);
  }

  for (const [idioma, dicionario] of Object.entries(contexto.dicionarios)) {
    for (const chave of fase.chavesFato) {
      if (!Object.hasOwn(dicionario, chave)) problema('fato-sem-texto', `Fato ${chave} sem texto em ${idioma}`);
    }
  }

  for (const { type: item } of comNome('item')) {
    if (!fase.itens.includes(item)) problema('item', `Item ${item} fora do catálogo da Fase`);
  }
  for (const placa of comNome('placa')) {
    for (const [idioma, dicionario] of Object.entries(contexto.dicionarios)) {
      if (!Object.hasOwn(dicionario, placa.type)) problema('placa-sem-texto', `Placa ${placa.type} sem texto em ${idioma}`);
    }
    const acao = acaoDaPlaca(placa);
    if (!Object.hasOwn(BOTOES_DA_ACAO, acao ?? '')) problema('placa-acao', `Placa ${placa.type} ensina ${acao ?? 'nenhuma ação'}, sem ícone de botão`);
  }
  for (const especie of new Set(comNome('predador').map((predador) => predador.type))) {
    if (!contexto.predadores.includes(especie)) {
      problema('predador', `espécie de Predador ${especie} fora do catálogo`);
      continue;
    }
    for (const [idioma, dicionario] of Object.entries(contexto.dicionarios)) {
      if (!Object.hasOwn(dicionario, chaveNomePredador(especie))) {
        problema('predador-sem-texto', `espécie de Predador ${especie} sem nome em ${idioma}`);
      }
    }
  }

  return problemas;
}

/**
 * @typedef {Problema & { fase: string }} ProblemaDaFase
 * Um problema e o id da Fase onde ele está.
 */

/**
 * Valida o mapa de cada Fase jogável do catálogo; Fase "em breve" dispensa mapa.
 *
 * @param {readonly import('./catalogo.js').Mundo[]} mundos - O catálogo de Mundos.
 * @param {(caminho: string) => object | null} carregarMapa - Carrega o `.tmj` do caminho
 *   do catálogo, ou devolve `null` se o arquivo não existe.
 * @param {{ dicionarios: Record<string, Record<string, string>>, predadores: readonly string[] }} contexto
 *   - Os Textos por idioma e as espécies de Predador do catálogo.
 * @returns {ProblemaDaFase[]} Os problemas de todas as Fases.
 */
export function validarCatalogo(mundos, carregarMapa, contexto) {
  const problemas = [];
  for (const fase of mundos.flatMap((mundo) => mundo.fases)) {
    if (fase.emBreve) continue;
    const mapa = fase.mapa ? carregarMapa(fase.mapa) : null;
    const daFase = mapa
      ? validarFase(fase, mapa, contexto)
      : [{ regra: 'sem-mapa', mensagem: `Fase jogável sem mapa (${fase.mapa ?? 'nenhum caminho no catálogo'})` }];
    problemas.push(...daFase.map((problema) => ({ fase: fase.id, ...problema })));
  }
  return problemas;
}
