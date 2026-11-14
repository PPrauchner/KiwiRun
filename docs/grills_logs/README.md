# Logs de grill

Registro das sessões de perguntas e respostas que decidiram o design do projeto.

## Onde gravar

- Uma pasta por unidade do projeto: as camadas (lógica pura, cenas, conteúdo, assets
  e scripts geradores) ou um Mundo/Fase, quando o grill for sobre conteúdo de jogo.
- `transversal/`: o que toca mais de uma unidade ou é manutenção do repositório.
- `negocio/`: divulgação, apresentação, público.
- A pasta nasce com o primeiro grill da unidade; não há lista fechada.

## Releases

Logo abaixo do título de cada log, uma linha `Releases: vX.Y.Z, ...` lista as
releases que entregaram o que o grill decidiu. Sem essa linha, a decisão ainda não
saiu.

## O log não é fonte da verdade

Na mesma pasta, vale o log mais recente. O que vale hoje está no código, nos ADRs
(`docs/adr/`) e no `CONTEXT.md`.
