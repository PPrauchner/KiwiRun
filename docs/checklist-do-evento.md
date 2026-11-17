# Checklist do dia do evento

Preparação do notebook do jogo para a apresentação de 28/11/2026. É a única casa
destes itens (ver `docs/grills_logs/transversal/lacunas-de-design.md`). Quem roda é
o Apresentador, de preferência na véspera e de novo no dia, com o notebook já no
lugar e na tomada.

Siga na ordem: o teste offline joga uma Fase e grava um Recorde, que só depois é
zerado.

## Notebook e Windows

- [ ] **Notebook sem projetor.** O notebook fica só com o jogo.
  - Conferir: nenhum cabo HDMI/USB-C de vídeo ligado; `Win + P` mostra
    "Somente tela do PC" selecionado.
- [ ] **Plano de energia "nunca suspender" na tomada.**
  - Onde: Configurações → Sistema → Energia e bateria → Tela e suspensão.
    "Na tomada, desligar a tela após" e "Na tomada, colocar o dispositivo em
    suspensão após" em **Nunca**.
  - Conferir: o carregador está ligado (ícone de bateria com o raio na barra de
    tarefas) e as duas opções mostram "Nunca".
- [ ] **"Não perturbe" do Windows ligado.** Uma notificação tira o foco e abre a
  Pausa no meio da Fase.
  - Onde: Configurações → Sistema → Notificações → Não perturbe, ou `Win + N` e o
    sino no topo da central de notificações.
  - Conferir: o ícone do relógio na barra de tarefas mostra o sino cortado (zZ).

## Navegador

- [ ] **Edge fora do modo de eficiência.** O modo de eficiência reduz a taxa de
  quadros e põe abas em suspensão.
  - Onde: o `jogar.bat` usa um perfil dedicado do Edge, então a opção tem de ser
    desligada **dentro dele**. Com o jogo aberto pelo `jogar.bat`: `F11` sai da
    tela cheia, `Ctrl + T` abre uma aba, digitar `edge://settings/system` (em
    versões novas, a opção fica em "Desempenho"/"Performance") e desligar
    "Modo de eficiência". Fechar a aba (`Ctrl + W`) e voltar à tela cheia com `F11`.
  - Conferir: o ícone de coração/folha do modo de eficiência não aparece na barra
    do Edge, e o interruptor está desligado.
  - Se o notebook usar o Chrome (sem Edge instalado), o equivalente é
    `chrome://settings/performance` → "Economia de memória" e "Economia de
    energia" desligados.

## Versão do jogo

- [ ] **Checkout da tag `v1.0.0`.** É a versão congelada em 27/11.
  - Como: num terminal na pasta do jogo, `git fetch --tags` e depois
    `git checkout v1.0.0`.
  - Conferir: `git describe --tags` responde `v1.0.0`, e a versão aparece discreta
    num canto da tela inicial.

## Controle 8BitDo

- [ ] **8BitDo ligado por USB-C em modo XInput.**
  - Como: ligar o cabo USB-C no notebook e pôr o controle em modo XInput (no
    8BitDo, segurar a combinação de modo do manual do modelo ao ligar — em geral
    Start + X).
  - Conferir: `Win + R` → `joy.cpl` lista o controle como controle de Xbox
    ("Controller (XBOX 360 For Windows)" ou parecido) e a aba Propriedades reage
    aos botões.
- [ ] **Teste manual nos modos do controle.** O mapeamento do jogo é à prova de
  modo; confirme no jogo, em cada modo que o controle oferece (XInput, DInput,
  Switch), e termine em XInput.
  - Conferir, com o jogo aberto pelo `jogar.bat`:
    - Tela inicial: qualquer botão começa.
    - Na Fase: D-pad e analógico esquerdo movem o Kiwi; cada um dos 4 botões
      frontais pula.
    - Start abre e fecha a Pausa; Select liga e desliga o Silêncio.
  - Teclado como reserva: setas/WASD movem, Espaço pula, Esc pausa, M silencia.

## Teste offline do `jogar.bat`

- [ ] **O jogo roda sem internet.**
  - Como: desligar o Wi-Fi (`Win + A` → Wi-Fi desligado, ou modo avião) e
    desconectar o cabo de rede, se houver. Dar dois cliques no `jogar.bat`.
  - Conferir: o navegador abre em tela cheia em `http://localhost:47800/`, a tela
    inicial aparece com arte e som, e uma Fase carrega e é jogável até o Placar.
- [ ] **Recorde sobrevive a fechar e reabrir.**
  - Como: terminar uma Fase e gravar um Recorde com Iniciais de teste. Fechar o
    navegador (`Alt + F4`) e a janela minimizada do servidor. Rodar o `jogar.bat`
    de novo.
  - Conferir: o Menu mostra o Recorde e as Iniciais gravados antes de fechar.
- [ ] **Esc não sai da tela cheia.**
  - Como: dentro de uma Fase, apertar `Esc`.
  - Conferir: abre a Pausa e a janela continua em tela cheia (sem barra de
    endereço nem barra de tarefas). Sair do jogo é com `Alt + F4`.

## Antes de receber Visitantes

- [ ] **Zerar os Recordes do playtest** (inclusive o gravado no teste offline).
  - Como: na tela inicial, segurar `Shift + Backspace` por 3 s (só no teclado).
  - Conferir: a tela confirma com uma mensagem curta, e o Menu mostra todas as
    Fases sem Recorde.
- [ ] **Conferir o Silêncio.** O Silêncio é escolha do Apresentador e persiste
  entre Visitantes e entre aberturas do `jogar.bat`.
  - Como: `M` no teclado ou Select no controle liga e desliga.
  - Conferir: o estado é o desejado para o ambiente (som ligado ou desligado) e
    continua assim depois de fechar e reabrir o `jogar.bat`.
