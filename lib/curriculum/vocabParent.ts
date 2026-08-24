/**
 * Materiał trybu „z rodzicem" dla toru 2: scenki, zdania przykładowe i niuanse.
 *
 * Osobny moduł, nie pola w TOPICS, z dwóch powodów:
 *  - kluczem jest angielski tekst, a to samo słowo występuje w kilku tematach
 *    („water" w Ratunku i w Obiedzie) — ma dostać JEDNO zdanie i jedno
 *    nagranie, nie dwa;
 *  - dane tematów czyta się przy układaniu ćwiczeń, a ten plik przy siadaniu
 *    z dzieckiem — rozdzielenie trzyma oba czytelne.
 *
 * SCENKI są tu ważniejsze niż objaśnienia: dziecko utrwala zwrot ODEGRANY w
 * sytuacji, nie wyjaśniony na sucho. Każda scenka to 2-3 kwestie — rodzic gra
 * nauczycielkę/kolegę, dziecko odpowiada swoim zwrotem. Kwestia z kto: "Ty"
 * to zawsze dokładnie ten zwrot (ma już nagranie); kwestie pozostałych ról są
 * krótkie i dostają audio z generatora przez parentPhrases().
 *
 * Realia celowo brytyjskie i szkolne: register (sprawdzanie obecności),
 * stickers (naklejki-nagrody), lost property (pudło rzeczy znalezionych),
 * plaster, PE kit, fish pie ze stołówki, „Off you go". Dokładnie ten język,
 * który dziecko usłyszy w pierwszym tygodniu.
 *
 * Jak vocab.ts, ten plik nie importuje niczego — generator nagrań (zwykły
 * skrypt Node) może go wczytać poza przeglądarką.
 */

/** Zdanie przykładowe do słowa — pokazuje słowo w naturalnym użyciu. */
export type ZdaniePrzyklad = { en: string; pl: string };

/** Jedna kwestia scenki. `kto: "Ty"` = mówi dziecko (to jego zwrot). */
export type ScenkaKwestia = { kto: string; en: string; pl: string };

