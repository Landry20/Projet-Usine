import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  chargement?: boolean;
  variante?: 'primary' | 'ghost' | 'ok' | 'danger' | 'gold';
};

export function Bouton({
  chargement,
  variante = 'primary',
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: Props) {
  const varianteCls =
    variante === 'ghost' ? 'btn-ghost' : variante === 'ok' ? 'btn-ok' : variante === 'danger' ? 'btn-danger' : variante === 'gold' ? 'btn-gold' : 'btn-primary';
  return (
    <button
      type={type}
      className={`btn ${varianteCls} ${chargement ? 'btn-busy' : ''} ${className ?? ''}`}
      disabled={disabled || chargement}
      {...rest}
    >
      {chargement && <LoaderCircle size={16} className="btn-spinner" />}
      <span>{children as ReactNode}</span>
    </button>
  );
}
