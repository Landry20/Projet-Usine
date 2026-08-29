import type { InputHTMLAttributes, ReactNode } from 'react';

export function ChampTexte({
  label,
  icone,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; icone?: ReactNode }) {
  return (
    <label className="field">
      {label}
      <span className={icone ? 'input-icon' : undefined}>
        {icone}
        <input {...props} />
      </span>
    </label>
  );
}
