// Ilustraciones de línea (estilo plano técnico). Todo en SVG, sin imágenes externas.
const base = {
  fill: 'none',
  stroke: 'var(--ink)',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function Frame({ children, label, viewBox = '0 0 320 220' }) {
  return (
    <svg viewBox={viewBox} role="img" aria-label={label} className="ill">
      {children}
    </svg>
  );
}

export function IllSplit() {
  return (
    <Frame label="Dibujo de un aire acondicionado split en pared">
      <g {...base}>
        <rect x="40" y="38" width="240" height="68" rx="10" />
        <path d="M40 84h240" />
        <path d="M70 96h180" strokeWidth="1" />
        <rect x="226" y="52" width="38" height="8" rx="2" />
        <circle cx="252" cy="72" r="2.2" fill="var(--orange)" stroke="none" />
      </g>
      <g stroke="var(--blue)" strokeWidth="1.8" fill="none" strokeLinecap="round" className="flow">
        <path d="M80 118c10 10-10 18 0 28s-10 18 0 28" />
        <path d="M130 118c10 10-10 18 0 28s-10 18 0 28" />
        <path d="M180 118c10 10-10 18 0 28s-10 18 0 28" />
        <path d="M230 118c10 10-10 18 0 28s-10 18 0 28" />
      </g>
      <g {...base} strokeWidth="1" stroke="var(--ink-soft)">
        <path d="M40 20v10M280 20v10M40 25h240" />
      </g>
      <text x="160" y="16" textAnchor="middle" className="ill-label">SPLIT · CASSETTE · CONDUCTOS</text>
    </Frame>
  );
}

export function IllCuadro() {
  const breakers = [0, 1, 2, 3, 4, 5];
  return (
    <Frame label="Dibujo de un cuadro eléctrico con interruptores">
      <g {...base}>
        <rect x="52" y="34" width="216" height="150" rx="6" />
        <rect x="64" y="46" width="192" height="126" rx="3" strokeWidth="1" />
        <path d="M76 82h168M76 138h168" strokeWidth="1" stroke="var(--ink-soft)" />
        {breakers.map((i) => (
          <g key={i}>
            <rect x={80 + i * 28} y="92" width="20" height="38" rx="2" />
            <rect
              x={85 + i * 28}
              y={i === 2 ? 98 : 110}
              width="10"
              height="14"
              rx="1"
              fill={i === 2 ? 'var(--orange)' : 'var(--ink)'}
              stroke="none"
            />
          </g>
        ))}
        <path d="M110 34V16M160 34V16M210 34V16" />
      </g>
      <g className="flow" stroke="var(--orange)" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M110 16V8M160 16V8M210 16V8" />
      </g>
      <text x="76" y="64" className="ill-label">230 V · 400 V III</text>
      <text x="76" y="156" className="ill-label">PIA · DIF · SOB</text>
    </Frame>
  );
}

export function IllSolar() {
  return (
    <Frame label="Dibujo de un panel solar fotovoltaico con sol">
      <g stroke="var(--orange)" strokeWidth="2" strokeLinecap="round" fill="none" className="flow">
        <circle cx="260" cy="50" r="16" fill="var(--orange)" stroke="none" />
        <path d="M260 20v-8M260 88v-8M230 50h-8M298 50h-8M239 29l-6-6M287 77l-6-6M281 29l6-6M239 71l-6 6" />
      </g>
      <g {...base}>
        <path d="M40 150l30-80h150l30 80z" />
        <path d="M60 110h170M50 130h190M100 70l-12 80M150 70l-4 80M200 70l4 80" strokeWidth="1" />
        <path d="M130 150v22M150 150v22M110 172h60" />
        <rect x="196" y="160" width="50" height="34" rx="3" />
        <path d="M206 172h30M206 182h18" strokeWidth="1" />
      </g>
      <path d="M170 172h26" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" />
      <text x="40" y="196" className="ill-label">FV · INVERSOR</text>
    </Frame>
  );
}

export function IllFrio() {
  return (
    <Frame label="Dibujo de una cámara frigorífica con termómetro">
      <g {...base}>
        <rect x="46" y="48" width="190" height="136" rx="4" />
        <rect x="62" y="64" width="158" height="104" rx="2" strokeWidth="1" />
        <rect x="80" y="76" width="70" height="14" rx="2" />
        <path d="M86 90v10M104 90v10M122 90v10M140 90v10" strokeWidth="1" />
        <path d="M160 150h50" strokeWidth="1" />
        <rect x="166" y="108" width="44" height="42" rx="2" />
        <circle cx="203" cy="130" r="2" fill="var(--ink)" stroke="none" />
      </g>
      <g stroke="var(--blue)" strokeWidth="1.8" strokeLinecap="round" fill="none" className="flow">
        <path d="M92 112v26M79 118.5l26 13M105 118.5l-26 13" />
      </g>
      <g {...base}>
        <rect x="262" y="48" width="14" height="86" rx="7" />
        <circle cx="269" cy="150" r="14" />
      </g>
      <path d="M269 150V94" stroke="var(--blue)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="269" cy="150" r="8" fill="var(--blue)" stroke="none" />
      <text x="150" y="30" className="ill-label">BAJA TEMP.</text>
    </Frame>
  );
}

// Esquema unifilar del hero: del cuadro salen líneas a cada servicio.
export function HeroSchematic() {
  const wire = { fill: 'none', stroke: 'var(--ink)', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg viewBox="0 0 560 520" role="img" aria-label="Esquema: el cuadro eléctrico alimenta solar, climatización, frío y cocina" className="schematic">
      <g className="draw">
        <path pathLength="1" d="M70 96h120v110" {...wire} />
        <path pathLength="1" d="M190 206v60" {...wire} />
        <path pathLength="1" d="M190 330v34h-90v54" {...wire} />
        <path pathLength="1" d="M300 298h70v-150h110" {...wire} />
        <path pathLength="1" d="M300 298h180" {...wire} />
        <path pathLength="1" d="M300 298h70v150h110" {...wire} />
      </g>
      <g className="pulse" fill="none" stroke="var(--orange)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path pathLength="1" d="M70 96h120v110" />
        <path pathLength="1" d="M190 330v34h-90v54" />
        <path pathLength="1" d="M300 298h70v-150h110" />
        <path pathLength="1" d="M300 298h180" />
        <path pathLength="1" d="M300 298h70v150h110" />
      </g>

      {/* Solar */}
      <g {...wire}>
        <rect x="20" y="62" width="100" height="68" rx="3" fill="var(--paper)" />
        <path d="M20 86h100M20 108h100M53 62v68M86 62v68" strokeWidth="1" />
      </g>
      <text x="20" y="150" className="node-label">FV · SOLAR</text>

      {/* Cuadro */}
      <g {...wire}>
        <rect x="140" y="266" width="160" height="64" rx="4" fill="var(--paper)" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={154 + i * 28} y="280" width="18" height="36" rx="2" fill={i === 1 ? 'var(--orange)' : 'var(--paper)'} />
        ))}
      </g>
      <text x="140" y="254" className="node-label">CUADRO GENERAL</text>

      {/* Clima */}
      <g {...wire}>
        <rect x="480" y="116" width="64" height="64" rx="4" fill="var(--paper)" />
        <circle cx="512" cy="148" r="20" strokeWidth="1.2" />
        <path d="M512 130v36M494 148h36M499 135l26 26M525 135l-26 26" stroke="var(--blue)" strokeWidth="1.6" />
      </g>
      <text x="480" y="104" className="node-label">CLIMA</text>

      {/* Frío */}
      <g {...wire}>
        <rect x="480" y="266" width="64" height="64" rx="4" fill="var(--paper)" />
        <path d="M512 280v36M497 288.5l30 21M527 288.5l-30 21" stroke="var(--blue)" strokeWidth="2" />
      </g>
      <text x="480" y="254" className="node-label">FRÍO</text>

      {/* Cocina */}
      <g {...wire}>
        <rect x="480" y="416" width="64" height="64" rx="4" fill="var(--paper)" />
        <path d="M494 456h36M498 456a14 14 0 0 1 28 0M512 430v8" />
        <path d="M508 424c0-6 8-6 8-12" stroke="var(--orange)" strokeWidth="2" />
      </g>
      <text x="480" y="404" className="node-label">COCINA</text>

      {/* Toma de tierra */}
      <g {...wire}>
        <path d="M70 418h60M82 428h36M94 438h12" />
      </g>
      <text x="20" y="470" className="node-label">TIERRA</text>

      <circle cx="190" cy="206" r="5" fill="var(--ink)" />
      <circle cx="300" cy="298" r="5" fill="var(--ink)" />
    </svg>
  );
}
