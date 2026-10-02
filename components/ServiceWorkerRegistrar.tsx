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

/** Ostatnia wersja, dla której ta karta już się przeładowała (bezpiecznik pętli). */
const UPDATE_KEY = "phonics.update-reload.v1";

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

    // NOWE WDROŻENIE BEZ NOWEGO SW. Plik sw.js zmienia się rzadko, a zwykłe
    // wdrożenie (nowe ekrany, treść) go nie rusza — wtedy registration.update()
    // nic nie instaluje, controllerchange nie przychodzi i karta otwarta od
    // dawna (typowe na komputerze: karta wisi, komputer usypia i się budzi)
    // pokazywała stary kod bez końca. Zgłoszenie rodzica 2026-10-02.
    // Dlatego porównujemy wersję wbudowaną w ten kod (NEXT_PUBLIC_BUILD_ID =
    // commit z wdrożenia) z public/deploy.json na serwerze (ten sam commit,
    // scripts/deploy-manifest.mjs). Sprawdzamy przy powrocie na ekran i co
    // godzinę. deploy.json SW przepuszcza prosto do sieci.
    const ownBuild = process.env.NEXT_PUBLIC_BUILD_ID ?? "";
    let visibleSince = Date.now();
    let touchedSinceVisible = false;
    const onTouch = () => {
      touchedSinceVisible = true;
    };
    const checkBuild = async () => {
      if (!ownBuild || reloaded) return;
      let deployedBuild: string;
      try {
        const response = await fetch(`${base}/deploy.json`, { cache: "no-store" });
        if (!response.ok) return;
        const deployed = (await response.json()) as { build?: unknown };
        if (typeof deployed.build !== "string" || deployed.build === ownBuild) return;
        deployedBuild = deployed.build;
      } catch {
        return; // Brak sieci — spróbujemy przy następnej okazji.
      }
      // Bezpiecznik: jedna próba na wersję w tej karcie. Przy bardzo wolnym
      // łączu przeładowanie potrafi znów dostać starą kopię z pamięci SW (czeka
      // na sieć najwyżej 2,5 s) — bez tego kręciłoby się w kółko. SW i tak
      // dociąga nową wersję w tle, więc następne otwarcie ją pokaże.
      try {
        if (sessionStorage.getItem(UPDATE_KEY) === deployedBuild) return;
        sessionStorage.setItem(UPDATE_KEY, deployedBuild);
      } catch {
        // Bez sessionStorage — bez bezpiecznika; nadal najwyżej raz na stronę.
      }
      pending = true;
      // Tuż po powrocie na ekran, zanim ktoś czegokolwiek dotknął i poza
      // ćwiczeniem: przeładowanie jest niezauważalne (ekran dopiero się
      // pojawił) — od razu nowa wersja. W każdej innej chwili czekamy, aż
      // aplikacja zejdzie z ekranu (reloadWhenHidden), jak przy nowym SW.
      if (
        document.visibilityState === "visible" &&
        !touchedSinceVisible &&
        Date.now() - visibleSince < 5000 &&
        !isBusy()
      ) {
        reloaded = true;
        window.location.reload();
        return;
      }
      reloadWhenHidden();
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      visibleSince = Date.now();
      touchedSinceVisible = false;
      void checkBuild();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", onTouch, { passive: true });
    window.addEventListener("keydown", onTouch);
    const buildTimer = setInterval(() => void checkBuild(), 60 * 60 * 1000);
    void checkBuild();

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
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", onTouch);
      window.removeEventListener("keydown", onTouch);
      clearInterval(buildTimer);
      if (timer) clearInterval(timer);
    };
  }, []);

  return null;
}
