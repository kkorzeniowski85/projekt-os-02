/**
 * Tryb testowy — build z NEXT_PUBLIC_TEST_MODE=1 (wersja testowa pod
 * /projekt-os-05/, na TEJ SAMEJ domenie co prawdziwa Liga).
 *
 * Zasada: wersja testowa nie może zmienić prawdziwych danych dziecka ani
 * skrzynki rodziny. Dlatego:
 *  - localStorage: skrypt BETA_STORAGE_SCRIPT (lib/testModeScript.ts; w
 *    <head>, zanim ruszy jakikolwiek kod aplikacji) podmienia metody Storage
 *    tak, że klucze
 *    „phonics.*" i „school.*" trafiają pod „beta.<klucz>". Przy pierwszym
 *    uruchomieniu kopiuje raz prawdziwe wartości do kluczy beta (znacznik
 *    beta.copied.v1) — bez kodów synchronizacji (klucze „*.sync.*"), żeby
 *    kopia nie niosła klucza do skrzynki rodziny. Prawdziwych kluczy nic w
 *    trybie testowym nie zapisuje ani nie kasuje.
 *  - IndexedDB: nagrania rodzica w bazie „beta.liga-dzwiekow" z jednorazową
 *    kopią prawdziwej „liga-dzwiekow" (betaRecordingsReady). Prawdziwą bazę
 *    tylko czytamy — i tylko wtedy, gdy wiadomo, że istnieje (otwarcie
 *    nieistniejącej bazy by ją utworzyło).
 *  - Synchronizacja wyłączona w obu działach (strażnicy w modułach sync), a
 *    dodatkowo skrypt blokuje każde zapytanie do textdb.dev.
 *  - Pasek „Wersja testowa…" na każdej stronie, nazwa „Liga (test)".
 *
 * Service worker wersji testowej ma własny przedrostek cache (lib/cachePrefix.ts).
 */

export const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === "1";

/** Znacznik jednorazowej kopii localStorage (poza przestrzenią aplikacji). */
export const BETA_COPIED_KEY = "beta.copied.v1";
/** Znacznik jednorazowej kopii nagrań rodzica. */
const BETA_RECORDINGS_COPIED_KEY = "beta.recordings-copied.v1";

export const REAL_RECORDINGS_DB = "liga-dzwiekow";
export const BETA_RECORDINGS_DB = `beta.${REAL_RECORDINGS_DB}`;

// --- nagrania rodzica (IndexedDB) -------------------------------------------

type Row = { id: string };

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Wszystkie wiersze magazynu prawdziwej bazy — tylko odczyt, bez tworzenia bazy. */
async function readRealRows(store: string): Promise<Row[]> {
  // Otwarcie nieistniejącej bazy by ją UTWORZYŁO (pustą, w wersji 1) — a
  // prawdziwa Liga nie dołożyłaby wtedy magazynu nagrań. Bez listy baz nie
  // ryzykujemy: wersja testowa startuje po prostu bez nagrań.
  if (typeof indexedDB.databases !== "function") return [];
  const known = await indexedDB.databases();
  if (!known.some((db) => db.name === REAL_RECORDINGS_DB)) return [];

  const open = indexedDB.open(REAL_RECORDINGS_DB);
  // Bez numeru wersji nie ma aktualizacji — a gdyby jednak (baza zniknęła
  // w międzyczasie), przerywamy ją, zanim cokolwiek powstanie.
  open.onupgradeneeded = () => open.transaction?.abort();
  const db = await request(open);
  try {
    if (!db.objectStoreNames.contains(store)) return [];
    return await request(db.transaction(store, "readonly").objectStore(store).getAll() as IDBRequest<Row[]>);
  } finally {
    db.close();
  }
}

async function writeBetaRows(store: string, version: number, rows: Row[]): Promise<void> {
  const open = indexedDB.open(BETA_RECORDINGS_DB, version);
  open.onupgradeneeded = () => {
    if (!open.result.objectStoreNames.contains(store)) {
      open.result.createObjectStore(store, { keyPath: "id" });
    }
  };
  const db = await request(open);
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(store, "readwrite");
      const target = transaction.objectStore(store);
      for (const row of rows) target.put(row);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

let recordingsReady: Promise<void> | null = null;

/**
 * Jednorazowa kopia nagrań rodzica z prawdziwej bazy do bazy beta. Moduł
 * nagrań (lib/recordings.ts) czeka na nią przed pierwszym otwarciem bazy.
 * Nieudana kopia nie blokuje wersji testowej — startuje wtedy bez nagrań.
 */
export function betaRecordingsReady(store: string, version: number): Promise<void> {
  recordingsReady ??= (async () => {
    try {
      if (localStorage.getItem(BETA_RECORDINGS_COPIED_KEY)) return;
      const rows = await readRealRows(store);
      if (rows.length > 0) await writeBetaRows(store, version, rows);
      localStorage.setItem(BETA_RECORDINGS_COPIED_KEY, String(Date.now()));
    } catch {
      // Bez kopii — nagrania testowe zaczynają się od zera.
    }
  })();
  return recordingsReady;
}

/**
 * „Zacznij od świeżej kopii": kasuje WYŁĄCZNIE kopie beta (klucze
 * beta.phonics.*, beta.school.*, znaczniki kopii i bazę beta nagrań). Po
 * przeładowaniu skrypt z <head> skopiuje prawdziwe dane od nowa.
 */
export async function discardBetaCopy(): Promise<void> {
  if (!TEST_MODE) return;
  const storage = window.localStorage;
  // Kasujemy wyłącznie nazwy zaczynające się od „beta." — nakładka ich nie
  // przemapowuje, więc trafiają dokładnie tam, gdzie trzeba, a prawdziwy
  // klucz nie może zniknąć nawet wtedy, gdyby nakładki z jakiegoś powodu nie
  // było (key() pokazałby wtedy prawdziwe nazwy — z nich też robimy „beta.…").
  const betaNames = new Set<string>();
  for (let i = 0; i < storage.length; i++) {
    const name = storage.key(i);
    if (!name) continue;
    const bare = name.startsWith("beta.") ? name.slice("beta.".length) : name;
    if (bare.startsWith("phonics.") || bare.startsWith("school.")) betaNames.add(`beta.${bare}`);
  }
  betaNames.forEach((name) => storage.removeItem(name));
  storage.removeItem(BETA_COPIED_KEY);
  storage.removeItem(BETA_RECORDINGS_COPIED_KEY);
  await new Promise<void>((resolve) => {
    const deletion = indexedDB.deleteDatabase(BETA_RECORDINGS_DB);
    deletion.onsuccess = () => resolve();
    deletion.onerror = () => resolve();
    deletion.onblocked = () => resolve();
  });
}
