import { useEffect, useState } from 'react';
import type { Tank } from '../../types';

function pctTank(t: Tank) {
  const capa = Number(t.capaciteLitres) || 1;
  const stock = Number(t.stockLitres) || 0;
  const brut = t.remplissagePct ?? (stock / capa) * 100;
  return Math.min(100, Math.max(0, brut));
}

export function TankVisuel({
  tank,
  taille = 'm',
  anime = true,
}: {
  tank: Tank;
  taille?: 's' | 'm' | 'l';
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
    const t = window.setTimeout(() => setPct(cible), 40);
    return () => window.clearTimeout(t);
  }, [cible, anime, tank.id]);
  const alerte = tank.alerteHaut || tank.alerteBas;
  const uid = `tk${tank.id}`;
  const h = taille === 'l' ? 320 : taille === 's' ? 168 : 228;
  const w = taille === 'l' ? 176 : taille === 's' ? 92 : 124;
  const descente = ((100 - pct) / 100) * 142;

  return (
    <div className={`tank-visuel taille-${taille} ${alerte ? 'alerte' : ''} ${anime ? 'anime' : ''}`}>
      <svg viewBox="0 0 120 220" width={w} height={h} role="img" aria-label={`Tank ${tank.code} rempli à ${pct.toFixed(0)} %`}>
        <defs>
          <linearGradient id={`${uid}-acier`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b97a8" />
            <stop offset="18%" stopColor="#d5dce6" />
            <stop offset="45%" stopColor="#f4f7fb" />
            <stop offset="70%" stopColor="#c5cedb" />
            <stop offset="100%" stopColor="#6d7889" />
          </linearGradient>
          <linearGradient id={`${uid}-huile`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#6b3d08" />
            <stop offset="40%" stopColor="#c27812" />
            <stop offset="100%" stopColor="#f0b429" />
          </linearGradient>
          <clipPath id={`${uid}-cuve`}>
            <rect x="22" y="38" width="76" height="142" rx="8" />
          </clipPath>
        </defs>

        <ellipse cx="60" cy="206" rx="38" ry="6" fill="rgba(18,28,45,0.12)" />
        <rect x="30" y="182" width="8" height="22" rx="2" fill="#4b5568" />
        <rect x="82" y="182" width="8" height="22" rx="2" fill="#4b5568" />

        <rect x="20" y="36" width="80" height="148" rx="10" fill={`url(#${uid}-acier)`} stroke="#3d4a5c" strokeWidth="1.6" />
        <ellipse cx="60" cy="38" rx="40" ry="12" fill="#cfd6e1" stroke="#3d4a5c" strokeWidth="1.6" />
        <ellipse cx="60" cy="182" rx="40" ry="10" fill="#9aa6b8" stroke="#3d4a5c" strokeWidth="1.4" />

        <g clipPath={`url(#${uid}-cuve)`}>
          <g className="tank-huile" style={{ transform: `translate(0, ${descente}px)` }}>
            <rect x="22" y="38" width="76" height="160" fill={`url(#${uid}-huile)`} />
            <path className="tank-vague" d="M14 38 Q31 28 48 38 T82 38 T114 38 V50 H14 Z" fill="rgba(255,236,179,0.38)" />
          </g>
          <rect x="28" y="40" width="10" height="136" fill="rgba(255,255,255,0.16)" rx="4" />
        </g>

        {[0, 25, 50, 75, 100].map((m) => {
          const y = 178 - (m / 100) * 136;
          return (
            <g key={m}>
              <line x1="18" y1={y} x2="24" y2={y} stroke="#3d4a5c" strokeWidth="1.2" />
              <text x="14" y={y + 3} fontSize="7" textAnchor="end" fill="#5b6575">
                {m}
              </text>
            </g>
          );
        })}

        <rect x="52" y="18" width="16" height="12" rx="2" fill="#4b5568" />
        <rect x="48" y="12" width="24" height="8" rx="2" fill="#1f2a3d" />
        <circle cx="60" cy="16" r="3" fill="#f0b429" />
        <rect x="96" y="70" width="14" height="6" rx="2" fill="#4b5568" />
        <rect x="108" y="64" width="6" height="18" rx="2" fill="#2f3b4d" />
        <rect x="10" y="150" width="12" height="6" rx="2" fill="#4b5568" />
      </svg>
      <div className="tank-visuel-pct">{pct.toFixed(0)} %</div>
    </div>
  );
}
