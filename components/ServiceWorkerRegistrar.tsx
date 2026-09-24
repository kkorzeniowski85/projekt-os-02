"use client";

/**
 * Rejestracja service workera = instalowalna PWA + działanie bez internetu.
 *
 * Offline było jednym z pytań otwartych w briefie; tutaj jest w minimalnej,
 * bezpiecznej wersji: cache'ujemy tylko powłokę aplikacji. Postęp i tak siedzi
 * w localStorage, więc sesja w podróży zadziała.
 *
 * Bez powiadomień push — nie ma po co prosić dziecko o zgody, których nie
 * potrzebujemy.
 */

import { useEffect } from "react";
import { isBusy } from "@/lib/sessionBusy";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    // Nowa wersja aplikacji instaluje się w tle (skipWaiting w sw.js), ale
    // karta/PWA otwarta wcześniej i tylko wznowiona z tła (typowe na tablecie —
    // ikonka nie zawsze robi pełne przeładowanie) dalej pokazuje STARY kod.
    // Po zmianie kontrolera przeładowujemy więc raz — ale:
    //  - nie przy PIERWSZEJ instalacji (kontroler null → SW): strona ma już
    //    aktualny kod, a przeładowanie zgubiłoby rozpoczętą sesję;
    //  - nie na oczach dziecka: dopiero gdy aplikacja zejdzie z ekranu;
    //  - nie w trakcie sesji (lib/sessionBusy.ts): próby siedzą w pamięci do
    //    końca sesji, więc przeładowanie by je zgubiło. Wtedy czekamy na
    //    następne zejście z ekranu, już po sesji.
    // Pomijamy tylko to pierwsze przejęcie — każda następna zmiana kontrolera
    // to już prawdziwa aktualizacja, także na stronie otwartej bez SW.
    let hadController = Boolean(navigator.serviceWorker.controller);
    let pending = false;
    let reloaded = false;
    const reloadWhenHidden = () => {
      if (!pending || reloaded || document.visibilityState !== "hidden") return;
      if (isBusy()) return;
      reloaded = true;
      window.location.reload();
    };
    const onControllerChange = () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      pending = true;
      reloadWhenHidden();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", reloadWhenHidden);

    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    let timer: ReturnType<typeof setInterval> | undefined;
    navigator.serviceWorker
      .register(`${base}/sw.js`, { scope: `${base}/` })
      .then((registration) => {
        // Nowa wersja aplikacji ma się pojawić bez ręcznego czyszczenia cache —
        // sprawdzamy przy każdym uruchomieniu i raz na godzinę przy dłuższym.
        void registration.update();
        timer = setInterval(() => void registration.update(), 60 * 60 * 1000);
      })
      .catch(() => {
        // Brak SW to nie powód do psucia aplikacji — działa dalej online.
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", reloadWhenHidden);
      if (timer) clearInterval(timer);
    };
  }, []);

  return null;
}
