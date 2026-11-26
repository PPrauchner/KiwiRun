/**
 * @file O tema do jogo em notação, para o gerador de música: composição própria, oito
 * compassos de 4/4 em dó maior, que dão a volta (o último compasso puxa de volta ao primeiro).
 *
 * Cada símbolo é `NOTA:COLCHEIAS` — nota com acidente opcional (`#` ou `b`) e oitava, como
 * `C5` ou `F#4`, seguida da duração em colcheias; `-` é pausa. Um compasso tem 8 colcheias.
 * As duas vozes têm de somar a mesma duração. Sem pausa no começo nem no fim, para o loop
 * não ter silêncio.
 */
export default {
  /** Voz de pulso: a melodia. */
  melodia: [
    'C5:2 E5:2 G5:2 E5:2',
    'F5:2 A5:2 G5:4',
    'E5:2 G5:2 C6:3 B5:1',
    'A5:2 G5:2 E5:4',
    'F5:2 F5:1 G5:1 A5:2 F5:2',
    'E5:2 E5:1 F5:1 G5:2 E5:2',
    'D5:2 E5:2 F5:2 B4:2',
    'C5:4 G4:2 B4:2',
  ].join(' '),
  /** Voz triangular: o baixo, uma semínima por tempo. */
  baixo: [
    'C3:2 G3:2 C3:2 G3:2',
    'F2:2 C3:2 G2:2 D3:2',
    'C3:2 G3:2 C3:2 G3:2',
    'A2:2 E3:2 A2:2 E3:2',
    'F2:2 C3:2 F2:2 C3:2',
    'C3:2 G3:2 C3:2 G3:2',
    'D3:2 A3:2 G2:2 D3:2',
    'C3:2 G3:2 G2:2 D3:2',
  ].join(' '),
};
