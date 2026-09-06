import { useEffect, useState } from 'react';
import type { Tank } from '../../types';

function pctTank(t: Tank) {
  const capa = Number(t.capaciteLitres) || 1;
  const stock = Number(t.stockLitres) || 0;
  const brut = t.remplissagePct ?? (stock / capa) * 100;
  return Math.min(100, Math.max(0, brut));
}

const TAILLES = {
  s: { w: 92, h: 156 },
  m: { w: 140, h: 236 },
  l: { w: 240, h: 400 },
  xl: { w: 380, h: 640 },
};

export function TankVisuel({
  tank,
  taille = 'm',
  anime = true,
}: {
  tank: Tank;
  taille?: 's' | 'm' | 'l' | 'xl';
  anime?: boolean;
}) {
  const cible = pctTank(tank);
  const [pct, setPct] = useState(anime ? 0 : cible);
  useEffect(() => {
    if (!anime) {
      setPct(cible);
      return;
    }
    setPct(0);
    const id = window.setTimeout(() => setPct(cible), 50);
    return () => window.clearTimeout(id);
  }, [cible, anime, tank.id]);

  const alerte = tank.alerteHaut || tank.alerteBas;
  const uid = `tk${tank.id}-${taille}`;
  const dim = TAILLES[taille];
  const cuveH = 168;
  const descente = ((100 - pct) / 100) * cuveH;

  return (
    <div className={`tank-visuel taille-${taille} ${alerte ? 'alerte' : ''}`}>
      <svg viewBox="0 0 200 340" width={dim.w} height={dim.h} role="img" aria-label={`Tank ${tank.code} rempli à ${pct.toFixed(0)} %`}>
        <defs>
          <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2a313c" />
            <stop offset="10%" stopColor="#6d7788" />
            <stop offset="28%" stopColor="#f4f7fb" />
            <stop offset="42%" stopColor="#c9d2de" />
            <stop offset="58%" stopColor="#8b96a8" />
            <stop offset="78%" stopColor="#5a6576" />
            <stop offset="100%" stopColor="#1e2530" />
          </linearGradient>
          <linearGradient id={`${uid}-dôme`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#d5dde7" />
            <stop offset="100%" stopColor="#7d8796" />
          </linearGradient>
          <linearGradient id={`${uid}-fond`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9aa5b5" />
            <stop offset="100%" stopColor="#3d4654" />
          </linearGradient>
          <linearGradient id={`${uid}-huile`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#2c1603" />
            <stop offset="35%" stopColor="#8a4a08" />
            <stop offset="70%" stopColor="#d49216" />
            <stop offset="100%" stopColor="#f6c44a" />
          </linearGradient>
          <radialGradient id={`${uid}-surf`} cx="38%" cy="35%" r="72%">
            <stop offset="0%" stopColor="rgba(255,240,190,0.85)" />
            <stop offset="55%" stopColor="rgba(196,120,20,0.35)" />
            <stop offset="100%" stopColor="rgba(80,40,6,0.2)" />
          </radialGradient>
          <filter id={`${uid}-ombre`} x="-25%" y="-12%" width="150%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="7" floodColor="#0b1524" floodOpacity="0.32" />
          </filter>
          <clipPath id={`${uid}-cuve`}>
            <path d="M40 72 C40 58 160 58 160 72 L160 238 C160 252 40 252 40 238 Z" />
          </clipPath>
        </defs>

        <ellipse cx="100" cy="318" rx="62" ry="10" fill="rgba(12,20,34,0.2)" />

        <path d="M58 250 L50 308 L66 308 L70 250 Z" fill="#4b5568" />
        <path d="M130 250 L134 308 L150 308 L142 250 Z" fill="#4b5568" />
        <rect x="48" y="306" width="20" height="7" rx="1.5" fill="#1f2937" />
        <rect x="132" y="306" width="20" height="7" rx="1.5" fill="#1f2937" />
        <path d="M58 250 L70 250 L66 308 L50 308 Z" fill="#6b7280" opacity="0.35" />

        <g filter={`url(#${uid}-ombre)`}>
          <path d="M40 72 C40 58 160 58 160 72 L160 238 C160 252 40 252 40 238 Z" fill={`url(#${uid}-metal)`} />
          <ellipse cx="100" cy="238" rx="60" ry="16" fill={`url(#${uid}-fond)`} stroke="#2a313c" strokeWidth="1.4" />
          <ellipse cx="100" cy="72" rx="60" ry="20" fill={`url(#${uid}-dôme)`} stroke="#2a313c" strokeWidth="1.6" />
        </g>

        {[98, 138, 178, 218].map((y) => (
          <ellipse key={y} cx="100" cy={y} rx="60" ry="8" fill="none" stroke="rgba(30,37,48,0.28)" strokeWidth="3.2" />
        ))}

        <g clipPath={`url(#${uid}-cuve)`}>
          <g className="tank-huile" style={{ transform: `translate(0, ${descente}px)` }}>
            <rect x="40" y="70" width="120" height="186" fill={`url(#${uid}-huile)`} />
            <ellipse cx="100" cy="76" rx="58" ry="14" fill={`url(#${uid}-surf)`} className="tank-vague" />
          </g>
          <path d="M58 78 C62 130 54 190 60 238" stroke="rgba(255,255,255,0.28)" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M148 86 C144 140 150 196 146 236" stroke="rgba(15,20,30,0.18)" strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>

        <ellipse cx="100" cy="72" rx="60" ry="20" fill="none" stroke="#1e2530" strokeWidth="2" />
        <path d="M40 72 L40 238" stroke="#1e2530" strokeWidth="1.8" fill="none" />
        <path d="M160 72 L160 238" stroke="#1e2530" strokeWidth="1.8" fill="none" />

        {[0, 25, 50, 75, 100].map((m) => {
          const y = 238 - (m / 100) * 160;
          return (
            <g key={m}>
              <line x1="30" y1={y} x2="40" y2={y} stroke="#3d4654" strokeWidth="1.4" />
              <text x="26" y={y + 3} fontSize="9" textAnchor="end" fill="#5b6575">
                {m}
              </text>
            </g>
          );
        })}

        <line x1="168" y1="86" x2="168" y2="230" stroke="#4b5568" strokeWidth="3" />
        {[96, 126, 156, 186, 216].map((y) => (
          <line key={y} x1="160" y1={y} x2="176" y2={y} stroke="#6b7280" strokeWidth="2" />
        ))}

        <rect x="84" y="36" width="32" height="18" rx="3" fill="#374151" />
        <ellipse cx="100" cy="36" rx="20" ry="8" fill="#1f2937" />
        <rect x="78" y="24" width="44" height="14" rx="4" fill="#111827" />
        <circle cx="100" cy="31" r="5" fill="#f0b429" />

        <rect x="158" y="108" width="22" height="9" rx="2" fill="#4b5568" />
        <circle cx="184" cy="112" r="8" fill="#1f2937" stroke="#d1d5db" strokeWidth="1.6" />
        <rect x="20" y="214" width="20" height="9" rx="2" fill="#4b5568" />
        <circle cx="18" cy="218" r="7" fill="#1f2937" stroke="#d1d5db" strokeWidth="1.6" />
      </svg>
      <div className="tank-visuel-pct">{pct.toFixed(0)} %</div>
    </div>
  );
}
