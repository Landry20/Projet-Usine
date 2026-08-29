import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** Champ mot de passe avec bascule voir / masquer — à utiliser partout. */
export function ChampMotDePasse({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="field">
      {label}
      <span className="mdp-wrap">
        <input {...props} type={visible ? 'text' : 'password'} />
        <button
          type="button"
          className="mdp-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          title={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}
