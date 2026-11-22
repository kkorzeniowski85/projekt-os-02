# Test akcentu (brytyjski czy amerykański)

Rodzic (2026-11-22): priorytet — lektor ma brzmieć po brytyjsku. Test działa tylko na
tym komputerze: rozpoznawanie głosek wav2vec2 (`facebook/wav2vec2-lv-60-espeak-cv-ft`) i
wzorce eSpeak en-gb / en-us z projektu OET (`D:\OET\OET-fonemy\.venv`).

1. Lista nagrań `[{ "id", "path", "text" }]` (np. z `npm run audio:eleven -- --list`).
2. `D:\OET\OET-fonemy\.venv\Scripts\python.exe -B scripts/akcent/akcent.py lista.json wynik.json`
3. `node scripts/akcent/akcent-flagi.mjs wynik.json flagi.json`

Znaczniki (sprawdzone na nagraniach Edge en-GB — milczą — i en-US — łapią ok. 1/3):
„zebra” jak ZEE-bra, „tomato” jak to-MAY-to, „a” jak æ w słowach typu bath/glass,
amerykańskie miękkie „t” (water, letter), wyraźne „r” po samogłosce (car, park).
Pominięte, bo dawały fałszywe alarmy na brytyjskich nagraniach: końcówka „-er” i „o”
w dog/hot (model uczony na amerykańskich wzorcach). To sito, nie wyrocznia — ostatnie
słowo ma ucho rodzica. Złe nagrania jednego głosu → `scripts/eleven-pominiete.json`.
