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

