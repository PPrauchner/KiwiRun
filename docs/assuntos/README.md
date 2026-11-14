# Assuntos

Cada integrante do grupo cuida de um **Assunto** da apresentação sobre a Nova
Zelândia (Geografia, Culinária, Curiosidades, História, Economia/Tecnologia, Fauna e
Flora). O material de um Assunto em Markdown, nesta pasta, é o que dá a ele um
**Mundo** no KiwiRun: as Fases, os Itens e os **Fatos** do Mundo saem daqui, e todo
Fato do jogo é validado contra este material antes de entrar.

Termos (Assunto, Mundo, Fase, Fato, Samambaia-prateada) no [`CONTEXT.md`](../../CONTEXT.md).

## O que entregar

Um arquivo `docs/assuntos/<assunto>.md`, em minúsculas e com hífens
(`economia-tecnologia.md`, `fauna-e-flora.md`), com:

1. **Tema**: o que o Assunto apresenta, como você vai falar na apresentação. Pode
   ser um relatório longo; é a referência contra a qual os Fatos são conferidos.
2. **Fatos candidatos**: frases curtas e verdadeiras sobre a NZ, ligadas ao
   Assunto. Mais candidatos do que o jogo usa (o Mundo usa 3 por Fase), para haver
   escolha. Cada um com:
   - no máximo **90 caracteres** (cabe em 2 linhas no topo da tela);
   - a **fonte** (Stats NZ, MPI, Te Ara, site oficial…); sem fonte, não entra;
   - se der, a versão em **inglês** (o jogo é PT/EN; quem não traduzir recebe a
     tradução para revisar).
3. **O que ecoa na apresentação**: quais Fatos você fala em voz alta. O jogo
   reforça a apresentação quando alguns Fatos repetem o que o público ouviu, e nunca
   pode contradizê-la.
4. **Ideias de Fase** (opcional): lugares, objetos ou cenas do Assunto que dariam um
   percurso curto e Itens para coletar (ex.: Pecuária → lã; Porto → contêineres).

Não precisa de slide, imagem nem arte: o jogo gera a própria arte por script.

## Modelo

```markdown
# <Assunto>

## Tema

<o conteúdo do Assunto, como será apresentado>

## Fatos candidatos

| # | Fato (PT, ≤ 90 caracteres) | Fato (EN, opcional) | Fonte | Ecoa |
|---|---|---|---|---|
| 1 | A Nova Zelândia tem ... | New Zealand has ... | Te Ara, <página> | sim |

## Ideias de Fase (opcional)

- <cenário> — Itens: <o que coletar>
```

## Exemplo

[`economia-tecnologia.md`](economia-tecnologia.md): o Assunto do autor, com os
Fatos candidatos das Fases Pecuária, Porto e Foguete na seção 10. É um exemplo de
conteúdo, não de formato: foi escrito antes do Modelo, não usa as seções `## Tema` e
`## Fatos candidatos` e a tabela dele tem a coluna "Seção" no lugar da coluna EN.
Para entregar, siga o Modelo acima.
`economia-tecnologia.en.md` é o mesmo material em inglês, como referência para os
Fatos em EN.
