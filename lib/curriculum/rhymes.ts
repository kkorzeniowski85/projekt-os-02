/**
 * Klasyczne brytyjskie rymowanki (nursery rhymes).
 *
 * PO CO W APLIKACJI DO NAUKI: badania nad chantami i śpiewem u młodych
 * uczniów pokazują lepsze zapamiętywanie słownictwa i wymowy niż przy
 * recytacji, plus wyższą motywację i niższy lęk. Rytm i rym niosą język
 * tam, gdzie sama pamięć jeszcze nie sięga.
 *
 * Drugi powód jest kulturowy: te konkretne rymowanki zna KAŻDE brytyjskie
 * dziecko — śpiewa się je w szkole, na urodzinach, w telewizji. Dziecko,
 * które je zna, wchodzi do klasy z czymś wspólnym.
 *
 * Dobór: wyłącznie teksty tradycyjne z domeny publicznej. Świadomie BEZ
 * „The Wheels on the Bus” (tekst z 1937 r., prawa wciąż niepewne).
 *
 * Nagranie jest ŚPIEWNIE MODULOWANE, choć to nie śpiew: syntezator nie umie
 * śpiewać, więc melodyjność budujemy sami — frazy sklejane z segmentów o
 * naprzemiennej wysokości głosu, "E-I-E-I-O" jako drabinka pojedynczych
 * liter, odgłosy zwierząt wolniej i niżej (szczegóły w generatorze nagrań).
 * Prawdziwą melodię dokłada rodzic: wskazówka przy każdej rymowance mówi, jak.
 *
 * Bez importów — generator nagrań czyta ten plik z Node.
 */

export type RhymeLine = { en: string; pl: string };

export type Rhyme = {
  id: string;
  titleEn: string;
  titlePl: string;
  emoji: string;
  /** Po co ta rymowanka i jak ją śpiewać/pokazywać — dla rodzica. */
  parentTipPl: string;
  lines: RhymeLine[];
};