const PRZYKLADY_SLOW: Record<string, ZdaniePrzyklad> = {
  // --- Ratunek ---
  help: { en: "Miss, I need help, please.", pl: "Proszę pani, potrzebuję pomocy." },
  teacher: { en: "Our teacher is very kind.", pl: "Nasza pani jest bardzo miła." },
  toilet: { en: "The toilet is over there.", pl: "Toaleta jest tam." },
  water: { en: "Can I have some water, please?", pl: "Czy mogę prosić o wodę?" },
  name: { en: "Write your name at the top.", pl: "Napisz swoje imię na górze kartki." },
  friend: { en: "Tom is my best friend.", pl: "Tom to mój najlepszy kolega." },
  English: { en: "We speak English at school.", pl: "W szkole mówimy po angielsku." },
  Polish: { en: "I speak Polish at home.", pl: "W domu mówię po polsku." },
  // --- Co mówi nauczyciel ---
  line: { en: "Make a straight line, everyone.", pl: "Ustawcie się wszyscy w prostym rzędzie." },
  hand: { en: "Put your hand up.", pl: "Podnieś rękę." },
  book: { en: "This is my favourite book.", pl: "To moja ulubiona książka." },
  pencil: { en: "My pencil is broken.", pl: "Mój ołówek się złamał." },
  bin: { en: "Put it in the bin.", pl: "Wyrzuć to do kosza." },
  coat: { en: "Put your coat on.", pl: "Załóż kurtkę." },
  peg: { en: "Hang your coat on your peg.", pl: "Powieś kurtkę na swoim haczyku." },
  playtime: { en: "It's playtime now.", pl: "Teraz jest przerwa." },
  // --- Zagadać do dzieci ---
  game: { en: "Let's play a game!", pl: "Zagrajmy w coś!" },
  ball: { en: "Throw the ball to me!", pl: "Rzuć piłkę do mnie!" },
  turn: { en: "It's your turn now.", pl: "Teraz twoja kolej." },
  team: { en: "You're in my team!", pl: "Jesteś w mojej drużynie!" },
  bike: { en: "I ride my bike to school.", pl: "Jeżdżę do szkoły rowerem." },
  sand: { en: "Let's dig in the sand!", pl: "Kopmy w piasku!" },
  winner: { en: "You're the winner!", pl: "Wygrałeś!" },
  // --- Grzeczność ---
  morning: { en: "Good morning, everyone!", pl: "Dzień dobry wszystkim!" },
  afternoon: { en: "Good afternoon, class.", pl: "Dzień dobry, klaso." },
  night: { en: "Good night, sleep well.", pl: "Dobranoc, śpij dobrze." },
  sorry: { en: "Sorry! Are you OK?", pl: "Przepraszam! Nic ci nie jest?" },
  hello: { en: "Hello! Come and play!", pl: "Cześć! Chodź się bawić!" },
  goodbye: { en: "Goodbye! See you tomorrow.", pl: "Do widzenia! Do jutra." },
  // --- Poranek ---
  bed: { en: "Time for bed!", pl: "Pora do łóżka!" },
  teeth: { en: "Have you brushed your teeth?", pl: "Umyłeś zęby?" },
  breakfast: { en: "What's for breakfast?", pl: "Co jest na śniadanie?" },
  shoes: { en: "Put your shoes on, quick!", pl: "Załóż buty, szybko!" },
  clock: { en: "The clock says eight.", pl: "Zegar pokazuje ósmą." },
  soap: { en: "Wash your hands with soap.", pl: "Umyj ręce mydłem." },
  shower: { en: "Time for a shower.", pl: "Pora na prysznic." },
  bag: { en: "Pack your school bag.", pl: "Spakuj plecak do szkoły." },
  // --- Obiad w szkole ---
  sandwich: { en: "A cheese sandwich, please.", pl: "Poproszę kanapkę z serem." },
  apple: { en: "An apple for my snack.", pl: "Jabłko na przekąskę." },
  milk: { en: "Would you like some milk?", pl: "Chcesz mleka?" },
  spoon: { en: "Eat your soup with a spoon.", pl: "Jedz zupę łyżką." },
  fork: { en: "Use your knife and fork.", pl: "Jedz nożem i widelcem." },
  chips: { en: "Fish and chips for dinner!", pl: "Ryba z frytkami na obiad!" },
  biscuit: { en: "Would you like a biscuit?", pl: "Chcesz herbatnika?" },
  // --- Kiedy coś boli ---
  head: { en: "Mind your head!", pl: "Uważaj na głowę!" },
  tummy: { en: "My tummy hurts.", pl: "Boli mnie brzuch." },
  leg: { en: "My leg hurts.", pl: "Boli mnie noga." },
  knee: { en: "I've got a plaster on my knee.", pl: "Mam plaster na kolanie." },
  tooth: { en: "My tooth is wobbly!", pl: "Mój ząb się rusza!" },
  doctor: { en: "The doctor will see you now.", pl: "Lekarz cię teraz przyjmie." },
  medicine: { en: "Take your medicine after lunch.", pl: "Weź lekarstwo po obiedzie." },
  // --- Ubranie i pogoda ---
  jumper: { en: "Put your jumper on, it's cold.", pl: "Załóż sweter, jest zimno." },
  trainers: { en: "Wear your trainers for PE.", pl: "Na WF załóż buty sportowe." },
  wellies: { en: "Put your wellies on, it's muddy.", pl: "Załóż kalosze, jest błoto." },
  hat: { en: "Wear your hat, it's sunny.", pl: "Załóż czapkę, słońce świeci." },
  gloves: { en: "Where are my gloves?", pl: "Gdzie są moje rękawiczki?" },
  umbrella: { en: "Take your umbrella today.", pl: "Weź dzisiaj parasol." },
  rain: { en: "Rain, rain, go away!", pl: "Deszczyku, idź sobie! (znana rymowanka)" },
  // --- Jak się czuję ---
  happy: { en: "I'm so happy today!", pl: "Jestem dziś taki szczęśliwy!" },
  sad: { en: "Why are you sad?", pl: "Czemu jesteś smutny?" },
  tired: { en: "I'm too tired to play.", pl: "Jestem za zmęczony na zabawę." },
  scared: { en: "Don't be scared, I'm here.", pl: "Nie bój się, jestem tu." },
  angry: { en: "Are you angry with me?", pl: "Gniewasz się na mnie?" },
  shy: { en: "Don't be shy, come in!", pl: "Nie wstydź się, wejdź!" },
  excited: { en: "I'm so excited about the trip!", pl: "Nie mogę się doczekać wycieczki!" },
  bored: { en: "I'm bored, let's play!", pl: "Nudzi mi się, pobawmy się!" },
  // --- Rzeczy w szkole ---
  rubber: { en: "Can I borrow your rubber, please?", pl: "Mogę pożyczyć gumkę?" },
  ruler: { en: "Draw a line with your ruler.", pl: "Narysuj linię przy linijce." },
  scissors: { en: "Careful with the scissors!", pl: "Ostrożnie z nożyczkami!" },
  glue: { en: "Stick it with glue.", pl: "Przyklej to klejem." },
  crayon: { en: "Pass me the red crayon.", pl: "Podaj mi czerwoną kredkę." },
  "pencil case": { en: "Put it in your pencil case.", pl: "Schowaj to do piórnika." },
  "exercise book": { en: "Open your exercise book.", pl: "Otwórz zeszyt." },
  "book bag": { en: "Where's your book bag?", pl: "Gdzie jest twoja torba na książki?" },
};

