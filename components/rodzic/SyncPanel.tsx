"use client";

/**
 * Synchronizacja i kopie — wspólne dla obu działów.
 *
 *  - Jedna karta z kodem rodziny (Ligi). Włączenie, wyłączenie i zmiana kodu
 *    dotyczą obu działów naraz (lib/familySync.ts); każdy dział dalej
 *    synchronizuje się własnym modułem do własnej skrzynki. Gdy działy na tym
 *    urządzeniu się rozjechały (np. Akademia była wyłączona ręcznie albo
 *    sparowana osobno przed połączeniem), karta mówi o tym wprost i daje jeden
 *    przycisk do wyrównania — sama niczego po cichu nie włącza.
 *  - Dwie kopie zapasowe: plik Dźwięków i plik Akademii (różne formaty, każdy
 *    wczytuje własny magazyn z własnymi pytaniami o reset — bez zmian).
 *  - Wersja aplikacji i „Pobierz najnowszą wersję" (tylko własne cache).
 *
 * Teksty i logika kart wydzielone z paneli obu dawnych aplikacji.
 */

import { useEffect, useRef, useState } from "react";
import { QrCode } from "@/components/QrCode";
import { BigButton, Card } from "@/components/ui";
import { pl } from "@/lib/akademia/pl";
import {
  buildProgressExport as buildAkademiaExport,
  looksLikeLigaFile,
  parseProgressFile as parseAkademiaFile,
  previewImport as previewAkademiaImport,
  progressFileName as akademiaFileName,
} from "@/lib/akademia/progress/merge";
import { useProgress as useAkademiaProgress } from "@/lib/akademia/progress/store";
import * as akademiaSync from "@/lib/akademia/progress/sync";
import { progressCutoff } from "@/lib/akademia/progress/types";
import { CACHE_PREFIX } from "@/lib/cachePrefix";
import {
  disableFamilySync,
  enableFamilySync,
  joinFamilyByShortCode,
  ligaJoinsAkademia,
} from "@/lib/familySync";
import {
  buildProgressExport,
  parseProgressFile,
  progressFileName,
  withoutMarkers,
} from "@/lib/progress/merge";
import { downloadFile } from "@/lib/progress/report";
import { useProgress } from "@/lib/progress/store";
import {
  createShortCode,
  normalizeShortCode,
  pairingLink,
  subscribeSync,
  type SyncStatus,
} from "@/lib/progress/sync";
import { discardBetaCopy, TEST_MODE } from "@/lib/testMode";
import { resetDate, sessionsWord } from "./plural";

/**
 * Kopie z wersji testowej mają w nazwie „TEST-" — żeby nie pomylić ich z
 * prawdziwymi przy wczytywaniu w prawdziwej Lidze.
 */
const BACKUP_NAME_PREFIX = TEST_MODE ? "TEST-" : "";

export function SyncPanel() {
  return (
    <div className="flex flex-col gap-6">
      {TEST_MODE ? <TestModeSyncCard /> : <FamilySyncCard />}
      <BackupsCard />
      <VersionCard />
    </div>
  );
}

/** Wersja testowa: synchronizacji nie ma (lib/testMode.ts) — zamiast karty wyjaśnienie. */
function TestModeSyncCard() {
  const [busy, setBusy] = useState(false);
  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Synchronizacja między urządzeniami</h2>
      <p className="rounded-2xl bg-hero-pink/15 p-3 text-sm text-paper/85">
        <strong>W wersji testowej synchronizacja jest wyłączona</strong> — w obu działach. Ta
        wersja działa na kopii danych z tego urządzenia (zrobionej przy pierwszym uruchomieniu
        wersji testowej) i nigdy nie łączy się ze skrzynką rodziny, więc nic stąd nie trafia do
        prawdziwej Ligi ani Akademii.
      </p>
      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="mb-2 text-sm font-bold text-paper/70">Świeża kopia danych</p>
        <p className="mb-3 text-xs text-paper/50">
          Kasuje wyłącznie kopię testową (postęp obu działów i nagrania głosek wersji testowej)
          i po przeładowaniu kopiuje od nowa aktualne dane prawdziwej Ligi z tego urządzenia.
          Prawdziwych danych to nie dotyka.
        </p>
        <BigButton
          tone="quiet"
          onClick={async () => {
            if (!window.confirm("Skasować kopię testową i zacząć od świeżej kopii prawdziwych danych?")) return;
            setBusy(true);
            await discardBetaCopy();
            window.location.reload();
          }}
        >
          {busy ? "Kopiuję…" : "Zacznij od świeżej kopii"}
        </BigButton>
      </div>
    </Card>
  );
}

