import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';

interface AvantInstall {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

/**
 * Propose d'installer la PWA : bureau (raccourci) et téléphone terrain (écran d'accueil).
 */
export function InviteInstallation() {
  const [event, setEvent] = useState<AvantInstall | null>(null);
  const [installe, setInstalle] = useState(false);

  useEffect(() => {
    const deja = window.matchMedia('(display-mode: standalone)').matches;
    if (deja) setInstalle(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as unknown as AvantInstall);
    };
    const onInstalled = () => {
      setInstalle(true);
      setEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installe) {
    return (
      <div className="pwa-chip">
        <Smartphone size={14} />
        Application installée
      </div>
    );
  }

  if (!event) return null;

  return (
    <button
      className="btn btn-gold btn-sm pwa-install"
      type="button"
      onClick={async () => {
        await event.prompt();
        const choix = await event.userChoice;
        if (choix.outcome === 'accepted') setEvent(null);
      }}
    >
      <Download size={15} />
      Installer l'application
    </button>
  );
}
