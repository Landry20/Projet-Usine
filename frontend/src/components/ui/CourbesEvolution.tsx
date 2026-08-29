import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SerieComparee } from '../../types';

export function CourbesEvolution({
  series,
  titreActivite,
  titreVolume,
}: {
  series: SerieComparee;
  titreActivite: string;
  titreVolume: string;
}) {
  const [hauteur, setHauteur] = useState(240);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 560px)');
    const appliquer = () => setHauteur(mq.matches ? 200 : 240);
    appliquer();
    mq.addEventListener('change', appliquer);
    return () => mq.removeEventListener('change', appliquer);
  }, []);

  return (
    <div className="charts-grid">
      <article className="card">
        <div className="card-h">
          <h3>{titreActivite}</h3>
          <span className="hint-chart">
            {series.anneeCourante} vs {series.anneePrecedente}
          </span>
        </div>
        <div className="card-b chart-box">
          <ResponsiveContainer width="100%" height={hauteur}>
            <LineChart data={series.activite}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="annee" name={String(series.anneeCourante)} stroke="#123056" strokeWidth={2.4} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="precedente" name={String(series.anneePrecedente)} stroke="#c9a227" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
      <article className="card">
        <div className="card-h">
          <h3>{titreVolume}</h3>
          <span className="hint-chart">Comparaison mensuelle</span>
        </div>
        <div className="card-b chart-box">
          <ResponsiveContainer width="100%" height={hauteur}>
            <LineChart data={series.volume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="annee" name={String(series.anneeCourante)} stroke="#1b7a4e" strokeWidth={2.4} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="precedente" name={String(series.anneePrecedente)} stroke="#b54708" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
    </div>
  );
}