const SCENKI: Record<string, ScenkaKwestia[]> = {
  // --- Ratunek ---
  "I don't understand.": [
    { kto: "nauczycielka", en: "Take out your maths books.", pl: "Wyjmijcie zeszyty do matematyki." },
    { kto: "Ty", en: "I don't understand.", pl: "Nie rozumiem." },
    { kto: "nauczycielka", en: "No problem. Look, like this.", pl: "Nie szkodzi. Patrz, o tak." },
  ],
  "Can you help me, please?": [
    { kto: "Ty", en: "Can you help me, please?", pl: "Możesz mi pomóc?" },
    { kto: "nauczycielka", en: "Of course! Let's do it together.", pl: "Oczywiście! Zróbmy to razem." },
  ],
  "Can I go to the toilet, please?": [
    { kto: "Ty", en: "Can I go to the toilet, please?", pl: "Czy mogę iść do toalety?" },
    { kto: "nauczycielka", en: "Yes, off you go.", pl: "Tak, idź. („Off you go” = „no to hop”)" },
  ],
  "Sorry?": [
    { kto: "kolega", en: "Do you want to play football?", pl: "(bardzo szybko) Chcesz zagrać w piłkę?" },
    { kto: "Ty", en: "Sorry?", pl: "Słucham?" },
    { kto: "kolega", en: "Football! Come on!", pl: "W piłkę! Chodź!" },
  ],
  "Slowly, please.": [
    { kto: "nauczycielka", en: "First page ten, then page twelve.", pl: "Najpierw strona dziesięć, potem dwanaście." },
    { kto: "Ty", en: "Slowly, please.", pl: "Wolniej, proszę." },
    { kto: "nauczycielka", en: "Page ten. Slowly. OK?", pl: "Strona dziesięć. Powoli. Dobrze?" },
  ],
  "I'm learning English.": [
    { kto: "kolega", en: "Why are you quiet?", pl: "Czemu nic nie mówisz?" },
    { kto: "Ty", en: "I'm learning English.", pl: "Uczę się angielskiego." },
    { kto: "kolega", en: "Cool! I can help you.", pl: "Super! Mogę ci pomagać." },
  ],
  "I don't know.": [
    { kto: "nauczycielka", en: "Where is your reading book?", pl: "Gdzie jest twoja książeczka do czytania?" },
    { kto: "Ty", en: "I don't know.", pl: "Nie wiem." },
    { kto: "nauczycielka", en: "Let's look together.", pl: "Poszukajmy razem." },
  ],
  "I want my mum.": [
    { kto: "nauczycielka", en: "Are you OK?", pl: "Wszystko w porządku?" },
    { kto: "Ty", en: "I want my mum.", pl: "Chcę do mamy." },
    { kto: "nauczycielka", en: "It's OK. Mum comes after school.", pl: "Już dobrze. Mama przyjdzie po szkole." },
  ],
  // --- Co mówi nauczyciel ---
  "Here!": [
    { kto: "nauczycielka", en: "Register time. Listen for your name.", pl: "Sprawdzam obecność. Słuchaj swojego imienia." },
    { kto: "Ty", en: "Here!", pl: "Jestem!" },
  ],
  "I've finished.": [
    { kto: "Ty", en: "I've finished.", pl: "Skończyłem." },
    { kto: "nauczycielka", en: "Well done! Read your book now.", pl: "Brawo! Teraz poczytaj książkę." },
  ],
  // --- Zagadać do dzieci ---
  "What's your name?": [
    { kto: "Ty", en: "What's your name?", pl: "Jak masz na imię?" },
    { kto: "kolega", en: "Ben. What's your name?", pl: "Ben. A ty jak masz na imię?" },
  ],
  "Can I play with you?": [
    { kto: "Ty", en: "Can I play with you?", pl: "Mogę się z wami pobawić?" },
    { kto: "kolega", en: "You're in my team!", pl: "Jesteś w mojej drużynie!" },
  ],
  "Do you want to play?": [
    { kto: "Ty", en: "Do you want to play?", pl: "Chcesz się pobawić?" },
    { kto: "kolega", en: "Yes! Let's play tag!", pl: "Tak! Pobawmy się w berka!" },
  ],
  "It's my turn.": [
    { kto: "kolega", en: "Me again!", pl: "Jeszcze raz ja!" },
    { kto: "Ty", en: "It's my turn.", pl: "Teraz moja kolej." },
    { kto: "kolega", en: "Oh, OK. Here you are.", pl: "No dobra. Proszę." },
  ],
  "That's not fair.": [
    { kto: "kolega", en: "I win again! Ha ha!", pl: "Znowu wygrywam!" },
    { kto: "Ty", en: "That's not fair.", pl: "To nie fair." },
    { kto: "kolega", en: "OK, let's take turns.", pl: "Dobra, gramy na zmianę." },
  ],
  "Stop it, please.": [
    { kto: "kolega", en: "Give me your hat!", pl: "Dawaj czapkę!" },
    { kto: "Ty", en: "Stop it, please.", pl: "Przestań, proszę." },
    { kto: "kolega", en: "Sorry.", pl: "Przepraszam." },
  ],
  "See you tomorrow.": [
    { kto: "kolega", en: "My mum is here. Bye!", pl: "Jest moja mama. Pa!" },
    { kto: "Ty", en: "See you tomorrow.", pl: "Do jutra." },
  ],
  // --- Grzeczność ---
  "Yes, please.": [
    { kto: "pani ze stołówki", en: "Would you like some chips?", pl: "Chcesz frytek?" },
    { kto: "Ty", en: "Yes, please.", pl: "Tak, poproszę." },
  ],
  "No, thank you.": [
    { kto: "pani ze stołówki", en: "More peas?", pl: "Jeszcze groszku?" },
    { kto: "Ty", en: "No, thank you.", pl: "Nie, dziękuję." },
  ],
  "Thank you.": [
    { kto: "nauczycielka", en: "Here's your sticker!", pl: "Proszę, twoja naklejka!" },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję." },
  ],
  "You're welcome.": [
    { kto: "kolega", en: "Thanks for the crisps!", pl: "Dzięki za chipsy!" },
    { kto: "Ty", en: "You're welcome.", pl: "Proszę bardzo." },
  ],
  "Excuse me.": [
    { kto: "Ty", en: "Excuse me.", pl: "Przepraszam…" },
    { kto: "nauczycielka", en: "Yes? How can I help?", pl: "Tak? W czym pomóc?" },
  ],
  "Here you are.": [
    { kto: "kolega", en: "Can I borrow a pencil?", pl: "Pożyczysz mi ołówek?" },
    { kto: "Ty", en: "Here you are.", pl: "Proszę." },
    { kto: "kolega", en: "Thanks!", pl: "Dzięki!" },
  ],
  "Nice to meet you.": [
    { kto: "kolega", en: "I'm Ben.", pl: "Jestem Ben." },
    { kto: "Ty", en: "Nice to meet you.", pl: "Miło cię poznać." },
  ],
  "Bless you!": [
    { kto: "kolega", en: "Achoo!", pl: "Apsik!" },
    { kto: "Ty", en: "Bless you!", pl: "Na zdrowie!" },
    { kto: "kolega", en: "Thank you!", pl: "Dziękuję!" },
  ],
  // --- Poranek ---
  "I'm ready.": [
    { kto: "rodzic", en: "Time to go! Shoes on!", pl: "Wychodzimy! Buty!" },
    { kto: "Ty", en: "I'm ready.", pl: "Jestem gotowy." },
  ],
  "Where are my shoes?": [
    { kto: "Ty", en: "Where are my shoes?", pl: "Gdzie są moje buty?" },
    { kto: "rodzic", en: "Look under your bed!", pl: "Zajrzyj pod łóżko!" },
  ],
  "I can do it myself.": [
    { kto: "rodzic", en: "Let me zip up your coat.", pl: "Zapnę ci kurtkę." },
    { kto: "Ty", en: "I can do it myself.", pl: "Sam to zrobię." },
    { kto: "rodzic", en: "Well done!", pl: "Brawo!" },
  ],
  "Just a minute.": [
    { kto: "rodzic", en: "Hurry up! We're late!", pl: "Pospiesz się! Jesteśmy spóźnieni!" },
    { kto: "Ty", en: "Just a minute.", pl: "Chwileczkę." },
  ],
  "I forgot.": [
    { kto: "nauczycielka", en: "Where's your PE kit?", pl: "Gdzie twój strój na WF?" },
    { kto: "Ty", en: "I forgot.", pl: "Zapomniałem." },
    { kto: "nauczycielka", en: "Never mind. Borrow one today.", pl: "Nic nie szkodzi. Na dziś pożycz." },
  ],
  // --- Obiad w szkole ---
  "I'm hungry.": [
    { kto: "Ty", en: "I'm hungry.", pl: "Jestem głodny." },
    { kto: "rodzic", en: "Lunch is nearly ready.", pl: "Obiad prawie gotowy." },
  ],
  "I'm thirsty.": [
    { kto: "Ty", en: "I'm thirsty.", pl: "Chce mi się pić." },
    { kto: "rodzic", en: "Here's some water.", pl: "Proszę, woda." },
  ],
  "Can I have some water, please?": [
    { kto: "pani ze stołówki", en: "Anything else?", pl: "Coś jeszcze?" },
    { kto: "Ty", en: "Can I have some water, please?", pl: "Czy mogę prosić o wodę?" },
    { kto: "pani ze stołówki", en: "Of course, here you are.", pl: "Oczywiście, proszę." },
  ],
  "I don't like it.": [
    { kto: "pani ze stołówki", en: "Today it's fish pie.", pl: "Dziś zapiekanka rybna." },
    { kto: "Ty", en: "I don't like it.", pl: "Nie lubię tego." },
    { kto: "pani ze stołówki", en: "Try a little bit.", pl: "Spróbuj troszeczkę." },
  ],
  "It's yummy!": [
    { kto: "rodzic", en: "Do you like the pasta?", pl: "Smakuje ci makaron?" },
    { kto: "Ty", en: "It's yummy!", pl: "Pyszne!" },
  ],
  // --- Kiedy coś boli ---
  "It hurts.": [
    { kto: "nauczycielka", en: "What happened? Show me.", pl: "Co się stało? Pokaż." },
    { kto: "Ty", en: "It hurts.", pl: "Boli." },
    { kto: "nauczycielka", en: "Let's get an ice pack.", pl: "Przyniosę zimny okład." },
  ],
  "My tummy hurts.": [
    { kto: "Ty", en: "My tummy hurts.", pl: "Boli mnie brzuch." },
    { kto: "nauczycielka", en: "Sit down. I'll call your mum.", pl: "Usiądź. Zadzwonię do mamy." },
  ],
  "I feel sick.": [
    { kto: "Ty", en: "I feel sick.", pl: "Niedobrze mi." },
    { kto: "nauczycielka", en: "Come to the office with me.", pl: "Chodź ze mną do sekretariatu." },
  ],
  "I've hurt my knee.": [
    { kto: "Ty", en: "I've hurt my knee.", pl: "Uderzyłem się w kolano." },
    { kto: "nauczycielka", en: "Let me see. You need a plaster.", pl: "Pokaż. Trzeba przykleić plaster." },
  ],
  "I need help.": [
    { kto: "Ty", en: "I need help.", pl: "Potrzebuję pomocy." },
    { kto: "nauczycielka", en: "I'm coming!", pl: "Już idę!" },
  ],
  // --- Ubranie i pogoda ---
  "I'm cold.": [
    { kto: "Ty", en: "I'm cold.", pl: "Zimno mi." },
    { kto: "rodzic", en: "Put your jumper on.", pl: "Załóż sweter." },
  ],
  "I'm hot.": [
    { kto: "Ty", en: "I'm hot.", pl: "Gorąco mi." },
    { kto: "rodzic", en: "Take your jumper off, then.", pl: "To zdejmij sweter." },
  ],
  "It's raining.": [
    { kto: "Ty", en: "It's raining.", pl: "Pada deszcz." },
    { kto: "rodzic", en: "Wellies and coat today!", pl: "Dziś kalosze i kurtka!" },
  ],
  "I've lost my jumper.": [
    { kto: "Ty", en: "I've lost my jumper.", pl: "Zgubiłem sweter." },
    { kto: "nauczycielka", en: "Check the lost property box.", pl: "Sprawdź w pudle rzeczy znalezionych." },
  ],
  "Can I go outside?": [
    { kto: "Ty", en: "Can I go outside?", pl: "Mogę wyjść na dwór?" },
    { kto: "rodzic", en: "Yes, but put your wellies on.", pl: "Tak, ale załóż kalosze." },
  ],
  // --- Jak się czuję ---
  "I'm tired.": [
    { kto: "Ty", en: "I'm tired.", pl: "Jestem zmęczony." },
    { kto: "rodzic", en: "Early night tonight, then.", pl: "To dziś wcześniej spać." },
  ],
  "I miss my mum.": [
    { kto: "nauczycielka", en: "You look sad. What's wrong?", pl: "Jesteś smutny. Co się dzieje?" },
    { kto: "Ty", en: "I miss my mum.", pl: "Tęsknię za mamą." },
    { kto: "nauczycielka", en: "She'll be here after school.", pl: "Przyjdzie po lekcjach." },
  ],
  "I'm scared.": [
    { kto: "Ty", en: "I'm scared.", pl: "Boję się." },
    { kto: "rodzic", en: "Hold my hand. I'm here.", pl: "Złap mnie za rękę. Jestem tu." },
  ],
  "I don't want to.": [
    { kto: "kolega", en: "Jump from the top!", pl: "Skocz z samej góry!" },
    { kto: "Ty", en: "I don't want to.", pl: "Nie chcę." },
    { kto: "kolega", en: "OK, no problem.", pl: "Dobra, nie ma sprawy." },
  ],
  "Leave me alone.": [
    { kto: "kolega", en: "Ha ha, funny hat!", pl: "Ha ha, śmieszna czapka!" },
    { kto: "Ty", en: "Leave me alone.", pl: "Zostaw mnie w spokoju." },
  ],
  "I'm happy!": [
    { kto: "kolega", en: "We won the game!", pl: "Wygraliśmy!" },
    { kto: "Ty", en: "I'm happy!", pl: "Cieszę się!" },
  ],
  // --- Rzeczy w szkole ---
  "Can I borrow your rubber, please?": [
    { kto: "Ty", en: "Can I borrow your rubber, please?", pl: "Mogę pożyczyć gumkę?" },
    { kto: "kolega", en: "Sure, here you are.", pl: "Jasne, proszę." },
  ],
  "I can't find my bag.": [
    { kto: "Ty", en: "I can't find my bag.", pl: "Nie mogę znaleźć torby." },
    { kto: "nauczycielka", en: "Is it on your peg?", pl: "Wisi na twoim haczyku?" },
  ],
  "What's this?": [
    { kto: "Ty", en: "What's this?", pl: "Co to jest?" },
    { kto: "kolega", en: "It's a glue stick.", pl: "To klej w sztyfcie." },
  ],
  "I've lost my pencil.": [
    { kto: "Ty", en: "I've lost my pencil.", pl: "Zgubiłem ołówek." },
    { kto: "nauczycielka", en: "Take a new one from the pot.", pl: "Weź nowy z kubeczka." },
  ],
};

