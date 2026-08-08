"use client";

/**
 * Nagrania głosek zrobione przez rodzica.
 *
 * Trzymane w IndexedDB, bo to jedyne miejsce w przeglądarce, gdzie sensownie
 * mieszczą się pliki dźwiękowe (localStorage przyjmuje tylko tekst i ma ~5 MB).
 *
 * PRYWATNOŚĆ: nagranie nie opuszcza urządzenia. Nie ma tu żadnego wysyłania,
 * żadnego API zewnętrznego i żadnej oceny wymowy — to tylko podmiana wzorca,
 * którego słucha dziecko.
 *
 * Nagrania są per urządzenie i per przeglądarka. Żeby były wszędzie i na stałe,
 * rodzic może je pobrać i wrzucić do public/audio/phonemes/ — wtedy stają się
 * zwykłym plikiem aplikacji.
 */

const DB_NAME = "liga-dzwiekow";
const DB_VERSION = 1;
const STORE = "phoneme-recordings";

export type RecordingMeta = {
  id: string;
  mime: string;
  size: number;
  createdTs: number;
};

type RecordingRow = RecordingMeta & { blob: Blob };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = action(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
      }),
  );
}

/** Adresy blobów trzymamy w pamięci — inaczej każde odtworzenie cieknie. */
const urlCache = new Map<string, string>();

function dropUrl(id: string): void {
  const url = urlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(id);
  }
}

/**
 * Ślady po skasowanych nagraniach.
 *
 * Bez nich synchronizacja przywracałaby nagranie skasowane na jednym
 * urządzeniu: inne urządzenie wciąż by je miało i uznało za nowość do
 * rozesłania. Zapamiętujemy więc SAM FAKT i CZAS skasowania, żeby dało się
 * porównać, co jest świeższe — nagranie czy jego usunięcie.
 */
const TOMBSTONES_KEY = "phonics.recordings.deleted.v1";

export function deletionMarks(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(TOMBSTONES_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

export function markDeleted(id: string, ts = Date.now()): void {
  try {
    localStorage.setItem(TOMBSTONES_KEY, JSON.stringify({ ...deletionMarks(), [id]: ts }));
  } catch {
    // brak miejsca — synchronizacja co najwyżej przywróci nagranie
  }
}

function clearDeletionMark(id: string): void {
  try {
    const marks = deletionMarks();
    if (!(id in marks)) return;
    delete marks[id];
    localStorage.setItem(TOMBSTONES_KEY, JSON.stringify(marks));
  } catch {
    // jw.
  }
}

export async function saveRecording(id: string, blob: Blob, createdTs = Date.now()): Promise<void> {
  const row: RecordingRow = {
    id,
    blob,
    mime: blob.type || "audio/webm",
    size: blob.size,
    createdTs,
  };
  await run("readwrite", (store) => store.put(row));
  // Nowe nagranie unieważnia wcześniejsze skasowanie — inaczej ślad po nim
  // kasowałby je zaraz po zapisaniu.
  clearDeletionMark(id);
  dropUrl(id);
}

export async function deleteRecording(id: string): Promise<void> {
  await run("readwrite", (store) => store.delete(id));
  markDeleted(id);
  dropUrl(id);
}

export async function getRecording(id: string): Promise<RecordingRow | null> {
  try {
    const row = await run<RecordingRow | undefined>("readonly", (store) => store.get(id));
    return row ?? null;
  } catch {
    return null;
  }
}

export async function listRecordings(): Promise<RecordingMeta[]> {
  try {
    const rows = await run<RecordingRow[]>("readonly", (store) => store.getAll());
    return rows.map(({ id, mime, size, createdTs }) => ({ id, mime, size, createdTs }));
  } catch {
    return [];
  }
}

/** Adres do odtworzenia nagrania, albo null gdy go nie ma. */
export async function getRecordingUrl(id: string): Promise<string | null> {
  const cached = urlCache.get(id);
  if (cached) return cached;

  const row = await getRecording(id);
  if (!row) return null;

  const url = URL.createObjectURL(row.blob);
  urlCache.set(id, url);
  return url;
}

/**
 * Wgranie gotowych plików dźwiękowych jako nagrań głosek.
 *
 * Po co: dostarczanie dźwięków na urządzenie z pominięciem internetu i
 * GitHuba. Rodzic wybiera pliki skądkolwiek — z Dysku Google, z pamięci
 * tabletu, z pendrive'a — a one lądują w pamięci urządzenia i działają
 * natychmiast, także offline.
 *
 * Dopasowanie po nazwie pliku: `sh.wav` → głoska `sh`. Pliki o nazwach spoza
 * listy dozwolonych identyfikatorów są pomijane, żeby przypadkowe zaznaczenie
 * całego folderu nie zaśmieciło bazy.
 */
export async function importRecordingFiles(
  files: File[],
  allowedIds: string[],
): Promise<{ imported: string[]; skipped: string[] }> {
  const allowed = new Set(allowedIds);
  const imported: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const id = file.name.replace(/\.[^.]+$/, "");
    if (!allowed.has(id) || file.size === 0) {
      skipped.push(file.name);
      continue;
    }
    try {
      // Typ MIME bywa pusty przy plikach z Dysku — zapisujemy go z rozszerzenia,
      // inaczej odtwarzacz nie wiedziałby, co dostał.
      const type = file.type || mimeFromName(file.name);
      await saveRecording(id, new Blob([await file.arrayBuffer()], { type }));
      imported.push(id);
    } catch {
      skipped.push(file.name);
    }
  }

  return { imported, skipped };
}

function mimeFromName(name: string): string {
  const extension = name.toLowerCase().split(".").pop() ?? "";
  const types: Record<string, string> = {
    wav: "audio/wav",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    webm: "audio/webm",
    ogg: "audio/ogg",
  };
  return types[extension] ?? "audio/wav";
}

/** Rozszerzenie pliku pasujące do formatu, w którym nagrała przeglądarka. */
export function extensionFor(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4") || mime.includes("m4a") || mime.includes("aac")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}
