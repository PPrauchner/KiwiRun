# KiwiRun

Jogo de plataforma 2D em pixel art, no navegador, sobre a Nova Zelândia, com um kiwi
(a ave) como protagonista — Fases curtas para o público jogar ao lado de uma
apresentação de grupo (28/11/2026). Bilíngue (PT/EN), teclado e controle 8BitDo.

## Stack

- Phaser 3 + JavaScript, **sem etapa de build**: site estático (`index.html` + JS).
  Ver [ADR 0001](docs/adr/0001-phaser-sem-build-offline.md).
- Phaser, arte, áudio e mapas versionados no repo, sem CDN — roda 100% offline.
- Publicação: GitHub Pages a cada push na `main`. Local: `jogar.bat` (servidor +
  navegador em tela cheia).
- Mapas de Fase no formato Tiled (`.tmj`), gerados por script; arte Kenney Pixel
  Platformer (CC0, 18×18) + sprites próprios gerados por script.

## Comandos

- Setup: `npm ci`
- Testes: `npm test` — lógica em Node (`node:test`) + validador de Fases.
- Smoke no navegador: `npm run smoke` — Playwright (Chromium). Precisa de
  `npx playwright install chromium` depois do `npm ci`; o hook de commit roda só
  `npm test`, então o smoke não é checado automaticamente.
- Branches: o trunk é `dev` (base dos PRs e das integrações), não a default `main`
  que o `gh` informa; `main` recebe `dev` quando o autor decide publicar.

## Armadilhas conhecidas

- **Áudio no smoke**: o Chromium headless não inicia áudio a partir de input
  simulado (precisa de `--autoplay-policy=no-user-gesture-required`), e o Chrome só
  atualiza o `.value` do ganho de mute do Phaser com um som tocando — toque um som
  antes de ler `sound.mute`.
- **Toque no smoke**: no Playwright, `hasTouch: true` sozinho já torna
  `(any-pointer: fine)` falso; basta para emular aparelho de toque.
- **Plataforma móvel no Arcade**: `physics.add.group` zera o `friction.x` dos corpos,
  então uma plataforma imóvel que anda não carrega quem está em cima sem
  `body.setFrictionX(1)`.
- **Fins de linha**: há arquivos CRLF na árvore de trabalho com LF no índice
  (`catalogo.js`, `fase.js`, `smoke.js`, `main.js`…). Substituição por script que
  supõe `\n` não casa e falha calada.

## Documentação

- Glossário de domínio: [`CONTEXT.md`](CONTEXT.md) — use os termos dele (Fase, não
  "level"; Kiwi é a ave, Kiwifruta é a fruta).
- Decisões: [`docs/adr/`](docs/adr/). Raciocínio de design:
  [`docs/grills_logs/`](docs/grills_logs/).
- Escopo e requisitos: issue #1 (PRD).

## Agent skills

### Issue tracker

Issues e PRDs vivem no GitHub Issues de `PPrauchner/KiwiRun`. See `docs/agents/issue-tracker.md`.

### Triage labels

Vocabulário padrão (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: um `CONTEXT.md` e `docs/adr/` na raiz. See `docs/agents/domain.md`.
