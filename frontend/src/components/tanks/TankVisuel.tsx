import { useEffect, useState } from 'react';
import type { Tank } from '../../types';

function pctTank(t: Tank) {
  const capa = Number(t.capaciteLitres) || 1;
  const stock = Number(t.stockLitres) || 0;
  const brut = t.remplissagePct ?? (stock / capa) * 100;
  return Math.min(100, Math.max(0, brut));
}

const TAILLES = {
  s: { w: 88, h: 150 },
  m: { w: 128, h: 220 },
  l: { w: 210, h: 360 },
  xl: { w: 280, h: 480 },
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
  const cuveH = 150;
  const descente = ((100 - pct) / 100) * cuveH;

  return (
    <div className={`tank-visuel taille-${taille} ${alerte ? 'alerte' : ''}`}>
      <svg viewBox="0 0 160 280" width={dim.w} height={dim.h} role="img" aria-label={`Tank ${tank.code} rempli à ${pct.toFixed(0)} %`}>
        <defs>
          <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4a5564" />
            <stop offset="14%" stopColor="#9aa6b6" />
            <stop offset="32%" stopColor="#eef3f8" />
            <stop offset="48%" stopColor="#c5ced8" />
            <stop offset="72%" stopColor="#8b96a6" />
            <stop offset="100%" stopColor="#3d4654" />
          </linearGradient>
          <linearGradient id={`${uid}-dôme`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f6f8fb" />
            <stop offset="100%" stopColor="#8d97a6" />
          </linearGradient>
          <linearGradient id={`${uid}-huile`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#4a2806" />
            <stop offset="45%" stopColor="#b86a0c" />
            <stop offset="100%" stopColor="#f0b429" />
          </linearGradient>
          <radialGradient id={`${uid}-surf`} cx="40%" cy="40%" r="70%">
            <stop offset="0%" stopColor="rgba(255,236,180,0.75)" />
            <stop offset="100%" stopColor="rgba(140,70,8,0.15)" />
          </radialGradient>
          <filter id={`${uid}-ombre`} x="-20%" y="-10%" width="140%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#122033" floodOpacity="0.28" />
          </filter>
          <clipPath id={`${uid}-cuve`}>
            <path d="M28 58 C28 50 132 50 132 58 L132 208 C132 218 28 218 28 208 Z" />
          </clipPath>
        </defs>

        <ellipse cx="80" cy="262" rx="48" ry="8" fill="rgba(18,28,45,0.16)" />
        <path d="M42 228 L36 258 L48 258 L52 228 Z" fill="#4b5568" />
        <path d="M108 228 L112 258 L124 258 L118 228 Z" fill="#4b5568" />
        <rect x="38" y="256" width="14" height="5" rx="1" fill="#2f3846" />
        <rect x="108" y="256" width="14" height="5" rx="1" fill="#2f3846" />

        <g filter={`url(#${uid}-ombre)`}>
          <path d="M28 58 C28 50 132 50 132 58 L132 208 C132 218 28 218 28 208 Z" fill={`url(#${uid}-metal)`} />
          <ellipse cx="80" cy="58" rx="52" ry="16" fill={`url(#${uid}-dôme)`} stroke="#3d4654" strokeWidth="1.4" />
          <ellipse cx="80" cy="210" rx="52" ry="12" fill="#6d7786" stroke="#3d4654" strokeWidth="1.2" />
        </g>

        <g clipPath={`url(#${uid}-cuve)`}>
          <g className="tank-huile" style={{ transform: `translate(0, ${descente}px)` }}>
            <rect x="28" y="58" width="104" height="170" fill={`url(#${uid}-huile)`} />
            <ellipse cx="80" cy="62" rx="50" ry="12" fill={`url(#${uid}-surf)`} className="tank-vague" />
          </g>
          <path d="M40 62 C42 120 38 180 42 208" stroke="rgba(255,255,255,0.22)" strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>

        <ellipse cx="80" cy="58" rx="52" ry="16" fill="none" stroke="#2f3846" strokeWidth="1.8" />
        <path d="M28 58 L28 208" stroke="#2f3846" strokeWidth="1.5" fill="none" />
        <path d="M132 58 L132 208" stroke="#2f3846" strokeWidth="1.5" fill="none" />

        {[0, 25, 50, 75, 100].map((m) => {
          const y = 208 - (m / 100) * 148;
          return (
            <g key={m}>
              <line x1="22" y1={y} x2="30" y2={y} stroke="#3d4654" strokeWidth="1.3" />
              <text x="18" y={y + 3} fontSize="8" textAnchor="end" fill="#5b6575">
                {m}
              </text>
            </g>
          );
        })}

        <rect x="68" y="28" width="24" height="16" rx="3" fill="#3d4654" />
        <rect x="62" y="20" width="36" height="12" rx="3" fill="#1c2430" />
        <circle cx="80" cy="26" r="4" fill="#f0b429" />
        <rect x="130" y="92" width="18" height="8" rx="2" fill="#4b5568" />
        <circle cx="150" cy="96" r="7" fill="#2f3846" stroke="#c5ced8" strokeWidth="1.4" />
        <rect x="12" y="188" width="16" height="8" rx="2" fill="#4b5568" />
        <circle cx="12" cy="192" r="6" fill="#2f3846" stroke="#c5ced8" strokeWidth="1.4" />
      </svg>
      <div className="tank-visuel-pct">{pct.toFixed(0)} %</div>
    </div>
  );
}
