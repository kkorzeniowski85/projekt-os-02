"use client";

/**
 * Pytanie przy przerwaniu ćwiczenia w połowie. Wspólne dla obu torów.
 *
 * Sesja zapisuje się normalnie dopiero na końcu, jednym kompletem — bez tego
 * okna przerwanie po ośmiu z dziesięciu zadań kasowało całą pracę bez słowa.
 * Trzy wyjścia zamiast dwóch, bo „← Przerwij" bywa kliknięte przypadkowo przez
 * dziecko: powrót do ćwiczenia musi być równie łatwy jak wyjście.
 *
 * Jest to jeden komponent używany dwa razy, a nie abstrakcja nad dwiema różnymi
 * rzeczami — oba tory zapisują sesję tak samo i mają się tak samo zachować przy
 * przerwaniu. Kopia rozjechałaby się przy pierwszej poprawce.
 *
 * W rundzie bonusowej sesja jest już zapisana (zapis następuje przy wejściu w
 * bonus), więc okno nie pyta o zapis — samo „Wyjdź" niczego nie traci.
 */

import { BigButton, Card } from "@/components/ui";
import { RULES } from "@/lib/progress/rules";

export function InterruptDialog({
  zrobione,
  wszystkich,
  ocenianych,
  zapisane = false,
  onZapisz,
  onWroc,
}: {
  zrobione: number;
  wszystkich: number;
  ocenianych: number;
  /** Sesja już zapisana (runda bonusowa) — wyjście niczego nie traci. */
  zapisane?: boolean;
  onZapisz: () => void;
  onWroc: () => void;
}) {
  const zaMaloDoOceny = ocenianych < RULES.minScoredForStatus;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Przerwać ćwiczenie?"
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/85 p-4 backdrop-blur-sm"
    >
      <Card className="max-w-lg">
        <h2 className="mb-2 text-2xl font-black">Przerwać ćwiczenie?</h2>
        {zapisane ? (
          <p className="mb-5 text-paper/80">
            Sesja jest już zapisana razem z wynikiem — runda bonusowa niczego nie punktuje,
            więc wyjście teraz nic nie traci.
          </p>
        ) : (
          <>
            <p className="mb-1 text-paper/80">
              Zrobione: <strong>{zrobione}</strong> z {wszystkich} zadań.
            </p>
            <p className="mb-5 text-sm text-paper/60">
              {zaMaloDoOceny
                ? "Zapis zachowa tę pracę i pokaże ją w raporcie, ale to za mało zadań, żeby zmienić ocenę — na to trzeba ich więcej."
                : "Zapis zachowa tę pracę razem z wynikiem — dostanie normalną ocenę za tę sesję."}
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          {zapisane ? (
            <BigButton href="/" full>
              Wyjdź
            </BigButton>
          ) : (
            <>
              <BigButton href="/" onClick={onZapisz} full>
                Zapisz i wyjdź
              </BigButton>
              <BigButton href="/" tone="quiet" full>
                Wyjdź bez zapisu
              </BigButton>
            </>
          )}
          <BigButton onClick={onWroc} tone="quiet" full>
            Wróć do ćwiczenia
          </BigButton>
        </div>

        {!zapisane && (
          <p className="mt-4 text-xs text-paper/50">
            „Wyjdź bez zapisu” nie zostawia śladu — to samo ćwiczenie można zacząć od nowa,
            od pierwszego zadania.
          </p>
        )}
      </Card>
    </div>
  );
}
