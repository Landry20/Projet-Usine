import { LogoManuPro } from '../brand/LogoManuPro';

/** Écran de chargement plein cadre — session, navigation lourde, premier lancement. */
export function PageChargement({ message = 'Chargement de la GMAO…' }: { message?: string }) {
  return (
    <div className="splash" role="status" aria-live="polite">
      <div className="splash-mark">
        <LogoManuPro />
      </div>
      <div className="brand-kicker">Gestion industrielle</div>
      <h1>ManuPro</h1>
      <div className="splash-bar" />
      <p>{message}</p>
    </div>
  );
}

/** Bandeau fin en haut de l'écran pendant un appel API. */
export function BarreChargement({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <div className="top-progress" aria-hidden />;
}
