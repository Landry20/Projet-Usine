import type { ReactNode, SelectHTMLAttributes } from 'react';
import { Selecteur } from './Selecteur';

export function ChampSelect({
  label,
  icone,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; icone?: ReactNode; children: ReactNode }) {
  return (
    <Selecteur label={label} icone={icone} {...props}>
      {children}
    </Selecteur>
  );
}
