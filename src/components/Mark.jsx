// Marca de NM Electroclima: hexágono con rayo (electricidad) y copo (frío).
export default function Mark({ size = 40, title = 'NM Electroclima' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className="mark"
    >
      <polygon points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinejoin="round" />
      <polygon points="32,11 50,21.5 50,42.5 32,53 14,42.5 14,21.5" fill="none" stroke="var(--blue)" strokeWidth="3" strokeLinejoin="round" />
      <polygon points="35,15 23,35 31,35 28,50 41,28 33,28 38,15" fill="var(--orange)" />
      <g stroke="var(--blue)" strokeWidth="2.6" strokeLinecap="round">
        <line x1="32" y1="36" x2="32" y2="50" />
        <line x1="25.5" y1="39.5" x2="38.5" y2="46.5" />
        <line x1="38.5" y1="39.5" x2="25.5" y2="46.5" />
      </g>
    </svg>
  );
}
