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
- Smoke no navegador: Playwright (Chromium).

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
