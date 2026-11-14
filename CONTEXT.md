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
O ponto da Fase para onde o Kiwi volta ao encostar num Predador ou cair num buraco.
_Avoid_: respawn, save point

**Item**:
Um objeto do tema da Fase espalhado pelo percurso que o Kiwi coleta para o Placar (ex.: lã, leite, kiwifruta, peça de foguete).
_Avoid_: moeda, coin, coletável

**Samambaia-prateada**:
O coletável escondido, três por Fase, que revela um Fato ao ser pego; símbolo nacional da NZ.
_Avoid_: estrela, segredo, silver fern

**Fato**:
Uma frase curta e verdadeira sobre a Nova Zelândia, ligada ao Assunto, revelada por uma Samambaia-prateada.
_Avoid_: curiosidade (é nome de Assunto), dica, trivia

**Kiwifruta**:
A fruta, que é Item de exportação; nunca chamada só de "kiwi" para não confundir com o Kiwi.
_Avoid_: kiwi (para a fruta)

**Tempo final**:
O tempo gasto na Fase menos um desconto por Item e por Samambaia-prateada coletados; o número que decide o Recorde.
_Avoid_: pontuação, score

**Placar**:
O resultado mostrado ao fim de uma Fase: tempo gasto, Itens coletados, Fatos encontrados e o Tempo final.
_Avoid_: score, pontuação

**Recorde**:
O menor Tempo final já registrado numa Fase naquele computador, mostrado no menu.
_Avoid_: high score, melhor pontuação
