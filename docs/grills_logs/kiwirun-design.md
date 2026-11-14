# Grill — design do KiwiRun

Início: 2026-11-14 15:24

Jogo de plataforma 2D temático da Nova Zelândia, protagonista kiwi (a ave), PT/EN,
compatível com controle 8BitDo, para rodar num notebook ao lado de uma apresentação.

**P:** Com que tecnologia o jogo vai ser feito (Phaser 3, Canvas puro ou Godot web)?
**R:** Phaser 3 — sem build, index.html + JS; localmente roda com servidor simples ou pelo github.io.

**P:** Como economia, pecuária e foguete entram no jogo?
**R:** Uma fase por tema, jogável isoladamente pelo menu. Deve ficar aberto para, depois, outros integrantes do grupo ganharem fases com seus assuntos: Geografia, Culinária, Curiosidades, História, Economia/Tecnologia e Fauna e Flora. O assunto do autor é Economia/Tecnologia.

**P:** Onde ficam as 3 fases em relação aos assuntos do grupo?
**R:** Cada assunto do grupo é um Mundo no menu, com uma ou mais fases. Agora só existe o Mundo Economia/Tecnologia, com 3 fases: Pecuária, Porto (exportação) e Foguete. Os outros Mundos aparecem como "em breve".

**P:** Como se vence e como se falha numa Fase?
**R:** Vence chegando ao fim da Fase. Sem vidas nem game over: encostar num predador invasor (arminho, gambá-australiano, rato) ou cair num buraco devolve o kiwi ao último checkpoint. No fim, placar com tempo + itens coletados.

**P:** Como a Fase ensina algo sobre a Nova Zelândia, além do cenário?
**R:** Itens + Fatos curtos. Itens do tema espalhados contam no Placar (Pecuária: lã e leite; Porto: kiwifruta e caixas de exportação; Foguete: peças). 3 Samambaias-prateadas escondidas por Fase mostram, cada uma, um Fato de 1 frase no topo da tela, sem pausar. O Placar lista os Fatos encontrados.

**P:** Quais ações o Kiwi tem?
**R:** Andar + pular + pisar. Um único botão de ação (pular), pulo mais alto segurando. Pular em cima de um Predador o captura (efeito de armadilha, alusão ao Predator Free 2050). Encostar de lado volta ao Checkpoint.

**P:** Qual a "cara" de cada Fase do Mundo Economia/Tecnologia?
**R:** Um elemento novo por Fase, na ordem produzir → exportar → inovar. Pecuária: pasto com morros, ovelhas andando como plataformas móveis. Porto (Tauranga/Auckland): contêineres e guindastes que sobem e descem, esteiras. Foguete (Mahia, Rocket Lab): subida vertical pela torre de lançamento; no topo o Kiwi embarca e o foguete decola numa cena curta ("o kiwi que não voa, finalmente voa").

**P:** Como o jogo se comporta entre um jogador e o próximo, no notebook do evento?
**R:** Todas as Fases liberadas desde o início. O menor tempo de cada Fase fica salvo no navegador e aparece no menu como Recorde. Após ~60 s sem input, volta sozinho à tela inicial.

**P:** A termina em 40 s com 0 Itens; B em 55 s com tudo coletado. Como o Recorde trata isso?
**R:** Itens descontam tempo: cada Item tira ~1 s e cada Samambaia-prateada ~5 s do tempo cru. O Recorde é o menor Tempo final.

**P:** Qual 8BitDo vai ser usado e como liga no notebook?
**R:** Indefinido — mapeamento à prova de modo: qualquer um dos 4 botões frontais pula; D-pad e analógico esquerdo movem; Start pausa. Teclado sempre ativo junto (setas/WASD + Espaço). Tela inicial: "aperte qualquer botão". Recomendação de ligar por USB-C no dia.

**P:** Como funciona a escolha entre português e inglês?
**R:** Abre em PT; seletor "PT | EN" na tela inicial, escolha lembrada no navegador. Todo texto (menus, Fatos, nomes de Itens) num arquivo de textos por idioma, para os colegas adicionarem Fatos sem mexer em código. Palavras Māori como tempero nos dois idiomas ("Aotearoa", "kia ora!").

**P:** De onde vem a arte?
**R:** Pixel art. Cenário genérico (chão, plataformas, céu) dos pacotes Kenney CC0. Tudo que é único da NZ (Kiwi, Predadores, ovelha, Samambaia-prateada, kiwifruta, foguete) desenhado como pixel art 32×32 no código, a partir de grades de caracteres.

**P:** Como o mapa de cada Fase é desenhado (ASCII ou Tiled)?
**R:** Tiled — prioridade é ser visualmente bonito. Só o autor desenvolve; os colegas passam o conteúdo dos seus Assuntos e as Fases novas são feitas pelo autor com o Claude.

**P:** Para ficar bonito e coeso no Tiled, qual base de arte? (E o Claude consegue fazer tudo sozinho?)
**R:** Kenney Pixel Platformer (tiles 18×18, CC0) + sprites da NZ desenhados na mesma grade e paleta, como PNG gerado por script. O Claude faz tudo sozinho: baixa o pacote (ou o autor baixa um zip, se o download automático falhar), gera os sprites e gera os mapas .tmj por script. Abrir no Tiled para enfeitar é opcional. Substitui a decisão anterior de sprites 32×32 em código.

**P:** E o som?
**R:** Efeitos + música (trilha em loop, CC0). Mantém-se um atalho para silenciar (M / Select), útil durante a fala de quem apresenta.

**P:** Quando é a apresentação, e o que é o mínimo que precisa estar pronto?
**R:** 28/11/2026 (14 dias a partir do início do grill). Ordem de entrega mantida como seguro: Pecuária completa (com menu, PT/EN, controle e Placar) → Porto → Foguete.

**P:** Como o jogo vai ser publicado e como roda no dia?
**R:** Repo público KiwiRun no GitHub do autor, publicado no GitHub Pages (possível QR code no último slide). Phaser, arte e sons versionados no repo, sem CDN, para rodar 100% offline no notebook via `jogar.bat` (servidor local + navegador em tela cheia).

**P:** Quem escreve os 9 Fatos (3 por Fase) e como garantir que estão certos?
**R:** O Claude pesquisa e redige os 9 Fatos em PT e EN, cada um com fonte (Stats NZ, MPI, Rocket Lab, Te Ara). O autor valida contra os slides antes de entrarem no jogo; idealmente alguns Fatos ecoam a apresentação.

## Defaults assumidos sem pergunta (contestáveis)

- Resolução interna 16:9 em pixel art, escalada sem borrar, em tela cheia.
- Pausa (Start/Esc): continuar, reiniciar Fase, voltar ao menu.
- Valores de desconto do Tempo final (~1 s por Item, ~5 s por Samambaia-prateada) e duração de cada Fase calibrados em playtest.
- Mundos dos outros Assuntos aparecem no menu como "em breve".

## Sessão — /tp (PRD)

**P:** Em quais pontos o jogo vai ser testado automaticamente?
**R:** Lógica pura em Node (Tempo final/Placar, Recorde, tradução de input em ações, paridade de chaves PT/EN) + validador de mapas de Fase + smoke no navegador com Playwright (abre, menu, Pecuária carrega, sem erros no console).

**P:** Onde publicar o PRD?
**R:** Criar agora o repositório público PPrauchner/KiwiRun e abrir o PRD como issue com o rótulo ready-for-agent.
