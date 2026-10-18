/**
 * Tarcza zegara wskazówkowego. W angielskiej szkole godziny czyta się
 * głównie z tarczy („half past three", „quarter to four"), a Year 3–4 uczy
 * zegara wskazówkowego i cyfr rzymskich na tarczy.
 *
 * SVG: ostre na każdym ekranie, bez plików graficznych, działa offline.
 */

/**
 * Współrzędne zaokrąglone do setnych: Math.sin na serwerze (Node) i w
 * przeglądarce potrafi różnić się w ostatniej cyfrze, a wtedy React zgłasza
 * niezgodność HTML przy wczytaniu strony. Setna część piksela niczego nie zmienia.
 */
const px = (value: number) => Math.round(value * 100) / 100;

export function ClockFace({
  hour,
  minute,
  size = 180,
  highlight = false,
  animate = true,
  hourAngle: hourAngleOverride,
  minuteAngle: minuteAngleOverride,
}: {
  hour: number;
  minute: number;
  size?: number;
  highlight?: boolean;
  /** false w trakcie przeciągania palcem — wskazówka ma iść za palcem bez opóźnienia. */
  animate?: boolean;
  /**
   * Kąty podane wprost (ściąga zegara): wskazówka idzie dokładnie za palcem, a
   * kąt bywa „rozwinięty” poza 360°, żeby przejście przez 12 nie obracało
   * wskazówki o pełny obrót wstecz.
   */
  hourAngle?: number;
  minuteAngle?: number;
}) {
  const hourAngle = hourAngleOverride ?? ((hour % 12) + minute / 60) * 30;
  const minuteAngle = minuteAngleOverride ?? minute * 6;
  const label = `Zegar pokazuje ${hour}:${String(minute).padStart(2, "0")}`;

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={label}>
      <circle
        cx="100"
        cy="100"
        r="94"
        fill="#f5f7ff"
        stroke={highlight ? "#7bed6b" : "#2f6bff"}
        strokeWidth={highlight ? 10 : 8}
      />
      {Array.from({ length: 60 }, (_, i) => {
        const angle = (i * 6 * Math.PI) / 180;
        const major = i % 5 === 0;
        const inner = major ? 76 : 82;
        return (
          <line
            key={i}
            x1={px(100 + inner * Math.sin(angle))}
            y1={px(100 - inner * Math.cos(angle))}
            x2={px(100 + 88 * Math.sin(angle))}
            y2={px(100 - 88 * Math.cos(angle))}
            stroke="#10163a"
            strokeWidth={major ? 3 : 1}
            opacity={major ? 0.9 : 0.35}
          />
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const angle = (n * 30 * Math.PI) / 180;
        return (
          <text
            key={n}
            x={px(100 + 62 * Math.sin(angle))}
            y={px(100 - 62 * Math.cos(angle))}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="17"
            fontWeight="bold"
            fill="#10163a"
          >
            {n}
          </text>
        );
      })}
      {/* Wskazówki rysowane „na 12" i obracane — zmiana godziny (stuknięty
          przykład, ściąga zegara) przesuwa je płynnie, widać ruch. */}
      {/* wskazówka godzinowa: krótka i gruba */}
      <line
        x1="100"
        y1="100"
        x2="100"
        y2="58"
        stroke="#10163a"
        strokeWidth="8"
        strokeLinecap="round"
        className="clock-hand"
        style={{ transform: `rotate(${hourAngle}deg)`, transition: animate ? undefined : "none" }}
      />
      {/* wskazówka minutowa: długa i cienka */}
      <line
        x1="100"
        y1="100"
        x2="100"
        y2="28"
        stroke="#e33d5a"
        strokeWidth="4.5"
        strokeLinecap="round"
        className="clock-hand"
        style={{ transform: `rotate(${minuteAngle}deg)`, transition: animate ? undefined : "none" }}
      />
      <circle cx="100" cy="100" r="6" fill="#10163a" />
    </svg>
  );
}
