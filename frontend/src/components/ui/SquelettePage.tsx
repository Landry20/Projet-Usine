export function SquelettePage({ cartes = 3 }: { cartes?: number }) {
  return (
    <div className="squelette-page" aria-hidden>
      <div className="squelette squelette-titre" />
      <div className="squelette squelette-ligne" />
      <div className="squelette-kpis">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="squelette squelette-kpi" />
        ))}
      </div>
      {Array.from({ length: cartes }).map((_, i) => (
        <div key={i} className="squelette squelette-carte" />
      ))}
    </div>
  );
}