function FamilySyncCard() {
  const { requestSync } = useProgress();
  const { requestSync: requestAkademiaSync } = useAkademiaProgress();
  const [message, setMessage] = useState<string | null>(null);
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const [akademia, setAkademia] = useState<akademiaSync.SyncStatus | null>(null);
  const [krotkiKod, setKrotkiKod] = useState<string | null>(null);
  const [kodWTrakcie, setKodWTrakcie] = useState(false);
  const [wpisanyKod, setWpisanyKod] = useState("");
  const [laczenie, setLaczenie] = useState(false);
  useEffect(() => subscribeSync(setSync), []);
  useEffect(() => akademiaSync.subscribeSync(setAkademia), []);

  const requestBoth = () => {
    requestSync();
    requestAkademiaSync();
  };

  // Dźwięki mają kod, a Akademia ani go nie ma, ani nie wyłączyła się ręcznie:
  // jej obieg przejmie kod Ligi sam (adoptFromLiga) — kopniemy go od razu.
  const akademiaPending = Boolean(sync?.enabled && akademia && !akademia.enabled && !akademia.optedOut);
  useEffect(() => {
    if (akademiaPending) requestAkademiaSync();
  }, [akademiaPending, requestAkademiaSync]);

  const akademiaSame = Boolean(sync?.enabled && akademia?.enabled && akademia.code === sync.code);
  const akademiaOther = Boolean(sync?.enabled && akademia?.enabled && akademia.code !== sync.code);
  const akademiaOptedOut = Boolean(sync?.enabled && akademia && !akademia.enabled && akademia.optedOut);
  const akademiaAlone = Boolean(!sync?.enabled && akademia?.enabled);

  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Synchronizacja między urządzeniami</h2>
      {sync?.enabled ? (
        <>
          <p className="mb-3 text-sm text-paper/80">
            <strong className="text-hero-lime">Działa automatycznie.</strong> To urządzenie
            samo wysyła i pobiera postęp obu działów — przy otwarciu aplikacji, po każdej sesji
            i co 3 minuty. Nic nie musisz klikać.
            {sync.lastOkTs && (
              <> Ostatnia synchronizacja Dźwięków: {new Date(sync.lastOkTs).toLocaleTimeString("pl-PL")}.</>
            )}
            {akademiaSame && akademia?.lastOkTs && (
              <> Akademii: {new Date(akademia.lastOkTs).toLocaleTimeString("pl-PL")}.</>
            )}
          </p>
          <p className="mb-3 text-xs text-paper/55">
            Jeden kod rodziny dla obu działów. Dźwięki i Akademia mają pod nim osobne skrzynki,
            więc każdy dział synchronizuje się po swojemu.
          </p>

          {akademiaPending && (
            <p className="mb-3 rounded-2xl bg-black/25 p-3 text-sm text-paper/85">
              Akademia podłącza się do kodu rodziny — za chwilę zsynchronizuje się sama.
            </p>
          )}
          {akademiaOptedOut && (
            <div className="mb-3 rounded-2xl bg-hero-gold/15 p-3 text-sm text-paper/85">
              <p className="mb-2">
                ⚠️ Akademia ma na tym urządzeniu synchronizację wyłączoną ręcznie (decyzja sprzed
                połączenia działów) — jej postęp zostaje tylko tutaj. Dźwięki synchronizują się
                normalnie.
              </p>
              <BigButton
                tone="quiet"
                onClick={() => {
                  akademiaSync.enableSync();
                  requestAkademiaSync();
                  setMessage("Akademia synchronizuje się teraz tym samym kodem rodziny.");
                }}
              >
                Włącz też dla Akademii
              </BigButton>
            </div>
          )}
          {akademiaOther && (
            <div className="mb-3 rounded-2xl bg-hero-gold/15 p-3 text-sm text-paper/85">
              <p className="mb-2">
                ⚠️ Akademia na tym urządzeniu używa innego kodu rodziny niż Dźwięki — urządzenia
                mogą być w dwóch osobnych obiegach. Najprościej przejść na wspólny kod (postęp z
                tego urządzenia zostaje i trafi do wspólnej skrzynki). Urządzenia podłączone
                wcześniej osobnym kodem Akademii trzeba potem podłączyć ponownie — krótkim kodem,
                który pokaże się niżej.
              </p>
              <BigButton
                tone="quiet"
                onClick={() => {
                  akademiaSync.switchToLigaCode();
                  requestAkademiaSync();
                  setMessage("Akademia używa teraz wspólnego kodu rodziny.");
                }}
              >
                Użyj wspólnego kodu
              </BigButton>
            </div>
          )}
          {akademia?.enabled && akademia.codeChangedTs && (
            <div className="mb-3 rounded-2xl bg-hero-gold/15 p-3 text-sm text-paper/85">
              <p className="mb-2">
                ⚠️ Kod rodziny Akademii zmienił się na tym urządzeniu (
                {new Date(akademia.codeChangedTs).toLocaleDateString("pl-PL")}) na wspólny kod.
                Urządzenia podłączone wcześniej osobnym kodem Akademii (np. komputer z dawną
                Akademią Ligi) zostały na starym kodzie i trzeba je podłączyć ponownie: pokaż
                krótki kod niżej i wpisz go tam w polu „Podłącz to urządzenie kodem”.
              </p>
              <BigButton tone="quiet" onClick={() => akademiaSync.dismissCodeChange()}>
                Podłączone — ukryj
              </BigButton>
            </div>
          )}

          {/* Dołączenie do rodziny, która wcześniej czyściła postęp: historia
              tego urządzenia zostaje (przywróceniem) — rodzic powinien o tym
              wiedzieć, bo trafi ona też na pozostałe urządzenia. */}
          {sync.keptOnJoin && (
            <p className="mb-3 rounded-2xl bg-black/25 p-3 text-sm text-paper/85">
              Dźwięki: to urządzenie miało {sync.keptOnJoin.sessions}{" "}
              {sessionsWord(sync.keptOnJoin.sessions)} sprzed wyczyszczenia postępu w tej
              rodzinie ({resetDate(sync.keptOnJoin.resetTs)}).{" "}
              {sync.keptOnJoin.sessions === 1 ? "Została zachowana i trafi" : "Zostały zachowane i trafią"}{" "}
              też na pozostałe urządzenia. Jeśli postęp ma zacząć się od zera, użyj „Wyczyść
              postęp Dźwięków” w zakładce Dźwięki.
            </p>
          )}
          {akademia?.keptOnJoin && (
            <p className="mb-3 rounded-2xl bg-black/25 p-3 text-sm text-paper/85">
              Akademia: to urządzenie miało {pl(akademia.keptOnJoin.sessions, "sesję", "sesje", "sesji")} sprzed
              wyczyszczenia postępu w tej rodzinie ({new Date(akademia.keptOnJoin.resetTs).toLocaleDateString("pl-PL")}).{" "}
              {akademia.keptOnJoin.sessions === 1 ? "Została zachowana i trafi" : "Zostały zachowane i trafią"} też na
              pozostałe urządzenia. Jeśli postęp ma zacząć się od zera, użyj „Wyczyść postęp Akademii” w
              zakładce Akademia.
            </p>
          )}

          {sync.lastError && (
            <p className="mb-3 rounded-2xl bg-hero-pink/15 p-3 text-sm text-paper/85">
              <strong>Dźwięki: </strong>
              {sync.lastError === "brak-sieci" && (
                <>
                  <strong>Nie udało się połączyć z usługą synchronizacji.</strong> Aplikacja
                  spróbuje sama za chwilę, więc pojedyncza wpadka nic nie kosztuje. Jeśli to
                  się powtarza mimo działającego internetu, ruch blokuje zwykle ochrona przed
                  śledzeniem w przeglądarce, rozszerzenie blokujące reklamy albo antywirus —
                  dodaj wyjątek dla adresu <code>textdb.dev</code>.
                </>
              )}
              {sync.lastError === "usluga-odmowila" && (
                <>
                  <strong>Usługa synchronizacji odmówiła.</strong> To zwykle przejściowe —
                  aplikacja spróbuje ponownie. Postęp na urządzeniach jest bezpieczny.
                </>
              )}
              {sync.lastError === "za-duzo-danych" && (
                <>
                  <strong>Postęp przerósł pojemność skrzynki.</strong> Zapisz kopię do pliku
                  i daj znać — trzeba wtedy zmienić sposób przesyłania.
                </>
              )}
              {sync.lastErrorDetail && (
                <span className="mt-1 block text-xs text-paper/50">
                  Szczegół techniczny: {sync.lastErrorDetail}
                </span>
              )}
            </p>
          )}
          {akademia?.enabled && akademia.lastError && (
            <p className="mb-3 rounded-2xl bg-hero-pink/15 p-3 text-sm text-paper/85">
              <strong>Akademia: </strong>
              {akademia.lastError === "brak-sieci" &&
                "Nie udało się połączyć z usługą synchronizacji — aplikacja spróbuje sama za chwilę. Jeśli to się powtarza, sprawdź blokery reklam/antywirus (adres textdb.dev)."}
              {akademia.lastError === "usluga-odmowila" && "Usługa synchronizacji odmówiła — zwykle przejściowo. Postęp na urządzeniach jest bezpieczny."}
              {akademia.lastError === "za-duzo-danych" && "Postęp przerósł pojemność skrzynki. Zapisz kopię do pliku i daj znać."}
              {akademia.lastError === "nowsza-wersja" &&
                "Na innym urządzeniu działa nowsza wersja Akademii. Ta wersja nie nadpisze jej danych — pobierz najnowszą wersję (niżej), a synchronizacja ruszy sama."}
              {akademia.lastErrorDetail && (
                <span className="mt-1 block text-xs text-paper/50">Szczegół: {akademia.lastErrorDetail}</span>
              )}
            </p>
          )}

          {/* Dwie drogi, bo urządzenia są różne: tablet i telefon mają aparat,
              a komputer zwykle nie. Żadna nie wymaga przenoszenia linku. */}
          <div className="mb-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-sm font-bold text-paper/80">Podłącz kolejne urządzenie</p>
            <div className="flex flex-wrap items-start gap-6">
              <div className="w-[190px] shrink-0 text-center">
                <QrCode value={pairingLink() ?? ""} size={190} />
                <p className="mt-2 text-xs text-paper/60">
                  <strong className="text-paper/80">Ma aparat?</strong> Zeskanuj to tabletem
                  albo telefonem — aplikacja otworzy się już podłączona (oba działy).
                </p>
              </div>

              <div className="min-w-[240px] flex-1">
                <p className="mb-2 text-xs text-paper/60">
                  <strong className="text-paper/80">Bez aparatu (np. komputer)?</strong> Pokaż
                  krótki kod i wpisz go tam w polu „Podłącz to urządzenie kodem”.
                </p>
                {krotkiKod ? (
                  <>
                    <p className="rounded-xl bg-white/10 px-4 py-3 text-center font-mono text-3xl font-black tracking-[0.35em] text-hero-gold">
                      {krotkiKod}
                    </p>
                    <p className="mt-2 text-xs text-paper/50">
                      Kod zadziała także później — nie musisz się spieszyć.
                    </p>
                  </>
                ) : (
                  <BigButton
                    tone="quiet"
                    onClick={async () => {
                      setKodWTrakcie(true);
                      const kod = await createShortCode();
                      setKodWTrakcie(false);
                      setKrotkiKod(kod);
                      if (!kod) {
                        setMessage(
                          "Nie udało się przygotować krótkiego kodu — sprawdź połączenie i spróbuj ponownie.",
                        );
                      }
                    }}
                  >
                    {kodWTrakcie ? "Przygotowuję…" : "Pokaż krótki kod"}
                  </BigButton>
                )}
              </div>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-3">
            <BigButton
              tone="quiet"
              onClick={async () => {
                const link = pairingLink();
                if (!link) return;
                try {
                  await navigator.clipboard.writeText(link);
                  setMessage("Link skopiowany.");
                } catch {
                  setMessage("Nie udało się skopiować — użyj kodu QR albo krótkiego kodu.");
                }
              }}
            >
              Kopiuj link
            </BigButton>
            <BigButton
              tone="quiet"
              onClick={() => {
                disableFamilySync();
                setKrotkiKod(null);
                setMessage(
                  "Synchronizacja wyłączona na tym urządzeniu w obu działach. Postęp lokalny zostaje.",
                );
              }}
            >
              Wyłącz
            </BigButton>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-paper/80">
            Włącz na jednym urządzeniu, podłącz pozostałe kodem — i od tej pory postęp obu
            działów ORAZ Twoje nagrania głosek same pojawiają się wszędzie. Bez plików, bez
            Dysku, bez kont. Dane trafiają do skrzynek pod losowym, niezgadywalnym adresem w
            usłudze zewnętrznej.
          </p>
          {akademiaAlone && (
            <div className="mb-3 rounded-2xl bg-hero-gold/15 p-3 text-sm text-paper/85">
              <p className="mb-2">
                ⚠️ Dźwięki nie synchronizują się na tym urządzeniu, ale Akademia tak (sparowana
                osobno albo przed połączeniem działów). Wybierz jedno:
              </p>
              <div className="flex flex-wrap gap-3">
                <BigButton
                  tone="quiet"
                  onClick={() => {
                    if (ligaJoinsAkademia()) {
                      requestBoth();
                      setMessage("Oba działy synchronizują się teraz tym samym kodem rodziny.");
                    } else {
                      setMessage("Nie udało się przejąć kodu Akademii — użyj krótkiego kodu z drugiego urządzenia.");
                    }
                  }}
                >
                  Włącz Dźwięki tym samym kodem
                </BigButton>
                <BigButton
                  tone="quiet"
                  onClick={() => {
                    akademiaSync.disableSync();
                    setMessage("Synchronizacja Akademii wyłączona na tym urządzeniu. Postęp lokalny zostaje.");
                  }}
                >
                  Wyłącz też Akademię
                </BigButton>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pole na kod jest ZAWSZE widoczne — także gdy synchronizacja już
          działa. Inaczej urządzenie, które ma własny obieg, nie miałoby jak
          dołączyć do obiegu pozostałych bez wcześniejszego wyłączania. */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="mb-1 text-sm font-bold text-paper/80">Podłącz to urządzenie kodem</p>
        <p className="mb-3 text-xs text-paper/50">
          Sześcioznakowy kod pokazany na drugim urządzeniu (także w dawnej Lidze Dźwięków albo
          Akademii Ligi). Możesz go wkleić albo wpisać. Podłącza oba działy.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={wpisanyKod}
            onChange={(event) => setWpisanyKod(normalizeShortCode(event.target.value))}
            placeholder="np. K7M2QP"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-12 w-44 rounded-xl bg-black/40 px-4 text-center font-mono text-xl tracking-[0.25em] text-paper placeholder:text-paper/25"
          />
          <BigButton
            onClick={async () => {
              setLaczenie(true);
              const wynik = await joinFamilyByShortCode(wpisanyKod);
              setLaczenie(false);
              if (wynik === "ok") {
                setWpisanyKod("");
                setKrotkiKod(null);
                requestBoth();
                setMessage(
                  "Podłączone. Za chwilę pojawi się tu postęp i nagrania z pozostałych urządzeń.",
                );
              } else if (wynik === "expired") {
                setMessage(
                  "Ten kod wygasł (kody z Akademii Ligi działają godzinę). Pokaż nowy krótki kod na drugim urządzeniu.",
                );
              } else {
                setMessage(
                  "Ten kod nie zadziałał. Sprawdź, czy przepisałeś go dokładnie, i czy na tamtym urządzeniu nadal jest widoczny.",
                );
              }
            }}
          >
            {laczenie ? "Łączę…" : "Podłącz"}
          </BigButton>
        </div>
      </div>

      {!sync?.enabled && (
        <div className="mt-3">
          <BigButton
            onClick={() => {
              enableFamilySync();
              requestBoth();
              setMessage(
                "Synchronizacja włączona dla obu działów. Podłącz pozostałe urządzenia kodem QR albo krótkim kodem.",
              );
            }}
          >
            Włącz automatyczną synchronizację
          </BigButton>
          <p className="mt-2 text-xs text-paper/50">
            To zakłada nowy, własny obieg. Jeśli obieg już gdzieś działa, użyj pola z kodem
            powyżej — inaczej urządzenia trafią do dwóch osobnych obiegów.
          </p>
        </div>
      )}
      {message && (
        <p className="mt-3 rounded-2xl bg-black/25 p-3 text-sm text-paper/85">{message}</p>
      )}
    </Card>
  );
}

function BackupsCard() {
  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Kopie zapasowe</h2>
      <p className="mb-4 text-sm text-paper/70">
        Synchronizacja wystarcza na co dzień. Plik przydaje się jako zabezpieczenie — np. przed
        czyszczeniem danych przeglądarki albo przed „Wyczyść postęp”. Każdy dział ma własny
        plik: kopia Dźwięków nie zawiera Akademii i odwrotnie, więc zapisuj obie.
      </p>
      {TEST_MODE && (
        <p className="mb-4 rounded-2xl bg-hero-pink/15 p-3 text-sm text-paper/85">
          Wersja testowa: kopie zapisane tutaj mają w nazwie „TEST-” i zawierają dane testowe —
          nie wczytuj ich do prawdziwej Ligi.
        </p>
      )}
      <LigaBackup />
      <AkademiaBackup />
    </Card>
  );
}

/** Kopia działu Dźwięki — logika z panelu dawnej Ligi Dźwięków, bez zmian. */
function LigaBackup() {
  const { state, importProgress, previewImport } = useProgress();
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => subscribeSync(setSync), []);

  function exportProgressFile() {
    downloadFile(`${BACKUP_NAME_PREFIX}${progressFileName()}`, buildProgressExport(state), "application/json");
  }

  async function onImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    let text: string;
    try {
      text = await file.text();
    } catch {
      setSyncMessage(
        `Nie udało się otworzyć pliku „${file.name}”. Jeśli wybierasz go z Dysku Google, sprawdź połączenie z internetem i spróbuj ponownie.`,
      );
      return;
    }

    const parsed = parseProgressFile(text);
    if (!parsed) {
      setSyncMessage(
        parseAkademiaFile(text)
          ? `„${file.name}” to kopia Akademii — wczytaj ją przyciskiem „Wczytaj kopię Akademii” niżej.`
          : `Plik „${file.name}” nie wygląda na plik postępu z tej aplikacji (albo pochodzi z innej jej wersji). Szukaj pliku o nazwie liga-dzwiekow-postep-….json.`,
      );
      return;
    }
    let incoming = parsed;
    // Zanim scalimy: kopia sprzed „Wyczyść postęp" zostałaby po cichu pominięta,
    // kopia z nowszym resetem po cichu skasowałaby sesje z tego urządzenia, a
    // kopia z późniejszym przywróceniem po cichu zniosłaby reset zrobiony tutaj.
    // We wszystkich przypadkach decyduje rodzic. Podgląd liczy store na
    // najnowszym stanie — w trakcie odczytu pliku mogła przyjść synchronizacja.
    const preview = previewImport(incoming);
    const kiedy = resetDate(preview.cutoffTs);
    let restore = false;
    if (preview.localCutoffTs > preview.cutoffTs) {
      const n = preview.revivedByFile;
      const wczytac =
        n > 0 &&
        window.confirm(
          `Ta kopia zawiera przywrócenie postępu z ${resetDate(parsed.restoreTs)}, późniejsze ` +
            `niż wyczyszczenie postępu na tym urządzeniu (${resetDate(preview.localCutoffTs)}). ` +
            `Wczytać razem z nim ${n} ${sessionsWord(n)} sprzed tego wyczyszczenia?\n\n` +
            "OK — wczytaj" +
            (sync?.enabled
              ? n === 1
                ? " (wróci też na pozostałych urządzeniach rodziny)"
                : " (wrócą też na pozostałych urządzeniach rodziny)"
              : "") +
            ".\nAnuluj — wczytaj tylko sesje z czasu po wyczyszczeniu na tym urządzeniu.",
        );
      // Bez zgody (albo gdy plik i tak nie ma starszych sesji) wyczyszczenie
      // zrobione tutaj zostaje w mocy.
      if (!wczytac) incoming = withoutMarkers(parsed);
    }
    if (preview.olderInFile > 0) {
      const n = preview.olderInFile;
      restore = window.confirm(
        `Ta kopia ma ${n} ${sessionsWord(n)} sprzed wyczyszczenia postępu (${kiedy}). ` +
          `Przywrócić ${n === 1 ? "ją" : "je"}?\n\n` +
          "OK — przywróć" +
          (sync?.enabled
            ? n === 1
              ? " (wróci też na pozostałych urządzeniach rodziny)"
              : " (wrócą też na pozostałych urządzeniach rodziny)"
            : "") +
          ".\nAnuluj — wczytaj tylko sesje z czasu po wyczyszczeniu.",
      );
    }
    if (!restore && preview.removedLocal > 0) {
      const m = preview.removedLocal;
      const dalej = window.confirm(
        `Ta kopia zawiera wyczyszczenie postępu z ${kiedy}. Wczytanie usunie z tego urządzenia ` +
          `${m} ${sessionsWord(m)} sprzed tej daty` +
          (sync?.enabled ? " (także z pozostałych urządzeń rodziny)" : "") +
          ". Kontynuować?",
      );
      if (!dalej) {
        setSyncMessage("Nie wczytano kopii — postęp na tym urządzeniu jest bez zmian.");
        return;
      }
    }

    const { added, removed } = importProgress(incoming, { restore });
    const czesci: string[] = [];
    if (added > 0) {
      czesci.push(
        restore
          ? `Przywrócono postęp: dodano ${added} ${sessionsWord(added)}.`
          : `Scalono postęp: dodano ${added} ${sessionsWord(added)}.`,
      );
    }
    if (removed > 0) {
      czesci.push(
        `Usunięto ${removed} ${sessionsWord(removed)} sprzed wyczyszczenia postępu (${kiedy}).`,
      );
    }
    if (czesci.length === 0) {
      czesci.push(
        (preview.olderInFile > 0 && !restore) || (incoming !== parsed && preview.revivedByFile > 0)
          ? "Plik wczytany — sesje z tego pliku już tu były albo pochodzą sprzed wyczyszczenia postępu. Nic się nie zmieniło."
          : "Plik wczytany — wszystkie sesje z tego pliku już tu były. Nic się nie zmieniło.",
      );
    } else if (removed === 0) {
      czesci.push("Nic nie zostało nadpisane.");
    }
    setSyncMessage(czesci.join(" "));
  }

  return (
    <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="mb-1 text-sm font-bold text-paper/80">🔤 Dźwięki — czytanie i słowa</p>
      <p className="mb-3 text-xs text-paper/50">
        Plik <code>liga-dzwiekow-postep-….json</code> (ten sam format co w dawnej Lidze
        Dźwięków). Wczytanie scala kopię z tym, co jest na urządzeniu. Gdy kopia ma sesje sprzed
        wyczyszczenia postępu albo sama zawiera późniejsze wyczyszczenie (które usunęłoby
        starsze sesje z tego urządzenia), aplikacja najpierw zapyta.
      </p>
      <div className="flex flex-wrap gap-3">
        <BigButton tone="quiet" onClick={exportProgressFile}>
          Zapisz kopię Dźwięków
        </BigButton>
        <BigButton tone="quiet" onClick={() => importInputRef.current?.click()}>
          Wczytaj kopię Dźwięków
        </BigButton>
        <input
          ref={importInputRef}
          type="file"
          onChange={(event) => void onImportFile(event)}
          className="hidden"
        />
      </div>
      {syncMessage && (
        <p className="mt-3 rounded-2xl bg-black/25 p-3 text-sm text-paper/85">{syncMessage}</p>
      )}
    </div>
  );
}

