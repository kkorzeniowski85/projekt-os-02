/**
 * To samo słowo nigdy na dwóch ekranach z rzędu (punkt 2 z aplikacji OET
 * rodzica, 2026-11-22). Ekran tuż po ekranie z tym samym słowem zdradza
 * odpowiedź („mug” w „Przeczytaj i pokaż”, zaraz potem „bug / mug / rug”), a
 * pomylone słowo w rundzie bonusowej ma wrócić po przerwie, nie od razu.
 *
 * Zamiany tylko w obrębie tej samej grupy (`groupOf`, zwykle rodzaj
 * ćwiczenia) — kolejność części lekcji zostaje taka, jak ją ułożono.
 */

export function spreadSame<T>(
  items: T[],
  keyOf: (item: T) => string | null,
  groupOf: (item: T) => string = () => "",
): T[] {
  const out = [...items];
  const clashAt = (i: number) => {
    if (i <= 0 || i >= out.length) return false;
    const a = keyOf(out[i - 1]);
    return a !== null && a === keyOf(out[i]);
  };
  const clashesAround = (positions: number[]) =>
    positions.some((p) => clashAt(p) || clashAt(p + 1));

  for (let i = 1; i < out.length; i++) {
    if (!clashAt(i)) continue;
    // Kandydaci: każdy inny ekran tej samej grupy co out[i] albo co out[i-1].
    let fixed = false;
    for (const target of [i, i - 1]) {
      for (let j = 0; j < out.length && !fixed; j++) {
        if (j === i || j === i - 1 || groupOf(out[j]) !== groupOf(out[target])) continue;
        [out[target], out[j]] = [out[j], out[target]];
        if (!clashesAround([target, j])) fixed = true;
        else [out[target], out[j]] = [out[j], out[target]];
      }
      if (fixed) break;
    }
  }
  return out;
}

/** Runda bonusowa: pomylone ekrany na koniec, ale nie tuż po swoim oryginale. */
export function bonusOrder<T>(missed: T[], last: T | undefined, keyOf: (item: T) => string | null): T[] {
  if (!last || missed.length < 2) return missed;
  const lastKey = keyOf(last);
  if (keyOf(missed[0]) !== lastKey) return missed;
  const first = missed.findIndex((item) => keyOf(item) !== lastKey);
  if (first <= 0) return missed;
  return [missed[first], ...missed.filter((_, i) => i !== first)];
}
