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

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker
      .register(`${base}/sw.js`, { scope: `${base}/` })
      .then((registration) => {
        // Nowa wersja aplikacji ma się pojawić bez ręcznego czyszczenia cache —
        // sprawdzamy przy każdym uruchomieniu i raz na godzinę przy dłuższym.
        void registration.update();
        setInterval(() => void registration.update(), 60 * 60 * 1000);
      })
      .catch(() => {
        // Brak SW to nie powód do psucia aplikacji — działa dalej online.
      });
  }, []);

  return null;
}
