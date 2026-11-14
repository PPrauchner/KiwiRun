# Grill — lacunas de design do PRD

Início: 2026-11-14 15:54

Revisão das lacunas encontradas no PRD (issue #1) e no grill de design. Só vão a
pergunta as decisões que dependem do autor; o resto segue a sugestão do Claude e
entra no PRD ao fim da sessão (seção "Defaults assumidos").

**P:** A Captura deve valer algo no Tempo final?
**R:** Sim: ~2 s de desconto por Captura, configurável e calibrado em playtest (entre o Item, ~1 s, e a Samambaia-prateada, ~5 s). O Placar mostra também os Predadores capturados.

**P:** O idioma volta para PT quando o jogo retorna sozinho à tela inicial?
**R:** Sim. A volta por inatividade restaura o PT; dentro da sessão de um visitante (menu, Fases, Placar, Pausa) a escolha é mantida. A história 35 passa a valer por visitante, não entre visitantes.

**P:** De onde vem a música de fundo (o Kenney Pixel Platformer não traz trilha em loop)?
**R:** Chiptune gerado por script: melodia em notação no repositório, sintetizada por script num `.ogg` em loop; um tema para o Mundo, com variação de andamento por Fase. Vale o mesmo critério dos sprites gerados por script (não conta como "arte gerada por IA"). Efeitos sonoros seguem da Kenney (CC0).

**P:** Se o prazo apertar, o que sai primeiro, e quando uma Fase conta como pronta?
**R:** Ordem de corte: (1) parallax, (2) música, (3) cena de decolagem (o Foguete vai direto ao Placar), (4) comportamento distinto por espécie de Predador, (5) Porto/Foguete inteiros, pela ordem de entrega. Nunca saem: menu, PT/EN, controle e teclado, Fatos com fonte, Placar e Recorde, volta por inatividade, `jogar.bat` offline. Fase pronta = jogável de ponta a ponta com controle e teclado, passa no Validador, 3 Fatos validados pelo autor, e alguém que não conhece o jogo a termina em menos de 2 min num playtest.

## Defaults assumidos sem pergunta (contestáveis)

- **Áudio:** o `jogar.bat` abre o navegador com `--autoplay-policy=no-user-gesture-required` (botão de gamepad não libera áudio no Chrome); no GitHub Pages o áudio começa no primeiro toque de teclado ou clique.
- **Tela cheia:** o `jogar.bat` abre em modo kiosk (o Esc chega ao jogo; sair com Alt+F4). O jogo não usa a Fullscreen API, cujo Esc sai da tela cheia; no Pages, F11.
- **Lançador:** servidor estático em PowerShell embutido (nada a instalar no notebook), porta fixa e perfil de navegador dedicado e persistente, para o `localStorage` sobreviver entre aberturas.
- **Zerar Recordes:** na tela inicial, segurar Shift+Backspace ou L+R+Select por 3 s.
- **Tela inicial:** D-pad, analógico e setas alternam PT | EN; botão frontal, Start, Enter ou Espaço começam.
- **8BitDo:** mapeamento `standard` como referência; em mapeamento não-standard, botões 0–3 pulam e o D-pad também é lido por eixo (hat). Teclado (Esc, M) sempre cobre pausa e silêncio. Teste manual nos modos do controle antes do evento; recomendação USB-C em modo XInput.
- **Fonte:** bitmap pixel CC0 com acentos do português e o mácron do māori (ā); um teste falha se algum caractere dos textos não existir na fonte.
- **Cronômetro:** começa no primeiro input na Fase, para na Pausa e ao tocar o fim, zera em "reiniciar Fase". O HUD mostra o tempo gasto; o Placar mostra tempo gasto, descontos e Tempo final.
- **Checkpoint:** ativa ao passar por ele (retorno visual); o início é o primeiro Checkpoint. Ao voltar, Itens, Samambaias-prateadas e Capturas já feitos continuam valendo; Predador capturado não volta; ~1 s de invulnerabilidade piscando.
- **Tempo final:** exibido com décimos; empate não substitui o Recorde ("Novo Recorde" só se estritamente menor); limite em zero mantido; quantidade de Itens por Fase calibrada em playtest.
- **Queda:** a borda inferior do mapa é sempre zona de queda; o Tiled ganha um tipo de objeto "zona de queda" para casos como a torre do Foguete.
- **Fatos:** em fila; cada um fica ~4 s no topo; um segundo Fato espera o primeiro sair.
- **Predadores e plataformas:** nesta entrega, todos patrulham entre dois pontos (variação por espécie é o corte nº 4). Ovelhas, guindastes e esteiras não ferem o Kiwi.
- **Menus:** cada menu tem a opção "Voltar"; Start/Esc no menu também volta. Mundos "em breve" aparecem mas não são selecionáveis. Placar do Foguete: "Jogar de novo" e "Menu".
- **Resolução:** 640×360 interna, escala FIT com pixel art sem suavização e barras quando a proporção não for 16:9.
- **Fonte dos Fatos:** num arquivo de dados próprio, por chave de Fato; um teste falha se algum Fato não tiver fonte.
- **CI:** GitHub Actions roda `npm test`; o deploy no Pages só acontece com a suíte verde.
- **Validador de Fase** também confere: Itens e espécies existentes no catálogo, chaves de Fato sem repetição, objetos dentro do mapa, e que o mapa de cada Fase do catálogo existe.


## Sessão — 2026-11-14 16:07

Segunda rodada de lacunas, encontradas depois da primeira revisão. Só vão a pergunta
as decisões que dependem do autor; o resto segue a sugestão do Claude e entra no PRD
ao fim da sessão.

**P:** Como garantir que o visitante veja ao menos um Fato, se as Samambaias-prateadas são escondidas?
**R:** Escada de dificuldade: a 1ª Samambaia-prateada fica no caminho principal (impossível perder), a 2ª fora do caminho mas visível, a 3ª escondida de verdade. O Placar mostra os Fatos não encontrados como "???" com convite a achar a Samambaia-prateada. "Fase pronta" ganha: no playtest, quem não conhece o jogo vê ao menos 1 Fato.

**P:** O silêncio (M / Select) sobrevive à volta por inatividade e entre aberturas do lançador?
**R:** Sim: o mudo é escolha do apresentador, não do visitante. Persiste no `localStorage`, sobrevive à volta por inatividade e entre aberturas do `jogar.bat`. O atalho de zerar Recordes passa a ser L+R+Start (Select já silencia), mantido Shift+Backspace no teclado.

**P:** Quais datas disparam os cortes?
**R:** Marcos sugeridos, não obrigatórios (o autor pode adiantar tudo): 20/11 Pecuária pronta (senão cortes 1–2); 22/11 os 9 Fatos validados contra os slides e congelados; 24/11 Porto pronto (senão Foguete sai ou fica sem a decolagem); 26/11 Foguete pronto; 27/11 congelamento — só correções e teste do `jogar.bat` offline no notebook do evento. Servem como ponto de checagem: se um marco passar sem estar pronto, o corte correspondente é reavaliado.

**P:** Quem é a fonte da verdade de um mapa de Fase: o script gerador ou o `.tmj`?
**R:** O script gera o rascunho da Fase uma vez; dali em diante o `.tmj` versionado é a fonte da verdade, editado à mão (Tiled ou Claude). O gerador recusa sobrescrever um `.tmj` existente sem `--force`. Calibragem de playtest é feita direto no `.tmj`.

**P:** O que se sabe do notebook do evento?
**R:** É o notebook do autor: Lenovo LOQ 15IRH8 (RTX 2050), tela 1920×1080 a 60 Hz (16:9, sem barras). Navegadores encontrados: Edge e Brave; o Chrome não está instalado (só o Chromium do Playwright). Decorre: o `jogar.bat` usa o Edge (Chromium, sempre presente no Windows), com fallback para Chrome se existir; Brave fica de fora (Shields podem interferir). A física roda em passo fixo de 60/s mesmo assim. Teste no notebook real já no marco de 20/11.

**P:** O que significa o corte nº 4, "comportamento distinto por espécie de Predador"?
**R:** Um traço por espécie, ligado ao animal real: rato — patrulha rápida e curta; arminho — patrulha normal com um pulinho quando o Kiwi se aproxima; gambá-australiano — lento, patrulha em plataformas altas/galhos. Até o corte, todos patrulham entre dois pontos; se cortado, diferem só no visual.

## Defaults assumidos sem pergunta (contestáveis) — sessão 16:07

- **Idioma:** só em memória durante a sessão; o jogo sempre abre em PT. Sai do `localStorage` (que guarda só Recordes e o mudo).
- **Fase "em breve":** o catálogo pode marcar uma Fase como "em breve" (visível, não selecionável, sem mapa exigido pelo Validador). É assim que se corta Porto/Foguete.
- **Placar (todas as Fases):** "Próxima Fase" (se houver uma disponível), "Jogar de novo" e "Menu". Start/Esc no Placar vai ao Menu. Na última Fase disponível, só "Jogar de novo" e "Menu".
- **Tamanho do Fato:** no máximo 90 caracteres por idioma, conferido por teste; cabe numa faixa abaixo do HUD e na lista do Placar.
- **Chaves de Fato:** o catálogo é a fonte; o Validador confere que as chaves das Samambaias-prateadas do mapa coincidem exatamente com as do catálogo para aquela Fase.
- **Recorde:** a primeira conclusão de uma Fase é "Novo Recorde"; o menu mostra "—" para Fase sem Recorde.
- **Números:** Tempo formatado por idioma pelo módulo Textos (PT "42,3 s", EN "42.3 s").
- **Smoke:** `npm run smoke`, fora do `npm test` (que o hook roda a cada commit). O CI instala o Chromium e roda os dois; o deploy só acontece com ambos verdes.
- **Sprites que faltavam:** lã, leite e caixa de exportação gerados por script; contêiner, guindaste e esteira do Kenney Industrial Expansion (gerados por script se faltar algum).
- **Inatividade:** só conta como input mudança de botão ou eixo fora da zona morta (analógico com deriva não segura o jogo). Vale em qualquer cena, inclusive o Placar.
- **`jogar.bat`:** Edge (Chrome se existir), via `powershell -ExecutionPolicy Bypass`; porta fixa (o `localStorage` depende da origem) — se ocupada, mensagem clara e encerra; tipos MIME de `.js`, `.json`, `.tmj`, `.png`, `.ogg`; o servidor encerra quando o navegador fecha.
- **Física:** passo fixo de 60/s.
- **Esmagamento:** trajetos de guindastes desenhados sem vão de esmagamento; se o Kiwi ficar preso numa plataforma móvel, volta ao Checkpoint sem custo além do tempo.
- **Controle desconectado** durante a Fase abre a Pausa.
- **Scripts geradores** em Node, com as saídas versionadas; sem teste de "saída atualizada" (o `.tmj` é a fonte depois do rascunho).

## Sessão — 2026-11-14 16:22

Terceira rodada de lacunas: lançador, energia, atalhos, celular, formatação, fonte e
contrato do Tiled. Só vão a pergunta as decisões que dependem do autor; o resto segue
a sugestão do Claude e entra no PRD ao fim da sessão.

**P:** O QR code do último slide leva ao celular, mas o jogo não aceita toque. O que fazer com o celular?
**R:** Mantém o QR. Em aparelho de toque, a tela inicial mostra "Jogue no computador" (PT/EN) com o link; nada de controles de toque agora (resposta confirmada depois). Botões na tela ficam como possível trabalho depois do evento.

## Defaults assumidos sem pergunta (contestáveis) — sessão 16:22

- **Lançador sem kiosk:** o `--kiosk` do Edge roda em InPrivate e apaga o `localStorage` ao sair. O `jogar.bat` usa `--start-fullscreen` com `--user-data-dir` dedicado, `--no-first-run`, `--hide-crash-restore-bubble` e `--autoplay-policy=no-user-gesture-required`. Na tela cheia do navegador o Esc chega ao jogo; sair com Alt+F4. Conferir no notebook do evento (Recorde sobrevive a fechar e reabrir; Esc não sai da tela cheia) antes de fechar o lançador.
- **Energia:** o jogo pede a Screen Wake Lock (tela não apaga com o jogo aberto, inclusive em `localhost`), e o checklist do dia inclui plano de energia "nunca suspender" na tomada.
- **Zerar Recordes:** só no teclado, segurando Shift+Backspace por 3 s na tela inicial (o apresentador sempre tem o teclado). Sai o L+R+Start, que colidia com o Start que começa o jogo. A tela confirma com uma mensagem curta.
- **Start e Esc:** Start confirma em toda tela de menu (tela inicial, Menu, Placar) e pausa/continua na Fase; Esc volta (ou pausa/continua na Fase). No controle, voltar é a opção "Voltar" de cada menu. Substitui "Start/Esc no menu também volta" e "Start/Esc no Placar vai ao Menu" (no Placar, Esc vai ao Menu).
- **Indicador de silêncio:** ícone de som cortado num canto, em toda cena, enquanto o silêncio estiver ligado.
- **Tempo:** abaixo de 60 s, "42,3 s" / "42.3 s"; a partir de 60 s, "1:15,3" / "1:15.3".
- **Fato:** até 2 linhas na faixa do topo e na lista do Placar; o limite de 90 caracteres continua, e o teste também confere que cada Fato cabe em 2 linhas com a largura da fonte.
- **Fonte bitmap:** procurar uma fonte pixel CC0 com acentos e `ā`; se não houver, gerada por script como os sprites (asset próprio, mesma regra). Decidida antes do primeiro texto.
- **Contrato do Tiled:** camadas `fundo` (decoração, sem colisão), `colisao`, `frente` (desenhada sobre o Kiwi, sem colisão; esconde a 3ª Samambaia-prateada) e a camada de objetos. Tiles atravessáveis por baixo marcados por propriedade no tileset. Patrulha e trajeto como propriedades de distância/direção no objeto; esteira com propriedade de sentido. O Validador exige mapa finito, tilesets embutidos e dados de camada sem compressão (o Phaser não lê tileset externo).
- **`localStorage`:** chaves com prefixo `kiwirun:` e versão de esquema (`kiwirun:v1:...`); mudar os descontos depois do playtest sobe a versão e descarta Recordes incomparáveis. Necessário porque a origem do GitHub Pages é compartilhada entre os repositórios do autor.
- **Antes do primeiro input:** a Fase fica congelada (Predadores e plataformas parados) até o primeiro input, junto com o cronômetro.
- **MIME do `jogar.bat`:** também `.html`, `.css` e o formato da fonte bitmap (`.xml`/`.fnt`).
- **Música:** tela inicial, Menu e Placar tocam o tema no andamento base; a música só reinicia ao trocar de andamento (entrar ou sair de uma Fase).
- **Captura:** o Kiwi quica ao capturar; segurar o pulo deixa o quique mais alto.
- **Termos em Māori:** "Kia ora!" na tela inicial e "Aotearoa" no título do Menu, nos dois idiomas.
- **Escala:** mantém FIT (3× exato no notebook do evento); escala inteira não é exigida no Pages.

## Sessão — 2026-11-14 16:32

Quarta rodada de lacunas: identidade do Recorde, ensino dos controles, créditos,
layout do Menu, medidas do pulo e operação no dia. Só vão a pergunta as decisões que
dependem do autor; o resto segue a sugestão do Claude e entra no PRD ao fim da sessão.

**P:** O menu mostra só um tempo por Fase, sem dizer de quem é o Recorde. Como fica?
**R:** Iniciais de 3 letras. Ao bater o Recorde, o Visitante digita 3 letras (D-pad/setas trocam a letra e a posição, botão frontal/Enter confirma); o menu mostra "ABC 42,3 s". Um Recorde por Fase, sem top 3.

**P:** Como o Visitante descobre os controles (captura pulando em cima, pulo mais alto segurando, WASD/Espaço)?
**R:** Placas no cenário no início da Pecuária (ícone do botão/tecla + texto curto, mais um Predador sozinho em chão plano) e uma opção "Controles" na Pausa, com os controles do 8BitDo e do teclado.

**P:** Onde o jogador vê os créditos e as fontes dos Fatos?
**R:** Numa tela "Créditos" acessível pelo Menu: o grupo e a apresentação, Kenney (CC0), Phaser e as fontes dos Fatos de cada Fase.

**P:** Com só um Mundo jogável, qual o layout do Menu?
**R:** Tela única: Mundos numa coluna à esquerda, Fases do Mundo selecionado (com Recorde) à direita; o cursor já abre em Economia/Tecnologia › Pecuária.

## Defaults assumidos sem pergunta (contestáveis) — sessão 16:32

- **Iniciais:** só A–Z, começam em "AAA"; a tela de iniciais vem antes do Placar e só aparece quando há Novo Recorde. O Tempo final é gravado assim que a Fase termina; se a Volta por inatividade chegar durante as iniciais, o Recorde fica com "---". O `localStorage` guarda tempo e iniciais por Fase (`kiwirun:v1:...`). Iniciais indesejadas se resolvem zerando os Recordes.
- **Créditos:** textos nos arquivos PT/EN; as fontes vêm do arquivo de fontes dos Fatos (mesma origem do teste). Os nomes do grupo entram se os colegas autorizarem; senão, "Grupo da apresentação sobre a Nova Zelândia".
- **Medidas do movimento:** altura e alcance máximos do pulo (curto e segurado), em tiles, fixados num arquivo de constantes que a física e o gerador de mapas leem; o gerador não cria vão nem degrau acima delas. Coyote time e jump buffer de ~0,1 s. Física Arcade do Phaser; tile atravessável por baixo é plataforma de mão única. Hitbox do Kiwi menor que o sprite.
- **Checkpoints:** no máximo ~20 s de percurso entre dois, e um antes de cada trecho difícil (playtest confere).
- **Música:** sintetizada por script num `.wav` em loop (mono, taxa baixa), que repete sem silêncio, ao contrário de `.ogg`/`.mp3`; o MIME do `jogar.bat` inclui `.wav`. Efeitos sonoros de um pacote de áudio Kenney CC0 (o Pixel Platformer não traz áudio), em `.ogg`.
- **Aviso de toque:** só quando não há ponteiro fino (`any-pointer: fine` falso), para não barrar notebook com tela de toque; qualquer tecla segue mesmo assim.
- **Perda de foco** (Alt+Tab, notificação) durante a Fase abre a Pausa, como o controle desconectado. O checklist do dia inclui o "Não perturbe" do Windows ligado.
- **Versão do evento:** no congelamento (27/11), tag `v1.0.0` e checkout dela no notebook; a versão aparece discreta num canto da tela inicial.
- **Licença:** LICENSE MIT para o código do repositório; o aviso de licença do Phaser fica junto do arquivo vendorizado.
- **Reiniciar Fase** zera cronômetro, Itens, Samambaias-prateadas, Capturas e Checkpoints, e devolve os Predadores.
- **Fatos na Pausa:** a fila e o tempo de exibição param junto com o jogo. Os ~4 s por Fato são calibrados no playtest (90 caracteres podem pedir mais).
- **HUD de Itens:** um contador "X/Y" somando os tipos de Item da Fase; Samambaias-prateadas em "X/3".

## Sessão — 2026-11-14 16:39

Quinta rodada de lacunas: input entre telas, ensino dos controles fora da Pecuária,
nomes de Itens e Predadores, fechamento do lançador, aviso de inatividade e o papel do
notebook do evento. Só vão a pergunta as decisões que dependem do autor; o resto segue
a sugestão do Claude e entra no PRD ao fim da sessão.

**P:** O aperto de pulo do fim da Fase pode atravessar para a tela seguinte e confirmar as Iniciais ou uma opção do Placar sem querer. Como evitar?
**R:** Toda tela nova (Iniciais, Placar, Pausa, Menu) ignora input por ~0,5 s e depois só aceita um aperto novo (botão que vinha segurado precisa ser solto). No Placar, a opção pré-selecionada é "Jogar de novo". Nas Iniciais, ↑↓ trocam a letra e ←→ a posição; o botão frontal/Enter confirma a letra atual e avança, e na terceira grava; Esc volta uma letra (na primeira, nada). Não há como pular as Iniciais.

**P:** As placas de controle só existem na Pecuária, mas o Menu permite ir direto ao Foguete. Como quem começa por outra Fase aprende os controles?
**R:** Placas curtas no início do Porto e do Foguete, no mesmo sistema da Pecuária (objeto do mapa, sem tela nova): ícone do botão + uma frase sobre o que aquela Fase exige — Porto: pular nos Predadores; Foguete: segurar para pular mais alto. A Pecuária mantém o tutorial completo. Rejeitada: tela "Controles" na primeira entrada em cada Fase (trava a fila).

**P:** Os nomes dos Predadores e dos Itens não aparecem em lugar nenhum (HUD soma "X/Y", Placar só conta). Como o visitante aprende o que coletou e capturou?
**R:** O Placar lista Itens por tipo ("Lã 5/8") e Capturas por espécie ("Arminho ×2"), com os nomes nos arquivos PT/EN. O HUD mantém o total "X/Y". Na Captura, um rótulo curto com o nome da espécie flutua sobre o Predador por ~1 s, fora da fila de Fatos e sem pausar. Um Fato sobre o Predator Free 2050 fica de fora por enquanto.

**P:** O `jogar.bat` não detecta com segurança o fechamento do Edge (instância já aberta, inicialização rápida, segundo plano). Como o servidor encerra?
**R:** O servidor deixa de depender do navegador: uma janela de console visível (minimizada) é o servidor, e fechá-la encerra. Fechar o Edge não derruba nada; rodar o `.bat` de novo com a porta já ocupada pelo próprio KiwiRun só reabre o navegador (porta ocupada por outro programa continua sendo erro claro). Endereço fixo `http://localhost:<porta>`, nunca `127.0.0.1` (outra origem, outro `localStorage`). Substitui "o servidor encerra quando o navegador fecha".

**P:** A Volta por inatividade chega sem aviso (Pausa, Créditos, Placar) e é a única forma de encerrar a sessão do Visitante. Como fica?
**R:** Nos últimos 10 s, um aviso "Ainda está aí? 10… 9…" (PT/EN) no centro da tela, em toda cena menos a Tela inicial; qualquer input o cancela. Prazo único de 60 s em todas as cenas. O próximo Visitante que chega antes dos 60 s herda idioma e tela — aceito, sem atalho de "encerrar sessão" para o Apresentador.

**P:** O PRD fala em validar os Fatos "contra os slides" e em "QR code no último slide". Existem slides?
**R:** Não — o autor nunca mencionou slides; a premissa entrou nos grills por suposição do Claude. O material de referência de cada Assunto será entregue em Markdown, na pasta `docs/`, um arquivo por tópico. Os Fatos são validados contra esse material (e as fontes) em vez de slides; histórias 42, 43 e 50 e o marco de 22/11 são corrigidos.

**P:** No dia, o notebook do jogo também é usado na apresentação (projetor, outra tela)? E onde fica o QR code, já que não há slides?
**R:** O notebook fica só com o jogo, sem projetor. O QR code vai numa folha impressa ao lado do notebook; o autor cuida dela depois, fora do escopo do jogo.

## Defaults assumidos sem pergunta (contestáveis) — sessão 16:39

- **Material dos Assuntos:** um Markdown por Assunto em `docs/assuntos/<assunto>.md` (ex.: `economia-tecnologia.md`); é a referência contra a qual o autor valida os Fatos.
- **Módulos de lógica pura novos:** Cronômetro (início no primeiro input, pausa, fim, reinício), Fila de Fatos (~4 s cada, para na Pausa), Inatividade (mudança de botão ou eixo fora da zona morta, aviso nos últimos 10 s, 60 s) e Iniciais (letra, posição, confirmação por letra, "---"). Testados em Node como os demais; o Catálogo de Mundos ganha testes próprios (Fases "em breve", chaves de Fato, Itens e espécies declarados).
- **Teto de desconto:** o catálogo guarda um tempo de referência por Fase (medido no playtest); um teste falha se o desconto máximo possível da Fase (todos os Itens, Samambaias-prateadas e Predadores do mapa) passar de 50% desse tempo. Evita Recorde travado em 0,0.
- **Câmera:** segue o Kiwi com zona morta, presa aos limites do mapa; olha um pouco à frente na direção do movimento e, no Foguete, um pouco acima. O parallax rola só na horizontal; na Fase vertical o fundo acompanha a câmera com fator pequeno.
- **Checklist do dia** em `docs/checklist-do-evento.md`, única casa dos itens espalhados: USB-C do 8BitDo, "Não perturbe", plano de energia "nunca suspender" na tomada, Edge fora do modo de eficiência, checkout da `v1.0.0`, zerar Recordes do playtest, conferir o Silêncio, teste offline do `jogar.bat`, notebook sem projetor.
- **Checkpoint no Validador:** o início conta como o primeiro Checkpoint; o Validador exige início e fim, e objetos Checkpoint adicionais são exigidos só pela regra dos ~20 s, conferida no playtest.
- **Alcance do pulo após edição manual:** sem checagem automática de vãos no `.tmj`; o playtest de "Fase pronta" cobre.
- **Invulnerabilidade:** durante o ~1 s piscando, o contato lateral com Predador atravessa sem efeito, e pular sobre ele ainda captura. Ovelhas são sólidas só por cima (plataforma de mão única); pelos lados o Kiwi as atravessa.
- **Iniciais no teclado:** setas e Enter, como no controle; digitar letras A–Z também preenche a posição atual e avança.
- **Versão na tela inicial:** lida de uma constante no código; um teste falha se ela diferir da versão do `package.json`.
- **PRD consolidado:** ao incorporar esta sessão, o PRD reorganiza as decisões dos grills por tema (sem seções por sessão) e renumera as histórias, antes do `/ti`.
