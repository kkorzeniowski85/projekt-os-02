"use client";

/**
 * Automatyczny zapis postępu do folderu na dysku (np. folderu Dysku Google).
 *
 * Po co: pobieranie pliku zawodzi w zainstalowanej aplikacji, a kopiowanie
 * tekstu na tablecie jest męczące. Tu rodzic wskazuje folder RAZ, a aplikacja
 * sama nadpisuje w nim plik po każdej zmianie postępu. Jeśli to folder Dysku
 * Google, synchronizacja Dysku zanosi plik na inne urządzenia bez naszego
 * udziału.
 *
 * Ograniczenie, o którym trzeba mówić wprost: to działa tylko na komputerze
 * (Chrome/Edge). Android i iOS nie udostępniają tego mechanizmu przeglądarkom,
 * więc na tablecie zostaje wskazanie pliku ręcznie — ale to już tylko odczyt,
 * raz na jakiś czas, zamiast żonglowania plikami w obie strony.
 *
 * Uchwyt do folderu przechowujemy w IndexedDB: przeglądarka pozwala go zapisać
 * i użyć ponownie po restarcie, po jednorazowym potwierdzeniu uprawnień.
 */

const DB_NAME = "liga-dzwiekow-drive";
const STORE = "handles";
const KEY = "folder-postepu";

/** Stała nazwa pliku — jeden plik, wielokrotnie nadpisywany. */
export const NAZWA_PLIKU = "liga-dzwiekow-postep.json";

type FolderHandle = FileSystemDirectoryHandle;

export function isSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
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

async function zapamietajFolder(handle: FolderHandle): Promise<void> {
  await run("readwrite", (store) => store.put(handle, KEY));
}

async function odczytajFolder(): Promise<FolderHandle | null> {
  try {
    const handle = await run<FolderHandle | undefined>("readonly", (store) => store.get(KEY));
    return handle ?? null;
  } catch {
    return null;
  }
}

export async function zapomnijFolder(): Promise<void> {
  try {
    await run("readwrite", (store) => store.delete(KEY));
  } catch {
    // brak bazy — nie ma czego zapominać
  }
}

/**
 * Uprawnienie do zapisu trzeba sprawdzać za każdym razem — przeglądarka może
 * je cofnąć po restarcie. `withPrompt` pozwala zapytać użytkownika ponownie,
 * ale tylko w reakcji na kliknięcie (inaczej przeglądarka odmówi).
 */
async function maUprawnienie(handle: FolderHandle, withPrompt: boolean): Promise<boolean> {
  const opcje = { mode: "readwrite" as const };
  // @ts-expect-error — API jeszcze nie ma pełnych typów w TS
  if ((await handle.queryPermission(opcje)) === "granted") return true;
  if (!withPrompt) return false;
  // @ts-expect-error — jw.
  return (await handle.requestPermission(opcje)) === "granted";
}

export type StanFolderu = {
  polaczony: boolean;
  nazwaFolderu: string | null;
  wymagaPotwierdzenia: boolean;
};

export async function stanFolderu(): Promise<StanFolderu> {
  const handle = await odczytajFolder();
  if (!handle) return { polaczony: false, nazwaFolderu: null, wymagaPotwierdzenia: false };
  const ok = await maUprawnienie(handle, false);
  return { polaczony: true, nazwaFolderu: handle.name, wymagaPotwierdzenia: !ok };
}

/** Wywoływać wyłącznie z handlera kliknięcia. */
export async function wybierzFolder(): Promise<StanFolderu> {
  // @ts-expect-error — API jeszcze nie ma pełnych typów w TS
  const handle: FolderHandle = await window.showDirectoryPicker({ mode: "readwrite" });
  await zapamietajFolder(handle);
  return { polaczony: true, nazwaFolderu: handle.name, wymagaPotwierdzenia: false };
}

export type WynikZapisu = "zapisano" | "brak-folderu" | "brak-uprawnien" | "blad";

export async function zapiszPostep(tresc: string, withPrompt = false): Promise<WynikZapisu> {
  const handle = await odczytajFolder();
  if (!handle) return "brak-folderu";
  if (!(await maUprawnienie(handle, withPrompt))) return "brak-uprawnien";

  try {
    const plik = await handle.getFileHandle(NAZWA_PLIKU, { create: true });
    const zapis = await plik.createWritable();
    await zapis.write(tresc);
    await zapis.close();
    return "zapisano";
  } catch {
    return "blad";
  }
}
