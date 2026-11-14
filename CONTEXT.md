# KiwiRun

Jogo de plataforma 2D sobre a Nova Zelândia, com um kiwi (a ave) como protagonista,
feito para ser jogado em partidas curtas ao lado de uma apresentação de grupo.

## Language

### Estrutura do jogo

**Assunto**:
Um dos temas da apresentação do grupo sobre a Nova Zelândia: Geografia, Culinária,
Curiosidades, História, Economia/Tecnologia, Fauna e Flora.
_Avoid_: tópico, matéria, tema

**Mundo**:
O agrupamento de fases de um Assunto no menu do jogo; existe um Mundo por Assunto.
_Avoid_: capítulo, zona, world

**Fase**:
Um percurso de plataforma curto, jogável isoladamente, que pertence a um Mundo.
_Avoid_: level, nível, estágio

**Em breve**:
Estado de um Mundo ou Fase que aparece no menu mas ainda não pode ser jogado.
_Avoid_: bloqueado, trancado (não há desbloqueio por progresso)

### Dentro de uma Fase

**Kiwi**:
O personagem controlado pelo jogador — a ave, nunca a fruta.
_Avoid_: player, herói

**Predador**:
Um inimigo baseado num mamífero invasor real da Nova Zelândia (arminho, gambá-australiano, rato) que ameaça o Kiwi.
_Avoid_: inimigo, monstro

**Captura**:
O que acontece com um Predador quando o Kiwi pula sobre ele: sai da Fase, como numa armadilha.
_Avoid_: matar, derrotar, stomp

**Checkpoint**:
O ponto da Fase para onde o Kiwi volta ao encostar num Predador ou cair numa Zona de queda; o início da Fase é o primeiro.
_Avoid_: respawn, save point

**Zona de queda**:
Região da Fase (sempre a borda inferior do mapa, e outras marcadas) que devolve o Kiwi ao Checkpoint.
_Avoid_: buraco mortal, kill zone

**Item**:
Um objeto do tema da Fase espalhado pelo percurso que o Kiwi coleta para o Placar (ex.: lã, leite, kiwifruta, peça de foguete).
_Avoid_: moeda, coin, coletável

**Samambaia-prateada**:
O coletável especial, três por Fase em dificuldade crescente de achar, que revela um Fato ao ser pego; símbolo nacional da NZ.
_Avoid_: estrela, segredo, silver fern

**Fato**:
Uma frase curta e verdadeira sobre a Nova Zelândia, ligada ao Assunto, revelada por uma Samambaia-prateada.
_Avoid_: curiosidade (é nome de Assunto), dica, trivia

**Kiwifruta**:
A fruta, que é Item de exportação; nunca chamada só de "kiwi" para não confundir com o Kiwi.
_Avoid_: kiwi (para a fruta)

**Tempo gasto**:
O tempo de relógio de uma tentativa na Fase, do primeiro input até tocar o fim, sem contar a Pausa.
_Avoid_: tempo cru, tempo bruto

**Tempo final**:
O Tempo gasto menos um desconto por Item, por Samambaia-prateada e por Captura; o número que decide o Recorde.
_Avoid_: pontuação, score

**Placar**:
O resultado mostrado ao fim de uma Fase: Tempo gasto, Itens coletados, Capturas, descontos, Fatos encontrados e o Tempo final.
_Avoid_: score, pontuação

**Recorde**:
O menor Tempo final já registrado numa Fase naquele computador, com as Iniciais de quem o fez, mostrado no menu.
_Avoid_: high score, melhor pontuação

**Novo Recorde**:
Um Tempo final estritamente menor que o Recorde da Fase (ou a primeira conclusão dela); empate não conta.
_Avoid_: high score

**Iniciais**:
As 3 letras (A–Z) que o Visitante digita ao fazer um Novo Recorde e que aparecem ao lado do Recorde.
_Avoid_: nome, apelido, tag

### Telas

**Tela inicial**:
A primeira tela ("aperte um botão"), com o seletor PT | EN; destino da Volta por inatividade.
_Avoid_: title screen, splash

**Menu**:
A tela única que lista os Mundos e as Fases do Mundo selecionado, com o Recorde de cada Fase.
_Avoid_: seleção de fase, level select

**Pausa**:
O menu aberto durante uma Fase (continuar, reiniciar a Fase, Controles, voltar ao Menu), que congela o jogo e o cronômetro.
_Avoid_: pause screen

**Créditos**:
A tela, acessível pelo Menu, com o grupo, as licenças de arte e código e as fontes dos Fatos.
_Avoid_: sobre, about

### No evento

**Apresentador**:
O autor no dia do evento, que abre o lançador, controla o Silêncio e zera os Recordes; não é um Visitante.
_Avoid_: admin, operador

**Silêncio**:
O estado em que todo som do jogo está desligado (M ou Select); escolha do Apresentador, que persiste entre Visitantes.
_Avoid_: mute, mudo

**Visitante**:
Quem joga no notebook ao lado da apresentação; uma sessão de visitante termina na Volta por inatividade.
_Avoid_: usuário, player

**Volta por inatividade**:
O retorno automático à tela inicial após cerca de 60 s sem input, que encerra a sessão do Visitante e restaura o PT.
_Avoid_: timeout, reset