/**
 * Niuanse dla rodzica — tylko tam, gdzie dosłowne tłumaczenie by zmyliło albo
 * gdzie kryje się kawałek brytyjskiej kultury. Celowo nie przy każdym zwrocie:
 * uwaga przy wszystkim to uwaga przy niczym.
 */
const NIUANSE: Record<string, string> = {
  "Sorry?":
    "Z pytającą intonacją „Sorry?” znaczy „Słucham?” — najgrzeczniejszy sposób poproszenia o powtórzenie. Płaskie „Sorry.” to przeprosiny. Przećwiczcie oba tony.",
  "Here!":
    "Na sprawdzaniu obecności (register) odpowiada się „Here!” albo „Here, Miss!”. Do nauczycielki dzieci mówią po prostu „Miss”, do nauczyciela „Sir” — to nie jest niegrzeczne, to norma.",
  "Bless you!":
    "Odruch grzecznościowy po czyimś kichnięciu — jak nasze „na zdrowie”. Mówią to wszyscy i wypada odpowiedzieć „Thank you”.",
  "That's not fair.":
    "„Fair” to jedno z najważniejszych słów brytyjskiego placu zabaw — akceptowana forma protestu. Dziecko, które umie powiedzieć „that's not fair”, nie musi się szarpać.",
  "I feel sick.":
    "„Sick” znaczy tu „zbiera mi się na wymioty”, nie ogólnie „chory” (chory = „ill”). Po tym zdaniu nauczycielka zareaguje natychmiast — i o to chodzi.",
  "Can I go to the toilet, please?":
    "„Can I…?” w zupełności wystarczy — formalnego „May I…?” nikt od dziecka nie oczekuje. Kluczowe jest „please” na końcu: bez niego prośba brzmi szorstko.",
  "It's my turn.":
    "„Turn” to serce dziecięcych gier: „my turn”, „your turn”, „whose turn is it?”. Warto ćwiczyć całą trójkę przy grze planszowej.",
  "You're welcome.":
    "Dziecko usłyszy też „No worries” i „That's OK” — znaczą to samo. „You're welcome” jest najbezpieczniejszym wyborem.",
  "I want my mum.":
    "To koło ratunkowe, nie powód do wstydu — nauczycielki słyszą to od nowych dzieci codziennie i wiedzą, co robić. Przećwiczcie spokojnie w domu, „na zapas”.",
  "I've finished.":
    "Brytyjska szkoła uczy zgłaszać koniec pracy — po „I've finished” zwykle pada „Well done” i kolejne zadanie. Samo „I finished” też zrozumieją.",
  "It's yummy!":
    "Dziecięce słowo — dorosły powie „delicious”. Przeciwieństwo to „yucky”, ale o jedzeniu ze stołówki lepiej tego głośno nie mówić — stąd w aplikacji grzeczne „I don't like it”.",
  "Here you are.":
    "Mówi się przy PODAWANIU czegoś — to nie jest „tu jesteś”. Dziecko usłyszy też „There you go” — to samo.",
  "See you tomorrow.":
    "Popularne jest też „See you later!” — nie znaczy, że zobaczą się jeszcze tego dnia. To po prostu „na razie”.",
};

/** Zdanie przykładowe dla słowa albo null. */
export function wordExample(word: string): ZdaniePrzyklad | null {
  return PRZYKLADY_SLOW[word] ?? null;
}

/** Scenka do odegrania dla zwrotu (pusta tablica = brak scenki). */
export function phraseScene(phrase: string): ScenkaKwestia[] {
  return SCENKI[phrase] ?? [];
}

/** Niuans dla rodzica albo null. */
export function phraseNote(phrase: string): string | null {
  return NIUANSE[phrase] ?? null;
}

/**
 * Wszystkie angielskie zdania tego modułu — dla generatora nagrań i audytu.
 * Kwestie dziecka to istniejące zwroty (mają już pliki), więc zbiór w dużej
 * mierze pokrywa się z vocabPhrases() — deduplikacja dzieje się po stronie
 * wołającego, przez wspólny Set.
 */
export function parentPhrases(): string[] {
  const zdania = new Set<string>();
  for (const przyklad of Object.values(PRZYKLADY_SLOW)) zdania.add(przyklad.en);
  for (const kwestie of Object.values(SCENKI)) {
    for (const kwestia of kwestie) zdania.add(kwestia.en);
  }
  return [...zdania].sort();
}