/** Kopia działu Akademia — logika z panelu dawnej Akademii Ligi, bez zmian. */
function AkademiaBackup() {
  const { importProgress, state } = useAkademiaProgress();
  const [sync, setSync] = useState<akademiaSync.SyncStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => akademiaSync.subscribeSync(setSync), []);

  async function onImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage(null);

    // Plik z Dysku Google na tablecie bywa niedostępny przy słabym łączu —
    // bez try/catch przycisk „nic nie robił" (ta sama poprawka jest w Lidze).
    let text: string;
    try {
      text = await file.text();
    } catch {
      setMessage(
        `Nie udało się otworzyć pliku „${file.name}”. Jeśli wybierasz go z Dysku Google, sprawdź połączenie z internetem i spróbuj ponownie.`,
      );
      return;
    }
    if (looksLikeLigaFile(text)) {
      setMessage(
        `„${file.name}” to kopia działu Dźwięki (Ligi Dźwięków) — wczytaj ją przyciskiem „Wczytaj kopię Dźwięków” wyżej. Kopie Akademii nazywają się akademia-ligi-postep-….json.`,
      );
      return;
    }
    const parsed = parseAkademiaFile(text);
    if (!parsed) {
      setMessage(
        `Plik „${file.name}” nie wygląda na kopię postępu Akademii. Szukaj pliku o nazwie akademia-ligi-postep-….json.`,
      );
      return;
    }
    // Najpierw sprawdzamy, co zrobi scalenie — granica „Wyczyść postęp" potrafi
    // po cichu pominąć sesje z pliku albo usunąć sesje z tego urządzenia.
    const preview = previewAkademiaImport(state, parsed);
    const resetDay = new Date(preview.mergedCutoff).toLocaleDateString("pl-PL");
    let restore = false;
    // Nowszy reset z pliku rozchodzi się synchronizacją jak „Wyczyść postęp" —
    // więc przy włączonej synchronizacji pytamy nawet, gdy tu nic nie zniknie.
    const newerReset = preview.mergedCutoff > progressCutoff(state);
    if (preview.removed > 0 || (newerReset && sync?.enabled)) {
      const here =
        preview.removed > 0
          ? ` Wczytanie usunie z tego urządzenia ${pl(preview.removed, "sesję", "sesje", "sesji")} sprzed tej daty.`
          : "";
      const everywhere = sync?.enabled
        ? " Synchronizacja jest włączona, więc sesje sprzed tej daty znikną też na pozostałych urządzeniach podłączonych kodem rodziny."
        : "";
      const ok = window.confirm(`Ta kopia zawiera wyczyszczenie postępu z ${resetDay}.${here}${everywhere} Kontynuować?`);
      if (!ok) {
        setMessage("Kopia nie została wczytana — postęp na tym urządzeniu bez zmian.");
        return;
      }
    } else if (preview.olderSessions > 0) {
      restore = window.confirm(
        `Ta kopia ma ${pl(preview.olderSessions, "sesję", "sesje", "sesji")} sprzed wyczyszczenia postępu (${resetDay}). Przywrócić je?\n\nOK — przywróć (przy włączonej synchronizacji także na pozostałych urządzeniach).\nAnuluj — wczytaj tylko nowsze.`,
      );
    }

    const { added, removed } = importProgress(parsed, { restore });
    const skipped = restore ? 0 : preview.olderSessions;
    const parts: string[] = [];
    if (added > 0) {
      parts.push(
        restore
          ? `Przywrócono: ${pl(added, "sesja", "sesje", "sesji")} (także sprzed wyczyszczenia postępu).`
          : `Scalono: ${pl(added, "nowa sesja", "nowe sesje", "nowych sesji")}.`,
      );
    }
    if (removed > 0) {
      parts.push(
        `Usunięto z tego urządzenia ${pl(removed, "sesję", "sesje", "sesji")} sprzed wyczyszczenia postępu (${resetDay}).`,
      );
    }
    if (added === 0 && removed === 0) {
      parts.push(skipped > 0 ? "Nic nowego nie doszło." : "Nic nowego — wszystkie sesje z pliku już tu były.");
    }
    if (skipped > 0) {
      parts.push(`Pominięto ${pl(skipped, "sesję", "sesje", "sesji")} sprzed wyczyszczenia postępu (${resetDay}).`);
    }
    setMessage(parts.join(" "));
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="mb-1 text-sm font-bold text-paper/80">🎓 Akademia — tabliczka, matematyka, czytanie, polecenia</p>
      <p className="mb-3 text-xs text-paper/50">
        Plik <code>akademia-ligi-postep-….json</code> (ten sam format co w dawnej Akademii
        Ligi). Wczytanie scala kopię z tym, co jest na urządzeniu; przy wyczyszczeniu postępu
        zapisanym w pliku aplikacja najpierw zapyta.
      </p>
      <div className="flex flex-wrap gap-3">
        <BigButton
          tone="quiet"
          onClick={() =>
            downloadFile(`${BACKUP_NAME_PREFIX}${akademiaFileName()}`, buildAkademiaExport(state), "application/json")
          }
        >
          Zapisz kopię Akademii
        </BigButton>
        <BigButton tone="quiet" onClick={() => fileRef.current?.click()}>
          Wczytaj kopię Akademii
        </BigButton>
        <input ref={fileRef} type="file" onChange={(event) => void onImportFile(event)} className="hidden" />
      </div>
      {message && <p className="mt-3 rounded-2xl bg-black/25 p-3 text-sm text-paper/85">{message}</p>}
    </div>
  );
}

