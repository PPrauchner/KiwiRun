# Grill — adoção do repositório

Início: 2026-11-14

O repositório ainda não tinha código: só o glossário (`CONTEXT.md`), o log de design
(`docs/grills_logs/kiwirun-design.md`) e o PRD (issue #1). As restrições abaixo foram
tiradas desses três e confirmadas pelo autor.

**P:** Sem `package.json` ainda, como se roda a suíte e como se instala o ambiente?
**R:** `npm test` para a suíte e `npm ci` para o setup. A primeira fatia cria o
`package.json` com `node:test` e o Playwright como dependência de desenvolvimento.

**P:** Quais são as camadas do projeto e quando uma mudança fica grande demais?
**R:** Quatro camadas: lógica pura, cenas Phaser, conteúdo e assets/scripts
geradores. Uma issue que toca 3 ou mais camadas vira plano de sub-tarefas.

**P:** Como organizar os logs de grill?
**R:** Uma pasta por unidade, mais `transversal/` e `negocio/`, com um README só de
regras. O log de design que já existia fica onde está.

**P:** Registrar um ADR retroativo para "Phaser sem build, tudo versionado, sem CDN"?
**R:** Sim — ADR 0001.

**P:** Onde vivem as issues?
**R:** No GitHub Issues de `PPrauchner/KiwiRun`, com o vocabulário de rótulos padrão
e um único contexto de domínio.

## Restrições decididas

- Test command: `npm test`
- Setup command: `npm ci`
- Phaser 3 + JavaScript sem etapa de build; sem bundler, transpilador ou TypeScript (ADR 0001).
- 100% offline: Phaser, arte, áudio e mapas versionados; nenhuma CDN e nenhuma rede em tempo de execução.
- Sem backend: Recorde e idioma só no `localStorage`.
- Publicação no GitHub Pages a cada push na `main`; uso local por `jogar.bat`.
- Arte e áudio de terceiros só CC0 (Kenney Pixel Platformer, 18×18); sprites próprios gerados por script na mesma grade e paleta; nada de arte gerada por IA nem feita por artista.
- Mapas de Fase em `.tmj` do Tiled, gerados por script; editar no Tiled continua opcional.
- Todo texto visível no arquivo de textos de cada idioma; PT e EN com as mesmas chaves; PT é o padrão.
- Lógica separada do Phaser e testável em Node (`node:test`); smoke com Playwright (Chromium).
- Um Mundo novo entra só com dados.
- Alvo: Chrome/Edge recentes no desktop, 16:9, pixel art sem suavização; sem celular.
- Prazo 28/11/2026; ordem de entrega Pecuária → Porto → Foguete, cada Fase completa antes da próxima.
- Todo Fato com fonte, validado pelo autor antes de entrar.

## Calibragem decidida

- Quebra de trabalho: a unidade é a camada; uma issue que toca 3 ou mais camadas vira plano de sub-tarefas.
- Camadas: (1) lógica pura — Input, Textos, Placar, Recorde, Catálogo de Mundos, Validador de Fase, sem Phaser; (2) cenas Phaser; (3) conteúdo — mapas, catálogo, textos PT/EN, Fatos; (4) assets e scripts geradores.
