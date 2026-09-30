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
  // --- Dzień w szkole ---
  assembly: { en: "We sing songs in assembly.", pl: "Na apelu śpiewamy piosenki." },
  carpet: { en: "Carpet time, everyone!", pl: "Wszyscy na dywan!" },
  "water bottle": { en: "Fill up your water bottle.", pl: "Napełnij swój bidon." },
  whiteboard: { en: "Write it on your whiteboard.", pl: "Napisz to na tabliczce." },
  playground: { en: "Let's go to the playground!", pl: "Chodźmy na plac zabaw!" },
  "home time": { en: "It's nearly home time.", pl: "Już prawie koniec lekcji." },
  "wet play": { en: "Wet play today, it's raining.", pl: "Dziś przerwa w klasie, bo pada." },
  snack: { en: "Eat your snack at playtime.", pl: "Przekąskę zjedz na przerwie." },
  // --- nowe tematy (2026-09-30) ---
  "mum": {
    "en": "My mum makes pancakes.",
    "pl": "Moja mama robi naleśniki."
  },
  "dad": {
    "en": "My dad plays football with me.",
    "pl": "Mój tata gra ze mną w piłkę."
  },
  "brother": {
    "en": "My brother is ten.",
    "pl": "Mój brat ma dziesięć lat."
  },
  "sister": {
    "en": "His sister is four.",
    "pl": "Jego siostra ma cztery lata."
  },
  "nan": {
    "en": "My nan has got a cat.",
    "pl": "Moja babcia ma kota."
  },
  "grandad": {
    "en": "Grandad reads me a story.",
    "pl": "Dziadek czyta mi bajkę."
  },
  "kitchen": {
    "en": "Mum is in the kitchen.",
    "pl": "Mama jest w kuchni."
  },
  "bathroom": {
    "en": "Clean your teeth in the bathroom.",
    "pl": "Umyj zęby w łazience."
  },
  "bedroom": {
    "en": "My bedroom is blue.",
    "pl": "Mój pokój jest niebieski."
  },
  "sofa": {
    "en": "The cat is on the sofa.",
    "pl": "Kot jest na kanapie."
  },
  "stairs": {
    "en": "Don't run on the stairs.",
    "pl": "Nie biegaj po schodach."
  },
  "swing": {
    "en": "Push me on the swing!",
    "pl": "Pohuśtaj mnie na huśtawce!"
  },
  "slide": {
    "en": "The slide is really fast.",
    "pl": "Zjeżdżalnia jest bardzo szybka."
  },
  "climbing frame": {
    "en": "I'm at the top of the climbing frame!",
    "pl": "Jestem na samej górze drabinek!"
  },
  "monkey bars": {
    "en": "I can do the monkey bars!",
    "pl": "Umiem przejść po drążkach!"
  },
  "seesaw": {
    "en": "Let's go on the seesaw.",
    "pl": "Chodźmy na ważkę."
  },
  "roundabout": {
    "en": "The roundabout goes round and round.",
    "pl": "Karuzela kręci się w kółko."
  },
  "sandpit": {
    "en": "There's sand in my shoes from the sandpit.",
    "pl": "Mam piasek w butach z piaskownicy."
  },
  "tag": {
    "en": "Do you want to play tag?",
    "pl": "Chcesz się bawić w berka?"
  },
  "hide and seek": {
    "en": "We played hide and seek at playtime.",
    "pl": "Na przerwie bawiliśmy się w chowanego."
  },
  "skipping rope": {
    "en": "Can I use your skipping rope?",
    "pl": "Mogę pożyczyć twoją skakankę?"
  },
  "hopscotch": {
    "en": "Let's play hopscotch.",
    "pl": "Zagrajmy w klasy."
  },
  "bench": {
    "en": "Let's sit on the bench.",
    "pl": "Usiądźmy na ławce."
  },
  "dog": {
    "en": "The dog is wagging his tail.",
    "pl": "Pies macha ogonem."
  },
  "cat": {
    "en": "The cat is sleeping on my bed.",
    "pl": "Kot śpi na moim łóżku."
  },
  "fox": {
    "en": "A fox is sleeping in the garden.",
    "pl": "W ogrodzie śpi lis."
  },
  "squirrel": {
    "en": "The squirrel is eating a nut.",
    "pl": "Wiewiórka je orzecha."
  },
  "hedgehog": {
    "en": "Don't touch the hedgehog, it's prickly.",
    "pl": "Nie dotykaj jeża, kłuje."
  },
  "bird": {
    "en": "There's a bird on the fence.",
    "pl": "Na płocie siedzi ptak."
  },
  "duck": {
    "en": "The ducks are swimming in the pond.",
    "pl": "Kaczki pływają w stawie."
  },
  "spider": {
    "en": "There's a big spider in the bath!",
    "pl": "W wannie jest duży pająk!"
  },
  "garden": {
    "en": "Let's play in the garden.",
    "pl": "Chodźmy pobawić się w ogrodzie."
  },
  "grass": {
    "en": "The grass is wet.",
    "pl": "Trawa jest mokra."
  },
  "tree": {
    "en": "There's a bird in the tree.",
    "pl": "Na drzewie jest ptak."
  },
  "flower": {
    "en": "Smell this flower!",
    "pl": "Powąchaj ten kwiat!"
  },
  "tea": {
    "en": "We have tea at six o'clock.",
    "pl": "Jemy kolację o szóstej."
  },
  "pasta": {
    "en": "I love pasta with cheese.",
    "pl": "Uwielbiam makaron z serem."
  },
  "soup": {
    "en": "The soup is very hot.",
    "pl": "Zupa jest bardzo gorąca."
  },
  "toast": {
    "en": "Can I have toast, please?",
    "pl": "Mogę dostać tosta?"
  },
  "beans": {
    "en": "I like beans on toast.",
    "pl": "Lubię fasolkę na toście."
  },
  "fish fingers": {
    "en": "We've got fish fingers for tea.",
    "pl": "Na kolację są paluszki rybne."
  },
  "chicken": {
    "en": "The chicken is yummy.",
    "pl": "Kurczak jest pyszny."
  },
  "pudding": {
    "en": "What's for pudding?",
    "pl": "Co na deser?"
  },
  "knife": {
    "en": "Be careful with the knife.",
    "pl": "Uważaj z nożem."
  },
  "plate": {
    "en": "My plate is empty.",
    "pl": "Mój talerz jest pusty."
  },
  "bowl": {
    "en": "The soup is in a big bowl.",
    "pl": "Zupa jest w dużej misce."
  },
  "glass": {
    "en": "Here is a glass of milk.",
    "pl": "Proszę, szklanka mleka."
  },
  "Monday": {
    "en": "We have PE on Monday.",
    "pl": "W poniedziałek mamy WF."
  },
  "Tuesday": {
    "en": "On Tuesday we go swimming.",
    "pl": "We wtorek chodzimy na basen."
  },
  "Wednesday": {
    "en": "It's Wednesday today.",
    "pl": "Dziś jest środa."
  },
  "Thursday": {
    "en": "Grandma comes on Thursday.",
    "pl": "Babcia przychodzi w czwartek."
  },
  "Friday": {
    "en": "Friday is my favourite day.",
    "pl": "Piątek to mój ulubiony dzień."
  },
  "weekend": {
    "en": "We play football at the weekend.",
    "pl": "W weekend gramy w piłkę."
  },
  "week": {
    "en": "There are seven days in a week.",
    "pl": "Tydzień ma siedem dni."
  },
  "today": {
    "en": "It's sunny today.",
    "pl": "Dziś jest słonecznie."
  },
  "tomorrow": {
    "en": "See you tomorrow, Miss!",
    "pl": "Do jutra, proszę pani!"
  },
  "yesterday": {
    "en": "I was tired yesterday.",
    "pl": "Wczoraj byłem zmęczony."
  },
  "Saturday": {
    "en": "On Saturday we go to the shops.",
    "pl": "W sobotę jedziemy na zakupy."
  },
  "Sunday": {
    "en": "On Sunday we have pancakes.",
    "pl": "W niedzielę jemy naleśniki."
  },
  "shop": {
    "en": "Let's go to the shop.",
    "pl": "Chodźmy do sklepu."
  },
  "supermarket": {
    "en": "The supermarket is very big.",
    "pl": "Supermarket jest bardzo duży."
  },
  "trolley": {
    "en": "Put the bread in the trolley.",
    "pl": "Włóż chleb do wózka."
  },
  "basket": {
    "en": "Can I carry the basket?",
    "pl": "Mogę nieść koszyk?"
  },
  "money": {
    "en": "Mum, have you got any money?",
    "pl": "Mamo, masz pieniądze?"
  },
  "pound": {
    "en": "It costs one pound.",
    "pl": "To kosztuje jednego funta."
  },
  "pence": {
    "en": "The sweets are fifty pence.",
    "pl": "Cukierki kosztują pięćdziesiąt pensów."
  },
  "till": {
    "en": "Let's pay at the till.",
    "pl": "Zapłaćmy przy kasie."
  },
  "change": {
    "en": "Here's your change.",
    "pl": "Oto reszta."
  },
  "queue": {
    "en": "The queue is very long.",
    "pl": "Kolejka jest bardzo długa."
  },
  "pocket money": {
    "en": "I want to spend my pocket money.",
    "pl": "Chcę wydać moje kieszonkowe."
  },
};