/**
 * Wersja + wymuszenie aktualizacji. Zainstalowana aplikacja potrafi trzymać
 * starą wersję w pamięci mimo poprawnie działającego mechanizmu aktualizacji —
 * to daje sposób, żeby to sprawdzić i naprawić od ręki.
 */
function VersionCard() {
  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Wersja aplikacji</h2>
      <p className="mb-3 text-xs text-paper/50">
        Ta wersja: <code>{(process.env.NEXT_PUBLIC_BUILD_ID ?? "lokalna").slice(0, 7)}</code>.
        Jeśli na jednym urządzeniu brakuje czegoś, co widać na innym, użyj tego przycisku —
        wyczyści pamięć podręczną i pobierze najnowszą wersję. Postępu to nie dotyka.
      </p>
      <BigButton
        tone="quiet"
        onClick={async () => {
          // Tylko WŁASNY service worker i WŁASNA pamięć podręczna (CACHE_PREFIX,
          // ten sam co w sw.js): na tej samej domenie stoją Akademia Ligi,
          // wersja testowa i inne projekty, a getRegistrations() i caches.keys()
          // zwracają rzeczy całej domeny.
          try {
            const zakres = new URL(
              `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`,
              window.location.origin,
            ).href;
            const rejestracje = (await navigator.serviceWorker?.getRegistrations()) ?? [];
            await Promise.all(
              rejestracje.filter((r) => r.scope === zakres).map((r) => r.unregister()),
            );
            const klucze = await caches.keys();
            await Promise.all(
              klucze.filter((k) => k.startsWith(CACHE_PREFIX)).map((k) => caches.delete(k)),
            );
          } catch {
            // Nawet jeśli sprzątanie się nie uda, przeładowanie i tak pomoże.
          }
          window.location.reload();
        }}
      >
        Pobierz najnowszą wersję
      </BigButton>
    </Card>
  );
}
