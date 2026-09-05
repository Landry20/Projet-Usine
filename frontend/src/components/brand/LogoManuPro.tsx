type Props = {
  className?: string;
  hauteur?: number;
};

/** Logo entreprise ManuPro — jamais l’icône PWA. */
export function LogoManuPro({ className = '', hauteur }: Props) {
  return (
    <img
      src="/logo.png"
      alt="ManuPro"
      className={className}
      style={hauteur ? { height: hauteur } : undefined}
    />
  );
}