const SCENKI: Record<string, ScenkaKwestia[]> = {
  // Każda scenka to pełny łuk rozmowy (3-5 kwestii): zaczepka → zwrot dziecka
  // → odpowiedź → domknięcie. Dziecko ma zwykle DWA głosy — swój zwrot i
  // naturalną ripostę — bo prawdziwa rozmowa wymaga odpowiedzi na odpowiedź.
  // Domknięcia to celowo INNE nauczone zwroty (Thank you, Yes please, Here
  // you are): każda scenka utrwala przy okazji dwa-trzy inne.
  // --- Ratunek ---
  "I don't understand.": [
    { kto: "nauczycielka", en: "Take out your maths books.", pl: "Wyjmijcie zeszyty do matematyki." },
    { kto: "Ty", en: "I don't understand.", pl: "Nie rozumiem." },
    { kto: "nauczycielka", en: "No problem. Look, like this.", pl: "Nie szkodzi. Patrz, o tak." },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję." },
    { kto: "nauczycielka", en: "Well done!", pl: "Brawo!" },
  ],
  "Can you help me, please?": [
    { kto: "Ty", en: "Excuse me.", pl: "Przepraszam… (podnosisz rękę)" },
    { kto: "nauczycielka", en: "Yes? How can I help?", pl: "Tak? W czym pomóc?" },
    { kto: "Ty", en: "Can you help me, please?", pl: "Możesz mi pomóc?" },
    { kto: "nauczycielka", en: "Of course! Let's do it together.", pl: "Oczywiście! Zróbmy to razem." },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję." },
  ],
  "Can I go to the toilet, please?": [
    { kto: "Ty", en: "Can I go to the toilet, please?", pl: "Czy mogę iść do toalety?" },
    { kto: "nauczycielka", en: "Yes, off you go.", pl: "Tak, idź. („Off you go” = „no to hop”)" },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję." },
    { kto: "nauczycielka", en: "Come straight back.", pl: "Wracaj od razu." },
  ],
  "Sorry?": [
    { kto: "kolega", en: "Do you want to play football?", pl: "(bardzo szybko) Chcesz zagrać w piłkę?" },
    { kto: "Ty", en: "Sorry?", pl: "Słucham?" },
    { kto: "kolega", en: "Football! Do you want to play?", pl: "(wolniej) Piłka! Chcesz zagrać?" },
    { kto: "Ty", en: "Yes! Come on!", pl: "Tak! Chodź!" },
  ],
  "Slowly, please.": [
    { kto: "nauczycielka", en: "First page ten, then page twelve.", pl: "Najpierw strona dziesięć, potem dwanaście." },
    { kto: "Ty", en: "Slowly, please.", pl: "Wolniej, proszę." },
    { kto: "nauczycielka", en: "Page ten. Slowly. OK?", pl: "Strona dziesięć. Powoli. Dobrze?" },
    { kto: "Ty", en: "Page ten. Thank you!", pl: "Strona dziesięć. Dziękuję! (powtórzenie = sprawdzenie, że rozumiesz)" },
  ],
  "I'm learning English.": [
    { kto: "kolega", en: "Why are you quiet?", pl: "Czemu nic nie mówisz?" },
    { kto: "Ty", en: "I'm learning English.", pl: "Uczę się angielskiego." },
    { kto: "kolega", en: "Cool! I can help you.", pl: "Super! Mogę ci pomagać." },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję." },
    { kto: "kolega", en: "Ben. What's your name?", pl: "Jestem Ben. A ty jak masz na imię?" },
  ],
  "I don't know.": [
    { kto: "nauczycielka", en: "Where is your reading book?", pl: "Gdzie jest twoja książeczka do czytania?" },
    { kto: "Ty", en: "I don't know.", pl: "Nie wiem." },
    { kto: "nauczycielka", en: "Let's look together.", pl: "Poszukajmy razem." },
    { kto: "Ty", en: "It's in my book bag!", pl: "Jest w mojej torbie na książki!" },
    { kto: "nauczycielka", en: "Well done!", pl: "Brawo!" },
  ],
  "I want my mum.": [
    { kto: "nauczycielka", en: "Are you OK?", pl: "Wszystko w porządku?" },
    { kto: "Ty", en: "I want my mum.", pl: "Chcę do mamy." },
    { kto: "nauczycielka", en: "It's OK. Mum is coming after school.", pl: "Już dobrze. Mama przyjdzie po szkole." },
    { kto: "nauczycielka", en: "Come and sit with me.", pl: "Chodź, usiądź ze mną." },
    { kto: "Ty", en: "OK. Thank you.", pl: "Dobrze. Dziękuję." },
  ],
  "I'm stuck.": [
    { kto: "nauczycielka", en: "How is your work going?", pl: "Jak idzie praca?" },
    { kto: "Ty", en: "I'm stuck.", pl: "Utknąłem." },
    { kto: "nauczycielka", en: "Let's have a look together.", pl: "Spójrzmy na to razem." },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję." },
    { kto: "nauczycielka", en: "You can do it!", pl: "Dasz radę!" },
  ],
  "How do you say it in English?": [
    { kto: "Ty", en: "How do you say it in English?", pl: "Jak to jest po angielsku? (pokazujesz palcem)" },
    { kto: "kolega", en: "That's a ruler!", pl: "To jest „ruler” — linijka!" },
    { kto: "Ty", en: "A ruler! Thank you!", pl: "Ruler! Dzięki! (powtórz nowe słowo — tak się je łapie)" },
    { kto: "kolega", en: "You're welcome.", pl: "Nie ma za co." },
  ],
  "What does it mean?": [
    { kto: "nauczycielka", en: "Put it in your tray.", pl: "Włóż to do swojej szufladki." },
    { kto: "Ty", en: "What does it mean?", pl: "Co to znaczy?" },
    { kto: "nauczycielka", en: "This box here. Look.", pl: "Ta szufladka, o tu. Patrz." },
    { kto: "Ty", en: "Ah! Thank you.", pl: "Aha! Dziękuję." },
  ],
  "Can you say that again, please?": [
    { kto: "nauczycielka", en: "Bring your book tomorrow.", pl: "Przynieś jutro książkę." },
    { kto: "Ty", en: "Can you say that again, please?", pl: "Możesz powtórzyć?" },
    { kto: "nauczycielka", en: "Your book. Tomorrow. OK?", pl: "Książkę. Jutro. Dobrze?" },
    { kto: "Ty", en: "My book. Tomorrow. OK!", pl: "Moja książka. Jutro. Jasne! (powtórzenie działa jak potwierdzenie)" },
  ],
  // --- Co mówi nauczyciel ---
  "Here!": [
    { kto: "nauczycielka", en: "Register time. Listen for your name.", pl: "Sprawdzam obecność. Słuchaj swojego imienia." },
    { kto: "nauczycielka", en: "Anna?", pl: "Anna?" },
    { kto: "kolega", en: "Here!", pl: "Jestem! (najpierw słyszysz, jak odpowiadają inni)" },
    { kto: "nauczycielka", en: "And now — you!", pl: "A teraz — ty!" },
    { kto: "Ty", en: "Here!", pl: "Jestem!" },
  ],
  "I've finished.": [
    { kto: "nauczycielka", en: "Keep working, everyone.", pl: "Pracujcie dalej." },
    { kto: "Ty", en: "I've finished.", pl: "Skończyłem." },
    { kto: "nauczycielka", en: "Well done! Read your book now.", pl: "Brawo! Teraz poczytaj książkę." },
    { kto: "Ty", en: "OK!", pl: "Dobrze!" },
  ],
  // --- Zagadać do dzieci ---
  "What's your name?": [
    { kto: "Ty", en: "Hello!", pl: "Cześć!" },
    { kto: "kolega", en: "Hello!", pl: "Cześć!" },
    { kto: "Ty", en: "What's your name?", pl: "Jak masz na imię?" },
    { kto: "kolega", en: "Ben. What's your name?", pl: "Ben. A ty jak masz na imię?" },
    { kto: "Ty", en: "Nice to meet you.", pl: "(powiedz swoje imię i dodaj:) Miło cię poznać." },
  ],
  "Can I play with you?": [
    { kto: "Ty", en: "Can I play with you?", pl: "Mogę się z wami pobawić?" },
    { kto: "kolega", en: "You're in my team!", pl: "Jesteś w mojej drużynie!" },
    { kto: "Ty", en: "Thank you.", pl: "Dzięki!" },
    { kto: "kolega", en: "You're it!", pl: "Ty gonisz! (to berek)" },
    { kto: "Ty", en: "OK! Here I come!", pl: "Dobra! Już biegnę!" },
  ],
  "Do you want to play?": [
    { kto: "Ty", en: "Do you want to play?", pl: "Chcesz się pobawić?" },
    { kto: "kolega", en: "Yes! Let's play tag!", pl: "Tak! Pobawmy się w berka!" },
    { kto: "Ty", en: "How do you play?", pl: "Jak się w to gra? (najprzydatniejsze pytanie na placu zabaw)" },
    { kto: "kolega", en: "Run! I catch you!", pl: "Biegnij! Ja łapię!" },
    { kto: "Ty", en: "OK! Here I come!", pl: "Dobra! Już biegnę!" },
  ],
  "It's my turn.": [
    { kto: "kolega", en: "Me again!", pl: "Jeszcze raz ja!" },
    { kto: "Ty", en: "It's my turn.", pl: "Teraz moja kolej." },
    { kto: "kolega", en: "Oh, OK. Here you are.", pl: "No dobra. Proszę." },
    { kto: "Ty", en: "Thank you. Then it's your turn.", pl: "Dzięki. Potem twoja kolej. (uczciwość działa w obie strony)" },
  ],
  "That's not fair.": [
    { kto: "kolega", en: "I win again! Ha ha!", pl: "Znowu wygrywam!" },
    { kto: "Ty", en: "That's not fair.", pl: "To nie fair." },
    { kto: "kolega", en: "OK, let's take turns.", pl: "Dobra, gramy na zmianę." },
    { kto: "Ty", en: "OK. You first.", pl: "Dobra. Ty pierwszy. (wielkoduszność kończy spór)" },
  ],
  "Stop it, please.": [
    { kto: "kolega", en: "Give me your hat!", pl: "Dawaj czapkę!" },
    { kto: "Ty", en: "Stop it, please.", pl: "Przestań, proszę." },
    { kto: "kolega", en: "Sorry.", pl: "Przepraszam." },
    { kto: "Ty", en: "Do you want to play?", pl: "Chcesz się pobawić? (zgoda — i od razu nowy początek)" },
    { kto: "kolega", en: "Yes!", pl: "Tak!" },
  ],
  "See you tomorrow.": [
    { kto: "kolega", en: "My mum is here. Bye!", pl: "Jest moja mama. Pa!" },
    { kto: "Ty", en: "See you tomorrow.", pl: "Do jutra." },
    { kto: "kolega", en: "See you! Same team tomorrow?", pl: "Na razie! Jutro ta sama drużyna?" },
    { kto: "Ty", en: "Yes! Goodbye!", pl: "Tak! Do widzenia!" },
  ],
  // --- Grzeczność ---
  "Yes, please.": [
    { kto: "pani ze stołówki", en: "Would you like some chips?", pl: "Chcesz frytek?" },
    { kto: "Ty", en: "Yes, please.", pl: "Tak, poproszę." },
    { kto: "pani ze stołówki", en: "Here you are.", pl: "Proszę bardzo." },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję. (pełna pętla: prośba → podanie → podziękowanie)" },
  ],
  "No, thank you.": [
    { kto: "pani ze stołówki", en: "More peas?", pl: "Jeszcze groszku?" },
    { kto: "Ty", en: "No, thank you.", pl: "Nie, dziękuję." },
    { kto: "pani ze stołówki", en: "Some water?", pl: "Trochę wody?" },
    { kto: "Ty", en: "Yes, please.", pl: "Tak, poproszę. (jedna scenka — obie odpowiedzi)" },
  ],
  "Thank you.": [
    { kto: "nauczycielka", en: "Here's your sticker!", pl: "Proszę, twoja naklejka!" },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję." },
    { kto: "nauczycielka", en: "You worked hard today.", pl: "Napracowałeś się dzisiaj." },
    { kto: "Ty", en: "I'm happy!", pl: "Cieszę się!" },
  ],
  "You're welcome.": [
    { kto: "kolega", en: "Thanks for the crisps!", pl: "Dzięki za chipsy!" },
    { kto: "Ty", en: "You're welcome.", pl: "Proszę bardzo." },
    { kto: "kolega", en: "Do you want one?", pl: "Chcesz jednego?" },
    { kto: "Ty", en: "Yes, please.", pl: "Tak, poproszę." },
  ],
  "Excuse me.": [
    { kto: "Ty", en: "Excuse me.", pl: "Przepraszam…" },
    { kto: "nauczycielka", en: "Yes? How can I help?", pl: "Tak? W czym pomóc?" },
    { kto: "Ty", en: "Can I have some water, please?", pl: "Czy mogę prosić o wodę?" },
    { kto: "nauczycielka", en: "Of course, here you are.", pl: "Oczywiście, proszę." },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję." },
  ],
  "Here you are.": [
    { kto: "kolega", en: "Can I borrow a pencil?", pl: "Pożyczysz mi ołówek?" },
    { kto: "Ty", en: "Here you are.", pl: "Proszę." },
    { kto: "kolega", en: "Thanks!", pl: "Dzięki!" },
    { kto: "Ty", en: "You're welcome.", pl: "Nie ma za co." },
  ],
  "Nice to meet you.": [
    { kto: "kolega", en: "I'm Ben.", pl: "Jestem Ben." },
    { kto: "Ty", en: "Nice to meet you.", pl: "Miło cię poznać." },
    { kto: "kolega", en: "Do you want to play?", pl: "Chcesz się pobawić?" },
    { kto: "Ty", en: "Yes! Come on!", pl: "Tak! Chodź!" },
  ],
  "Bless you!": [
    { kto: "kolega", en: "Achoo!", pl: "Apsik!" },
    { kto: "Ty", en: "Bless you!", pl: "Na zdrowie!" },
    { kto: "kolega", en: "Thank you!", pl: "Dziękuję!" },
    { kto: "kolega", en: "Achoo! Achoo!", pl: "Apsik! Apsik!" },
    { kto: "Ty", en: "Bless you, bless you!", pl: "Na zdrowie, na zdrowie! (dzieci uwielbiają ten bis)" },
  ],
  // --- Poranek ---
  "I'm ready.": [
    { kto: "rodzic", en: "Time to go! Shoes on!", pl: "Wychodzimy! Buty!" },
    { kto: "Ty", en: "I'm ready.", pl: "Jestem gotowy." },
    { kto: "rodzic", en: "Coat and book bag?", pl: "Kurtka i torba są?" },
    { kto: "Ty", en: "Yes! Let's go!", pl: "Tak! Idziemy!" },
  ],
  "Where are my shoes?": [
    { kto: "Ty", en: "Where are my shoes?", pl: "Gdzie są moje buty?" },
    { kto: "rodzic", en: "Look under your bed!", pl: "Zajrzyj pod łóżko!" },
    { kto: "Ty", en: "Got them! Thank you!", pl: "Mam je! Dzięki!" },
    { kto: "rodzic", en: "Quick, put them on!", pl: "Szybko, zakładaj!" },
  ],
  "I can do it myself.": [
    { kto: "rodzic", en: "Let me zip up your coat.", pl: "Zapnę ci kurtkę." },
    { kto: "Ty", en: "I can do it myself.", pl: "Sam to zrobię." },
    { kto: "rodzic", en: "OK, show me!", pl: "Dobrze, pokaż!" },
    { kto: "Ty", en: "Look! I did it!", pl: "Patrz! Zrobiłem to!" },
    { kto: "rodzic", en: "Well done!", pl: "Brawo!" },
  ],
  "Just a minute.": [
    { kto: "rodzic", en: "Hurry up! We're late!", pl: "Pospiesz się! Jesteśmy spóźnieni!" },
    { kto: "Ty", en: "Just a minute.", pl: "Chwileczkę." },
    { kto: "rodzic", en: "One minute. I'm counting!", pl: "Minuta. Liczę!" },
    { kto: "Ty", en: "I'm ready.", pl: "Jestem gotowy. (domknięcie tym samym zwrotem, co rano)" },
  ],
  "I forgot.": [
    { kto: "nauczycielka", en: "Where's your PE kit?", pl: "Gdzie twój strój na WF?" },
    { kto: "Ty", en: "I forgot.", pl: "Zapomniałem." },
    { kto: "nauczycielka", en: "Never mind. Borrow one today.", pl: "Nic nie szkodzi. Na dziś pożycz." },
    { kto: "Ty", en: "Thank you. Sorry!", pl: "Dziękuję. Przepraszam!" },
    { kto: "nauczycielka", en: "Bring it tomorrow, OK?", pl: "Przynieś jutro, dobrze?" },
  ],
  // --- Obiad w szkole ---
  "I'm hungry.": [
    { kto: "Ty", en: "I'm hungry.", pl: "Jestem głodny." },
    { kto: "rodzic", en: "Lunch is nearly ready.", pl: "Obiad prawie gotowy." },
    { kto: "Ty", en: "What's for lunch?", pl: "Co na obiad?" },
    { kto: "rodzic", en: "Fish and chips!", pl: "Ryba z frytkami!" },
    { kto: "Ty", en: "Yummy!", pl: "Pycha!" },
  ],
  "I'm thirsty.": [
    { kto: "Ty", en: "I'm thirsty.", pl: "Chce mi się pić." },
    { kto: "rodzic", en: "Here's some water.", pl: "Proszę, woda." },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję." },
    { kto: "rodzic", en: "Fill up your water bottle.", pl: "Napełnij też swój bidon." },
  ],
  "Can I have some water, please?": [
    { kto: "pani ze stołówki", en: "Anything else?", pl: "Coś jeszcze?" },
    { kto: "Ty", en: "Can I have some water, please?", pl: "Czy mogę prosić o wodę?" },
    { kto: "pani ze stołówki", en: "Of course, here you are.", pl: "Oczywiście, proszę." },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję." },
  ],
  "I don't like it.": [
    { kto: "pani ze stołówki", en: "It's fish pie today.", pl: "Dziś zapiekanka rybna." },
    { kto: "Ty", en: "I don't like it.", pl: "Nie lubię tego." },
    { kto: "pani ze stołówki", en: "Try a little bit.", pl: "Spróbuj troszeczkę." },
    { kto: "Ty", en: "OK... Mmm, not bad!", pl: "No dobrze… Mmm, niezłe!" },
    { kto: "pani ze stołówki", en: "There you go!", pl: "No widzisz!" },
  ],
  "It's yummy!": [
    { kto: "rodzic", en: "Do you like the pasta?", pl: "Smakuje ci makaron?" },
    { kto: "Ty", en: "It's yummy!", pl: "Pyszne!" },
    { kto: "rodzic", en: "Would you like some more?", pl: "Chcesz dokładkę?" },
    { kto: "Ty", en: "Yes, please.", pl: "Tak, poproszę." },
  ],
  // --- Kiedy coś boli ---
  "It hurts.": [
    { kto: "nauczycielka", en: "What happened? Show me.", pl: "Co się stało? Pokaż." },
    { kto: "Ty", en: "It hurts.", pl: "Boli." },
    { kto: "nauczycielka", en: "Let's get an ice pack.", pl: "Przyniosę zimny okład." },
    { kto: "nauczycielka", en: "Better now?", pl: "(po chwili) Lepiej?" },
    { kto: "Ty", en: "Yes, better. Thank you.", pl: "Tak, lepiej. Dziękuję." },
  ],
  "My tummy hurts.": [
    { kto: "Ty", en: "My tummy hurts.", pl: "Boli mnie brzuch." },
    { kto: "nauczycielka", en: "Sit down. I'll call your mum.", pl: "Usiądź. Zadzwonię do mamy." },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję." },
    { kto: "nauczycielka", en: "Mum is coming soon.", pl: "Mama zaraz będzie." },
  ],
  "I feel sick.": [
    { kto: "Ty", en: "I feel sick.", pl: "Niedobrze mi." },
    { kto: "nauczycielka", en: "Come to the office with me.", pl: "Chodź ze mną do sekretariatu." },
    { kto: "Ty", en: "OK.", pl: "Dobrze." },
    { kto: "nauczycielka", en: "Hold my hand. I'm here.", pl: "Złap mnie za rękę. Jestem przy tobie." },
  ],
  "I've hurt my knee.": [
    { kto: "Ty", en: "I've hurt my knee.", pl: "Uderzyłem się w kolano." },
    { kto: "nauczycielka", en: "Let me see. You need a plaster.", pl: "Pokaż. Trzeba przykleić plaster." },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję." },
    { kto: "nauczycielka", en: "All better! Off you go.", pl: "Gotowe! Możesz iść." },
  ],
  "I need help.": [
    { kto: "Ty", en: "I need help.", pl: "Potrzebuję pomocy." },
    { kto: "nauczycielka", en: "I'm coming!", pl: "Już idę!" },
    { kto: "nauczycielka", en: "What happened? Show me.", pl: "Co się stało? Pokaż." },
    { kto: "Ty", en: "My leg hurts.", pl: "Boli mnie noga." },
    { kto: "nauczycielka", en: "Let's get an ice pack.", pl: "Przyniosę zimny okład." },
  ],
  // --- Ubranie i pogoda ---
  "I'm cold.": [
    { kto: "Ty", en: "I'm cold.", pl: "Zimno mi." },
    { kto: "rodzic", en: "Put your jumper on.", pl: "Załóż sweter." },
    { kto: "Ty", en: "Where is my jumper?", pl: "Gdzie jest mój sweter?" },
    { kto: "rodzic", en: "On your peg!", pl: "Na twoim haczyku!" },
  ],
  "I'm hot.": [
    { kto: "Ty", en: "I'm hot.", pl: "Gorąco mi." },
    { kto: "rodzic", en: "Take your jumper off, then.", pl: "To zdejmij sweter." },
    { kto: "Ty", en: "OK. Better now!", pl: "Dobra. Od razu lepiej!" },
    { kto: "rodzic", en: "Put it in your bag.", pl: "Schowaj go do torby." },
  ],
  "It's raining.": [
    { kto: "Ty", en: "It's raining.", pl: "Pada deszcz." },
    { kto: "rodzic", en: "Wellies and coat today!", pl: "Dziś kalosze i kurtka!" },
    { kto: "Ty", en: "Can I take my umbrella?", pl: "Mogę wziąć parasol?" },
    { kto: "rodzic", en: "Yes. Off we go!", pl: "Tak. W drogę!" },
  ],
  "I've lost my jumper.": [
    { kto: "Ty", en: "I've lost my jumper.", pl: "Zgubiłem sweter." },
    { kto: "nauczycielka", en: "Check the lost property box.", pl: "Sprawdź w pudle rzeczy znalezionych." },
    { kto: "Ty", en: "It's here! Thank you!", pl: "Jest tutaj! Dziękuję!" },
    { kto: "nauczycielka", en: "Put your name in it, OK?", pl: "Podpisz go, dobrze? (w Anglii podpisuje się WSZYSTKO)" },
  ],
  "Can I go outside?": [
    { kto: "Ty", en: "Can I go outside?", pl: "Mogę wyjść na dwór?" },
    { kto: "rodzic", en: "Yes, but put your wellies on.", pl: "Tak, ale załóż kalosze." },
    { kto: "Ty", en: "OK! Thank you!", pl: "Dobrze! Dzięki!" },
    { kto: "rodzic", en: "Have fun!", pl: "Baw się dobrze!" },
  ],
  // --- Jak się czuję ---
  "I'm tired.": [
    { kto: "Ty", en: "I'm tired.", pl: "Jestem zmęczony." },
    { kto: "rodzic", en: "Early night tonight, then.", pl: "To dziś wcześniej spać." },
    { kto: "Ty", en: "Can I have a story?", pl: "Mogę dostać bajkę na dobranoc?" },
    { kto: "rodzic", en: "Of course. Teeth first!", pl: "Jasne. Najpierw zęby!" },
  ],
  "I miss my mum.": [
    { kto: "nauczycielka", en: "You look sad. What's wrong?", pl: "Jesteś smutny. Co się dzieje?" },
    { kto: "Ty", en: "I miss my mum.", pl: "Tęsknię za mamą." },
    { kto: "nauczycielka", en: "She'll be here after school.", pl: "Przyjdzie po lekcjach." },
    { kto: "nauczycielka", en: "Let's read a book together.", pl: "Poczytajmy razem książkę." },
    { kto: "Ty", en: "OK. Thank you.", pl: "Dobrze. Dziękuję." },
  ],
  "I'm scared.": [
    { kto: "Ty", en: "I'm scared.", pl: "Boję się." },
    { kto: "rodzic", en: "Hold my hand. I'm here.", pl: "Złap mnie za rękę. Jestem tu." },
    { kto: "Ty", en: "Don't go, OK?", pl: "Nie odchodź, dobrze?" },
    { kto: "rodzic", en: "Don't worry.", pl: "Nie martw się." },
  ],
  "I don't want to.": [
    { kto: "kolega", en: "Jump from the top!", pl: "Skocz z samej góry!" },
    { kto: "Ty", en: "I don't want to.", pl: "Nie chcę." },
    { kto: "kolega", en: "OK, no problem.", pl: "Dobra, nie ma sprawy." },
    { kto: "Ty", en: "Do you want to play?", pl: "Chcesz się pobawić? (odmowa + nowa propozycja = mistrzostwo)" },
    { kto: "kolega", en: "Yes!", pl: "Tak!" },
  ],
  "Leave me alone.": [
    { kto: "kolega", en: "Ha ha, funny hat!", pl: "Ha ha, śmieszna czapka!" },
    { kto: "Ty", en: "Leave me alone.", pl: "Zostaw mnie w spokoju." },
    { kto: "kolega", en: "Sorry.", pl: "Przepraszam." },
    { kto: "Ty", en: "OK.", pl: "W porządku." },
  ],
  "I'm happy!": [
    { kto: "kolega", en: "We won the game!", pl: "Wygraliśmy!" },
    { kto: "Ty", en: "I'm happy!", pl: "Cieszę się!" },
    { kto: "kolega", en: "High five!", pl: "Przybij piątkę!" },
    { kto: "Ty", en: "Yes! Good game!", pl: "Tak! Dobra gra!" },
  ],
  // --- Rzeczy w szkole ---
  "Can I borrow your rubber, please?": [
    { kto: "Ty", en: "Can I borrow your rubber, please?", pl: "Mogę pożyczyć gumkę?" },
    { kto: "kolega", en: "Yes, here you are.", pl: "Jasne, proszę." },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję." },
    { kto: "kolega", en: "You're welcome.", pl: "Nie ma za co." },
    { kto: "Ty", en: "Here you are.", pl: "Proszę, oddaję. (pożyczone się ODDAJE — tym samym zwrotem)" },
  ],
  "I can't find my bag.": [
    { kto: "Ty", en: "I can't find my bag.", pl: "Nie mogę znaleźć torby." },
    { kto: "nauczycielka", en: "Is it on your peg?", pl: "Wisi na twoim haczyku?" },
    { kto: "Ty", en: "It's here! Thank you!", pl: "Jest tutaj! Dziękuję!" },
    { kto: "nauczycielka", en: "Good. Pack up now.", pl: "Dobrze. A teraz się pakuj." },
  ],
  "What's this?": [
    { kto: "Ty", en: "What's this?", pl: "Co to jest?" },
    { kto: "kolega", en: "It's a glue stick.", pl: "To klej w sztyfcie." },
    { kto: "Ty", en: "A glue stick! Thank you!", pl: "Glue stick! Dzięki! (powtórz nowe słowo)" },
    { kto: "kolega", en: "You're welcome.", pl: "Nie ma za co." },
  ],
  "I've lost my pencil.": [
    { kto: "Ty", en: "I've lost my pencil.", pl: "Zgubiłem ołówek." },
    { kto: "nauczycielka", en: "Take a new one from the pot.", pl: "Weź nowy z kubeczka." },
    { kto: "Ty", en: "Thank you.", pl: "Dziękuję." },
    { kto: "nauczycielka", en: "Look under your chair too!", pl: "Zajrzyj też pod krzesło!" },
  ],
  // --- Dzień w szkole ---
  "Is it home time?": [
    { kto: "Ty", en: "Is it home time?", pl: "Czy to już koniec lekcji?" },
    { kto: "nauczycielka", en: "Nearly! Five more minutes.", pl: "Prawie! Jeszcze pięć minut." },
    { kto: "Ty", en: "OK!", pl: "Dobrze!" },
    { kto: "nauczycielka", en: "Tidy up and get your coat.", pl: "Posprzątaj i weź kurtkę." },
  ],
  "When is lunch?": [
    { kto: "Ty", en: "When is lunch?", pl: "Kiedy jest obiad?" },
    { kto: "nauczycielka", en: "After maths. Not long now.", pl: "Po matematyce. Już niedługo." },
    { kto: "Ty", en: "I'm hungry.", pl: "Jestem głodny." },
    { kto: "nauczycielka", en: "Eat your snack at playtime.", pl: "Zjedz przekąskę na przerwie." },
  ],
  "Where do we go now?": [
    { kto: "kolega", en: "Quick, line up!", pl: "Szybko, do rzędu!" },
    { kto: "Ty", en: "Where do we go now?", pl: "Dokąd teraz idziemy?" },
    { kto: "kolega", en: "To the hall. Follow me!", pl: "Na salę. Chodź za mną!" },
    { kto: "Ty", en: "OK! Thank you!", pl: "Dobra! Dzięki!" },
  ],
  // --- nowe tematy (2026-09-30) ---
  "This is my mum.": [
    {
      "kto": "kolega",
      "en": "Hello! Who's that?",
      "pl": "Cześć! Kto to?"
    },
    {
      "kto": "Ty",
      "en": "This is my mum.",
      "pl": "To jest moja mama."
    },
    {
      "kto": "mama",
      "en": "Hi! Come in. Do you want a drink?",
      "pl": "Cześć! Wejdź. Chcesz coś do picia?"
    },
    {
      "kto": "kolega",
      "en": "Yes, please.",
      "pl": "Tak, poproszę."
    },
    {
      "kto": "Ty",
      "en": "Come on!",
      "pl": "Chodź!"
    }
  ],
  "Have you got any brothers or sisters?": [
    {
      "kto": "Ty",
      "en": "Have you got any brothers or sisters?",
      "pl": "Masz rodzeństwo?"
    },
    {
      "kto": "kolega",
      "en": "Yes, a little sister. She's four.",
      "pl": "Tak, młodszą siostrę. Ma cztery lata."
    },
    {
      "kto": "Ty",
      "en": "Cool!",
      "pl": "Fajnie!"
    },
    {
      "kto": "kolega",
      "en": "She's a bit annoying!",
      "pl": "Trochę mnie wkurza!"
    }
  ],
  "Do you want to come to my house?": [
    {
      "kto": "Ty",
      "en": "Do you want to come to my house?",
      "pl": "Chcesz przyjść do mnie?"
    },
    {
      "kto": "kolega",
      "en": "Yes! I'll ask my mum.",
      "pl": "Tak! Zapytam mamę."
    },
    {
      "kto": "Ty",
      "en": "OK!",
      "pl": "Dobra!"
    },
    {
      "kto": "kolega",
      "en": "See you later!",
      "pl": "Na razie!"
    }
  ],
  "Come and see my room!": [
    {
      "kto": "kolega",
      "en": "Wow, I like your house!",
      "pl": "Ale fajny masz dom!"
    },
    {
      "kto": "Ty",
      "en": "Come and see my room!",
      "pl": "Chodź, zobacz mój pokój!"
    },
    {
      "kto": "kolega",
      "en": "Cool! Is that your Lego?",
      "pl": "Super! To twoje klocki Lego?"
    },
    {
      "kto": "Ty",
      "en": "Yes. Let's play!",
      "pl": "Tak. Pobawmy się!"
    }
  ],
  "Where's the toilet?": [
    {
      "kto": "mama kolegi",
      "en": "Wash your hands, tea's ready.",
      "pl": "Umyjcie ręce, kolacja gotowa."
    },
    {
      "kto": "Ty",
      "en": "Where's the toilet?",
      "pl": "Gdzie jest toaleta?"
    },
    {
      "kto": "mama kolegi",
      "en": "Upstairs, on the left.",
      "pl": "Na górze, po lewej."
    },
    {
      "kto": "Ty",
      "en": "Thank you.",
      "pl": "Dziękuję."
    }
  ],
  "Let's play in the garden.": [
    {
      "kto": "kolega",
      "en": "I'm bored.",
      "pl": "Nudzi mi się."
    },
    {
      "kto": "Ty",
      "en": "Let's play in the garden.",
      "pl": "Chodźmy pobawić się w ogrodzie."
    },
    {
      "kto": "kolega",
      "en": "Good idea! Have you got a ball?",
      "pl": "Dobry pomysł! Masz piłkę?"
    },
    {
      "kto": "Ty",
      "en": "Yes! Come on!",
      "pl": "Tak! Chodź!"
    }
  ],
  "Can I play?": [
    {
      "kto": "kolega",
      "en": "We're playing tag.",
      "pl": "Bawimy się w berka."
    },
    {
      "kto": "Ty",
      "en": "Can I play?",
      "pl": "Mogę się z wami bawić?"
    },
    {
      "kto": "kolega",
      "en": "Yes! Come on!",
      "pl": "Tak! Chodź!"
    },
    {
      "kto": "Ty",
      "en": "Thank you!",
      "pl": "Dzięki!"
    }
  ],
  "Let's play hide and seek!": [
    {
      "kto": "kolega",
      "en": "What shall we play?",
      "pl": "W co się bawimy?"
    },
    {
      "kto": "Ty",
      "en": "Let's play hide and seek!",
      "pl": "Zagrajmy w chowanego!"
    },
    {
      "kto": "kolega",
      "en": "OK! I'll count to ten.",
      "pl": "Dobra! Ja liczę do dziesięciu."
    },
    {
      "kto": "Ty",
      "en": "OK!",
      "pl": "Dobra! (biegniesz się schować)"
    },
    {
      "kto": "kolega",
      "en": "Ready or not, here I come!",
      "pl": "Szukam! (dosłownie: gotowi czy nie, idę!)"
    }
  ],
  "I'm it!": [
    {
      "kto": "kolega",
      "en": "Who's it?",
      "pl": "Kto goni?"
    },
    {
      "kto": "Ty",
      "en": "I'm it!",
      "pl": "Ja gonię!"
    },
    {
      "kto": "kolega",
      "en": "Run, everybody!",
      "pl": "Uciekajcie wszyscy!"
    },
    {
      "kto": "Ty",
      "en": "Got you!",
      "pl": "Mam cię! (dotykasz kolegę)"
    },
    {
      "kto": "kolega",
      "en": "Oh no! Now I'm it.",
      "pl": "O nie! Teraz ja gonię."
    }
  ],
  "Catch me!": [
    {
      "kto": "kolega",
      "en": "I'm it! I'm going to get you!",
      "pl": "Ja gonię! Złapię cię!"
    },
    {
      "kto": "Ty",
      "en": "Catch me!",
      "pl": "Złap mnie! (uciekasz)"
    },
    {
      "kto": "kolega",
      "en": "Come back!",
      "pl": "Wracaj!"
    },
    {
      "kto": "Ty",
      "en": "Too slow!",
      "pl": "Za wolno! (śmiejesz się)"
    }
  ],
  "Wait for me!": [
    {
      "kto": "kolega",
      "en": "Come on, let's go to the slide!",
      "pl": "Chodź, biegniemy na zjeżdżalnię!"
    },
    {
      "kto": "Ty",
      "en": "Wait for me!",
      "pl": "Zaczekaj na mnie!"
    },
    {
      "kto": "kolega",
      "en": "OK. Hurry up!",
      "pl": "Dobra. Pospiesz się!"
    },
    {
      "kto": "Ty",
      "en": "I'm coming!",
      "pl": "Już biegnę!"
    }
  ],
  "Can I have a go?": [
    {
      "kto": "kolega",
      "en": "Look, I can skip twenty times!",
      "pl": "Patrz, umiem skoczyć dwadzieścia razy!"
    },
    {
      "kto": "Ty",
      "en": "Can I have a go?",
      "pl": "Mogę spróbować?"
    },
    {
      "kto": "kolega",
      "en": "Yes. Here you are.",
      "pl": "Tak. Proszę."
    },
    {
      "kto": "Ty",
      "en": "Thank you!",
      "pl": "Dzięki!"
    }
  ],
  "What's your dog called?": [
    {
      "kto": "kolega",
      "en": "Hi! This is my dog.",
      "pl": "Cześć! To mój pies."
    },
    {
      "kto": "Ty",
      "en": "What's your dog called?",
      "pl": "Jak się nazywa twój pies?"
    },
    {
      "kto": "kolega",
      "en": "He's called Buddy.",
      "pl": "Nazywa się Buddy."
    },
    {
      "kto": "Ty",
      "en": "Hello, Buddy!",
      "pl": "Cześć, Buddy!"
    }
  ],
  "Can I stroke him?": [
    {
      "kto": "pani z psem",
      "en": "Morning!",
      "pl": "Dzień dobry!"
    },
    {
      "kto": "Ty",
      "en": "Can I stroke him?",
      "pl": "Mogę go pogłaskać?"
    },
    {
      "kto": "pani z psem",
      "en": "Yes, of course. He loves it.",
      "pl": "Tak, oczywiście. Uwielbia to."
    },
    {
      "kto": "Ty",
      "en": "Thank you.",
      "pl": "Dziękuję."
    },
    {
      "kto": "pani z psem",
      "en": "Good boy!",
      "pl": "Grzeczny piesek!"
    }
  ],
  "Is he friendly?": [
    {
      "kto": "pan z psem",
      "en": "Don't worry, he's just saying hello.",
      "pl": "Nie bój się, on tylko się wita."
    },
    {
      "kto": "Ty",
      "en": "Is he friendly?",
      "pl": "Czy on jest łagodny?"
    },
    {
      "kto": "pan z psem",
      "en": "Yes, very friendly. You can stroke him.",
      "pl": "Tak, bardzo. Możesz go pogłaskać."
    },
    {
      "kto": "Ty",
      "en": "OK. Thank you.",
      "pl": "Dobrze. Dziękuję."
    }
  ],
  "Have you got a pet?": [
    {
      "kto": "Ty",
      "en": "Have you got a pet?",
      "pl": "Masz jakieś zwierzątko?"
    },
    {
      "kto": "kolega",
      "en": "Yes, I've got a cat. And you?",
      "pl": "Tak, mam kota. A ty?"
    },
    {
      "kto": "Ty",
      "en": "No. I like dogs.",
      "pl": "Nie. Lubię psy."
    },
    {
      "kto": "kolega",
      "en": "Me too!",
      "pl": "Ja też!"
    }
  ],
  "Look, a squirrel!": [
    {
      "kto": "Ty",
      "en": "Look, a squirrel!",
      "pl": "Patrz, wiewiórka!"
    },
    {
      "kto": "kolega",
      "en": "Where?",
      "pl": "Gdzie?"
    },
    {
      "kto": "Ty",
      "en": "There! In the tree!",
      "pl": "Tam! Na drzewie!"
    },
    {
      "kto": "kolega",
      "en": "Wow, it's so fast!",
      "pl": "Ale szybka!"
    }
  ],
  "There's a fox in the garden!": [
    {
      "kto": "Ty",
      "en": "Mum!",
      "pl": "Mamo!"
    },
    {
      "kto": "rodzic",
      "en": "What is it?",
      "pl": "Co się stało?"
    },
    {
      "kto": "Ty",
      "en": "There's a fox in the garden!",
      "pl": "W ogrodzie jest lis!"
    },
    {
      "kto": "rodzic",
      "en": "Oh yes! Shh, don't scare him.",
      "pl": "O tak! Ciii, nie strasz go."
    },
    {
      "kto": "Ty",
      "en": "OK.",
      "pl": "Dobrze."
    }
  ],
  "What's for tea?": [
    {
      "kto": "mama",
      "en": "Hello! How was your day?",
      "pl": "Cześć! Jak minął dzień?"
    },
    {
      "kto": "Ty",
      "en": "What's for tea?",
      "pl": "Co na kolację?"
    },
    {
      "kto": "mama",
      "en": "Fish fingers and chips.",
      "pl": "Paluszki rybne i frytki."
    },
    {
      "kto": "Ty",
      "en": "Yes! Thank you, Mum!",
      "pl": "Super! Dziękuję, mamo!"
    }
  ],
  "Can I have more, please?": [
    {
      "kto": "tata",
      "en": "You ate all your pasta!",
      "pl": "Zjadłeś cały makaron!"
    },
    {
      "kto": "Ty",
      "en": "Can I have more, please?",
      "pl": "Mogę dostać więcej?"
    },
    {
      "kto": "tata",
      "en": "Of course. Here you are.",
      "pl": "Jasne. Proszę."
    },
    {
      "kto": "Ty",
      "en": "Thank you, Dad.",
      "pl": "Dziękuję, tato."
    }
  ],
  "I'm full.": [
    {
      "kto": "mama",
      "en": "Do you want some more soup?",
      "pl": "Chcesz jeszcze zupy?"
    },
    {
      "kto": "Ty",
      "en": "I'm full.",
      "pl": "Najadłem się."
    },
    {
      "kto": "mama",
      "en": "OK. Well done, you ate it all!",
      "pl": "Dobrze. Brawo, wszystko zjadłeś!"
    },
    {
      "kto": "Ty",
      "en": "Thank you, Mum.",
      "pl": "Dziękuję, mamo."
    }
  ],
  "Can you pass the ketchup, please?": [
    {
      "kto": "tata",
      "en": "Here are your chips.",
      "pl": "Proszę, twoje frytki."
    },
    {
      "kto": "Ty",
      "en": "Can you pass the ketchup, please?",
      "pl": "Podasz mi keczup, proszę?"
    },
    {
      "kto": "tata",
      "en": "Here you are.",
      "pl": "Proszę bardzo."
    },
    {
      "kto": "Ty",
      "en": "Thank you.",
      "pl": "Dziękuję."
    }
  ],
  "Can I get down, please?": [
    {
      "kto": "mama",
      "en": "Well done, you ate it all!",
      "pl": "Brawo, wszystko zjadłeś!"
    },
    {
      "kto": "Ty",
      "en": "Can I get down, please?",
      "pl": "Mogę już wstać od stołu?"
    },
    {
      "kto": "mama",
      "en": "Yes, you can. Put your plate in the sink.",
      "pl": "Tak, możesz. Włóż talerz do zlewu."
    },
    {
      "kto": "Ty",
      "en": "OK!",
      "pl": "Dobrze!"
    }
  ],
  "That was lovely!": [
    {
      "kto": "tata",
      "en": "Did you like your tea?",
      "pl": "Smakowała ci kolacja?"
    },
    {
      "kto": "Ty",
      "en": "That was lovely!",
      "pl": "To było pyszne!"
    },
    {
      "kto": "tata",
      "en": "I'm glad. Do you want some pudding?",
      "pl": "Cieszę się. Chcesz deser?"
    },
    {
      "kto": "Ty",
      "en": "Yes, please!",
      "pl": "Tak, poproszę!"
    }
  ],
  "What day is it today?": [
    {
      "kto": "Ty",
      "en": "What day is it today?",
      "pl": "Jaki dziś jest dzień?"
    },
    {
      "kto": "rodzic",
      "en": "It's Friday.",
      "pl": "Jest piątek."
    },
    {
      "kto": "Ty",
      "en": "Yay!",
      "pl": "Hura!"
    },
    {
      "kto": "rodzic",
      "en": "Yes, it's the weekend tomorrow!",
      "pl": "Tak, jutro weekend!"
    }
  ],
  "It's Monday.": [
    {
      "kto": "nauczycielka",
      "en": "Good morning! What day is it today?",
      "pl": "Dzień dobry! Jaki dziś jest dzień?"
    },
    {
      "kto": "Ty",
      "en": "It's Monday.",
      "pl": "Jest poniedziałek."
    },
    {
      "kto": "nauczycielka",
      "en": "Well done! And tomorrow?",
      "pl": "Brawo! A jutro?"
    },
    {
      "kto": "Ty",
      "en": "Tuesday!",
      "pl": "Wtorek!"
    }
  ],
  "See you on Monday!": [
    {
      "kto": "kolega",
      "en": "Bye! I'm going home.",
      "pl": "Cześć! Idę do domu."
    },
    {
      "kto": "Ty",
      "en": "See you on Monday!",
      "pl": "Do zobaczenia w poniedziałek!"
    },
    {
      "kto": "kolega",
      "en": "See you! Have a good weekend.",
      "pl": "Na razie! Udanego weekendu."
    },
    {
      "kto": "Ty",
      "en": "Thanks! You too.",
      "pl": "Dzięki! Tobie też."
    }
  ],
  "Have a nice weekend!": [
    {
      "kto": "nauczycielka",
      "en": "Bye, everyone!",
      "pl": "Do widzenia wszystkim!"
    },
    {
      "kto": "Ty",
      "en": "Have a nice weekend!",
      "pl": "Miłego weekendu!"
    },
    {
      "kto": "nauczycielka",
      "en": "Thank you! You too.",
      "pl": "Dziękuję! Tobie też."
    },
    {
      "kto": "Ty",
      "en": "Thank you.",
      "pl": "Dziękuję."
    }
  ],
  "What did you do at the weekend?": [
    {
      "kto": "kolega",
      "en": "Hi!",
      "pl": "Cześć!"
    },
    {
      "kto": "Ty",
      "en": "What did you do at the weekend?",
      "pl": "Co robiłeś w weekend?"
    },
    {
      "kto": "kolega",
      "en": "I played football. And you?",
      "pl": "Grałem w piłkę. A ty?"
    },
    {
      "kto": "Ty",
      "en": "I went to the park.",
      "pl": "Byłem w parku."
    },
    {
      "kto": "kolega",
      "en": "Cool!",
      "pl": "Super!"
    }
  ],
  "I went to the park.": [
    {
      "kto": "nauczycielka",
      "en": "What did you do at the weekend?",
      "pl": "Co robiłeś w weekend?"
    },
    {
      "kto": "Ty",
      "en": "I went to the park.",
      "pl": "Byłem w parku."
    },
    {
      "kto": "nauczycielka",
      "en": "Lovely! Did you go on the swings?",
      "pl": "Super! Bujałeś się na huśtawce?"
    },
    {
      "kto": "Ty",
      "en": "Yes.",
      "pl": "Tak."
    }
  ],
  "How much is it?": [
    {
      "kto": "sprzedawca",
      "en": "Hello! Can I help you?",
      "pl": "Dzień dobry! W czym mogę pomóc?"
    },
    {
      "kto": "Ty",
      "en": "How much is it?",
      "pl": "Ile to kosztuje? (pokazujesz zabawkę)"
    },
    {
      "kto": "sprzedawca",
      "en": "It's two pounds.",
      "pl": "Dwa funty."
    },
    {
      "kto": "Ty",
      "en": "OK. Here you are.",
      "pl": "Dobrze. Proszę. (podajesz pieniądze)"
    },
    {
      "kto": "sprzedawca",
      "en": "Thank you!",
      "pl": "Dziękuję!"
    }
  ],
  "Can I have this, please?": [
    {
      "kto": "sprzedawca",
      "en": "Hello! Next, please.",
      "pl": "Dzień dobry! Następny, proszę."
    },
    {
      "kto": "Ty",
      "en": "Can I have this, please?",
      "pl": "Poproszę to."
    },
    {
      "kto": "sprzedawca",
      "en": "Of course. That's one pound.",
      "pl": "Oczywiście. To jeden funt."
    },
    {
      "kto": "Ty",
      "en": "Here you are.",
      "pl": "Proszę."
    },
    {
      "kto": "sprzedawca",
      "en": "Thanks! Here's your change.",
      "pl": "Dzięki! Oto reszta."
    }
  ],
  "Can I pay?": [
    {
      "kto": "rodzic",
      "en": "Right, it's our turn.",
      "pl": "Dobra, teraz my."
    },
    {
      "kto": "Ty",
      "en": "Can I pay?",
      "pl": "Mogę zapłacić?"
    },
    {
      "kto": "rodzic",
      "en": "Yes! Here's the money.",
      "pl": "Tak! Masz pieniądze."
    },
    {
      "kto": "sprzedawca",
      "en": "Thank you. Here's your change.",
      "pl": "Dziękuję. Oto reszta."
    },
    {
      "kto": "Ty",
      "en": "Thank you!",
      "pl": "Dziękuję!"
    }
  ],
  "Can I push the trolley?": [
    {
      "kto": "rodzic",
      "en": "Right, let's get a trolley.",
      "pl": "Dobra, weźmy wózek."
    },
    {
      "kto": "Ty",
      "en": "Can I push the trolley?",
      "pl": "Mogę pchać wózek?"
    },
    {
      "kto": "rodzic",
      "en": "Yes, but go slowly.",
      "pl": "Tak, ale powoli."
    },
    {
      "kto": "Ty",
      "en": "OK!",
      "pl": "Dobrze!"
    }
  ],
  "Thank you, bye!": [
    {
      "kto": "sprzedawca",
      "en": "Here's your bag.",
      "pl": "Proszę, twoja torba."
    },
    {
      "kto": "Ty",
      "en": "Thank you, bye!",
      "pl": "Dziękuję, do widzenia!"
    },
    {
      "kto": "sprzedawca",
      "en": "Bye! Have a nice day!",
      "pl": "Pa! Miłego dnia!"
    }
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
  "I'm stuck.":
    "Klasowe słowo na „utknąłem w zadaniu” — nauczycielki wręcz uczą dzieci mówić „I'm stuck” zamiast siedzieć cicho nad zeszytem. Zupełnie nie wstyd go używać.",
  "How do you say it in English?":
    "Najważniejsze pytanie dziecka uczącego się języka: zamienia każdą rozmowę w lekcję. Warto, żeby weszło w nawyk — dzieci chętnie odpowiadają i lubią rolę nauczyciela.",
  // --- nowe tematy (2026-09-30) ---
  "Do you want to come to my house?": "Brytyjskie dzieci mówią też „Do you want to come round?” — to samo znaczenie, warto, żeby dziecko rozumiało oba. Termin i odbiór ustalają potem rodzice.",
  "Where's the toilet?": "U kogoś w domu Brytyjczycy mówią toilet albo potocznie loo. Grzeczniej: „Can I use the toilet, please?”.",
  "Have you got any brothers or sisters?": "Brytyjskie „have you got”; amerykańskie „do you have” też zrozumieją. To pytanie do kolegi — dziecko nie musi nic mówić o własnej rodzinie.",
  "I'm it!": "W berku ten, kto goni, „is it”. Dzieci krzyczą „You're it!”, gdy kogoś dotkną — tu dziecko uczy się powiedzieć to o sobie.",
  "Can I have a go?": "Bardzo brytyjskie i bardzo częste na placu zabaw. „Can I try?” też zrozumieją, ale od dzieci usłyszy głównie „have a go”.",
  "Wait for me!": "Przydaje się w każdej zabawie i na spacerze. Warto ćwiczyć w biegu: rodzic odbiega kawałek, a dziecko woła „Wait for me!”.",
  "Can I stroke him?": "Stroke to po brytyjsku głaskać. Amerykańskie pet (the dog) też zrozumieją, ale w Anglii mówi się stroke. O psie mówi się him/her — tak robią właściciele.",
  "Is he friendly?": "Friendly o psie znaczy „nie gryzie, jest łagodny”. Anglicy pytają o to przed pogłaskaniem cudzego psa — dobry nawyk.",
  "What's your dog called?": "Brytyjczycy częściej mówią What's he called? niż What's his name? — oba są dobre.",
  "What's for tea?": "W wielu brytyjskich domach (zwłaszcza na północy i w rodzinach z dziećmi) „tea” to kolacja jedzona ok. 17–18. Inni mówią „dinner” — dziecko usłyszy oba.",
  "Can I get down, please?": "Typowo brytyjska, domowa formułka dziecka przy stole: „Mogę zejść (z krzesła)?”. Grzecznie jest zapytać, zanim się wstanie.",
  "That was lovely!": "„Lovely” to jedno z najczęstszych brytyjskich słów — pochwała jedzenia, pogody, rysunku. Warto chwalić nim kolację w domu.",
  "What did you do at the weekend?": "W brytyjskiej szkole to typowe pytanie w poniedziałek rano. Wystarczy, że dziecko odpowie jednym zdaniem z „I went to…” albo „I played…”.",
  "I went to the park.": "Szablon do podmieniania: I went to the shop / swimming / to the cinema. Ćwiczcie z tym, co dziecko naprawdę robiło w weekend.",
  "How much is it?": "Odpowiedź dziecko usłyszy zwykle skrótem: „two fifty” = £2.50, „fifty p” = 50 pensów.",
  "Thank you, bye!": "Przy kasie Brytyjczycy mówią też „Cheers!” albo „Ta!” zamiast „Thank you” — dobrze, żeby dziecko rozpoznawało je ze słuchu.",
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
