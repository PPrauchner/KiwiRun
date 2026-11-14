# 0001 — Phaser 3 sem build, com tudo versionado e sem CDN

Data: 2026-11-14 · Status: aceito

## Contexto

O jogo roda num notebook ao lado de uma apresentação de grupo (28/11/2026), num local
cujo Wi-Fi não é confiável, e também fica publicado no GitHub Pages. O prazo é de 14
dias e só uma pessoa desenvolve.

## Decisão

Phaser 3 com JavaScript puro, **sem etapa de build**: o jogo é um site estático
(`index.html` + módulos JS). O Phaser, a arte, o áudio e os mapas ficam versionados
no repositório; nada é carregado de CDN. No notebook, o jogo sobe por um lançador
(`jogar.bat`) com servidor estático local e navegador em tela cheia.

## Consequências

- Roda 100% offline; o que está no repositório é exatamente o que vai ao ar no Pages.
- Sem bundler: nada de TypeScript, de imports de pacotes npm no código do jogo nem de
  minificação. O `npm` serve só às ferramentas de desenvolvimento (testes, Playwright,
  scripts geradores).
- O repositório cresce com binários (Phaser, PNG, áudio). Aceitável no tamanho deste
  jogo.
- Abrir o `index.html` direto do disco não funciona (os assets não carregam via
  `file://`), daí o lançador.
- A alternativa rejeitada, um bundler com CDN, daria mais conforto de desenvolvimento,
  mas criaria um passo de build a manter e uma dependência de rede no dia do evento.