export const RHYMES: Rhyme[] = [
  {
    id: "twinkle-twinkle",
    titleEn: "Twinkle, Twinkle, Little Star",
    titlePl: "Mrugaj, mrugaj, gwiazdko",
    emoji: "⭐",
    parentTipPl:
      "Najbardziej znana kołysanka świata — melodię na pewno znasz (to ta sama, co polskie „Ach śpij kochanie” w rytmie ABC). Śpiewajcie na dobranoc; „little star” szybko wejdzie samo.",
    lines: [
      { en: "Twinkle, twinkle, little star,", pl: "Mrugaj, mrugaj, mała gwiazdko," },
      { en: "How I wonder what you are!", pl: "tak się zastanawiam, czym jesteś!" },
      { en: "Up above the world so high,", pl: "Wysoko nad światem," },
      { en: "Like a diamond in the sky.", pl: "jak diament na niebie." },
      { en: "Twinkle, twinkle, little star,", pl: "Mrugaj, mrugaj, mała gwiazdko," },
      { en: "How I wonder what you are!", pl: "tak się zastanawiam, czym jesteś!" },
    ],
  },
  {
    id: "incy-wincy",
    titleEn: "Incy Wincy Spider",
    titlePl: "Pajączek Incy Wincy",
    emoji: "🕷️",
    parentTipPl:
      "Rymowanka z gestami — palce „wspinają się” po niewidzialnej rynnie, deszcz spada machnięciem dłoni, słońce rysuje się rękami nad głową. Ruch robi tu połowę nauki: pokazujcie razem.",
    lines: [
      { en: "Incy Wincy Spider climbed up the water spout.", pl: "Pajączek Incy Wincy wspiął się po rynnie." },
      { en: "Down came the rain and washed the spider out.", pl: "Spadł deszcz i zmył pajączka." },
      { en: "Out came the sunshine and dried up all the rain.", pl: "Wyszło słońce i wysuszyło deszcz." },
      { en: "And Incy Wincy Spider climbed up the spout again.", pl: "I pajączek znów wspiął się po rynnie." },
    ],
  },
  {
    id: "head-shoulders",
    titleEn: "Head, Shoulders, Knees and Toes",
    titlePl: "Głowa, ramiona, kolana, palce",
    emoji: "🙆",
    parentTipPl:
      "Szkolny klasyk WF-u i „wet play”. Dotykajcie kolejnych części ciała w rytm słów, za każdym razem szybciej — śmiech gwarantowany, a nazwy części ciała wchodzą na zawsze. Idealna para do tematu „Kiedy coś boli”.",
    lines: [
      { en: "Head, shoulders, knees and toes, knees and toes.", pl: "Głowa, ramiona, kolana i palce stóp, kolana i palce." },
      { en: "Head, shoulders, knees and toes, knees and toes.", pl: "Głowa, ramiona, kolana i palce stóp, kolana i palce." },
      { en: "And eyes and ears and mouth and nose.", pl: "I oczy, i uszy, i buzia, i nos." },
      { en: "Head, shoulders, knees and toes, knees and toes.", pl: "Głowa, ramiona, kolana i palce stóp, kolana i palce." },
    ],
  },
  {
    id: "rain-rain",
    titleEn: "Rain, Rain, Go Away",
    titlePl: "Deszczyku, idź sobie",
    emoji: "🌧️",
    parentTipPl:
      "Dwie linijki, zero trudnych słów — idealna na pierwszy raz. Mówcie ją przy oknie, kiedy naprawdę pada (a w Anglii będzie padać): sytuacja przetłumaczy ją lepiej niż słownik.",
    lines: [
      { en: "Rain, rain, go away,", pl: "Deszczyku, deszczyku, idź sobie," },
      { en: "Come again another day.", pl: "wróć innego dnia." },
    ],
  },
  {
    id: "baa-baa",
    titleEn: "Baa, Baa, Black Sheep",
    titlePl: "Bee, bee, czarna owco",
    emoji: "🐑",
    parentTipPl:
      "Ta sama melodia co Twinkle Twinkle — jedna melodia, dwie rymowanki, dziecko czuje się sprytne. Przy okazji: „master”, „dame” i „lane” to starodawne słowa, nie do nauki — rymowanka ma prawo brzmieć jak z bajki.",
    lines: [
      { en: "Baa, baa, black sheep, have you any wool?", pl: "Bee, bee, czarna owco, masz trochę wełny?" },
      { en: "Yes sir, yes sir, three bags full.", pl: "Tak, panie, tak, panie — trzy pełne worki." },
      { en: "One for the master, and one for the dame,", pl: "Jeden dla pana, jeden dla pani," },
      { en: "And one for the little boy who lives down the lane.", pl: "i jeden dla chłopczyka z końca uliczki." },
    ],
  },
  {
    id: "old-macdonald",
    titleEn: "Old MacDonald Had a Farm",
    titlePl: "Stary MacDonald miał farmę",
    emoji: "🐄",
    parentTipPl:
      "Rymowanka-zabawa w odgłosy zwierząt: E-I-E-I-O śpiewa się tak samo po polsku i po angielsku, więc dziecko od razu „umie”. Dokładajcie kolejne zwierzęta (pig — oink, duck — quack, sheep — baa) i niech dziecko wybiera, kto następny.",
    lines: [
      { en: "Old MacDonald had a farm, E-I-E-I-O!", pl: "Stary MacDonald miał farmę, E-I-E-I-O!" },
      { en: "And on his farm he had a cow, E-I-E-I-O!", pl: "A na tej farmie miał krowę, E-I-E-I-O!" },
      { en: "With a moo moo here and a moo moo there,", pl: "Tu „muu”, tam „muu”," },
      { en: "Here a moo, there a moo, everywhere a moo moo.", pl: "wszędzie słychać „muu”." },
      { en: "Old MacDonald had a farm, E-I-E-I-O!", pl: "Stary MacDonald miał farmę, E-I-E-I-O!" },
    ],
  },
];

export const RHYMES_BY_ID: Record<string, Rhyme> = Object.fromEntries(
  RHYMES.map((rhyme) => [rhyme.id, rhyme]),
);

/** Pełny tekst rymowanki — dla generatora nagrań (jeden plik na rymowankę). */
export function rhymeText(rhyme: Rhyme): string {
  return rhyme.lines.map((line) => line.en).join("\n");
}
