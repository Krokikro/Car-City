// Первый кадр героя: лёгкая векторная сцена «ночной город, жёлтый сигнал».
// По PRD (3.4) на её место встанет AVIF-кадр рендера, а на уровне full — секвенция по скроллу.
export function CityScene() {
  return (
    <svg className="city" viewBox="0 0 640 420" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Ночная Москва и такси Car City">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B0B0C" />
          <stop offset="0.7" stopColor="#14202A" />
          <stop offset="1" stopColor="#1B2B36" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#449ACF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#439A9A" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="beam" cx="0" cy="0.5" r="1">
          <stop offset="0" stopColor="#FFD066" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFD066" stopOpacity="0" />
        </radialGradient>
        <pattern id="checker" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#0B0B0C" />
          <rect width="6" height="6" fill="#FFB700" />
          <rect x="6" y="6" width="6" height="6" fill="#FFB700" />
        </pattern>
      </defs>
      <rect width="640" height="420" fill="url(#sky)" />
      {/* Башни Сити */}
      <g fill="url(#glass)" stroke="#26272B">
        <path d="M120 330 L132 120 L170 110 L178 330 Z" />
        <path d="M250 330 L250 60 L290 40 L300 330 Z" />
        <path d="M300 330 L300 150 L330 150 L330 330 Z" />
        <path d="M392 330 L392 130 L452 130 L452 330 Z" />
        <path d="M480 330 L486 190 L520 186 L526 330 Z" />
      </g>
      <g className="windows" fill="#FFD066">
        {[140, 170, 200, 230, 260].map((y) => (
          <rect key={`a${y}`} x="404" y={y} width="10" height="4" opacity="0.5" />
        ))}
        {[90, 130, 170, 210].map((y) => (
          <rect key={`b${y}`} x="266" y={y} width="12" height="4" opacity="0.35" />
        ))}
      </g>
      {/* Дорога */}
      <rect y="330" width="640" height="90" fill="#0B0B0C" />
      <g className="road-marks" fill="#26272B">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} x={i * 90} y="372" width="50" height="4" rx="2" />
        ))}
      </g>
      {/* Такси */}
      <g transform="translate(150 300)">
        <ellipse cx="160" cy="72" rx="170" ry="10" fill="#000" opacity="0.6" />
        <path d="M20 58 C20 40 34 34 60 30 L110 6 C120 2 130 0 150 0 L220 0 C240 0 250 6 262 18 L290 30 C312 34 320 42 320 58 L320 64 L20 64 Z" fill="#FFB700" />
        <path d="M118 12 L150 6 L210 6 L232 12 L250 30 L104 30 Z" fill="#16181B" />
        <rect x="120" y="36" width="96" height="16" fill="url(#checker)" />
        <rect x="160" y="-10" width="30" height="10" rx="3" fill="#FFD066" />
        <circle cx="80" cy="64" r="20" fill="#16181B" stroke="#444" strokeWidth="4" />
        <circle cx="260" cy="64" r="20" fill="#16181B" stroke="#444" strokeWidth="4" />
        <rect x="306" y="38" width="14" height="8" rx="3" fill="#ECECEA" />
        <path className="beam" d="M320 40 L640 0 L640 110 Z" fill="url(#beam)" />
      </g>
    </svg>
  );
}
