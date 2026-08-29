import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';

type Opt = { value: string; label: string; disabled?: boolean };

function extraireOptions(children: ReactNode): Opt[] {
  const out: Opt[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(child)) return;
    const label = String(child.props.children ?? '');
    const valeur = child.props.value !== undefined && child.props.value !== null ? String(child.props.value) : label;
    out.push({ value: valeur, label, disabled: child.props.disabled });
  });
  return out;
}

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  label?: string;
  icone?: ReactNode;
  children: ReactNode;
};

/** Liste déroulante stylée — les <option> natives ne se stylisent pas sous Windows. */
export function Selecteur({
  label,
  icone,
  children,
  value,
  defaultValue,
  onChange,
  name,
  required,
  disabled,
  className,
  id,
}: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [interne, setInterne] = useState(String(value ?? defaultValue ?? ''));
  const racine = useRef<HTMLDivElement>(null);
  const options = useMemo(() => extraireOptions(children), [children]);
  const choisi = value !== undefined ? String(value) : interne;
  const actuel = options.find((o) => o.value === choisi) ?? options[0];

  useEffect(() => {
    function dehors(e: MouseEvent) {
      if (racine.current && !racine.current.contains(e.target as Node)) setOuvert(false);
    }
    document.addEventListener('mousedown', dehors);
    return () => document.removeEventListener('mousedown', dehors);
  }, []);

  function choisir(opt: Opt) {
    if (opt.disabled) return;
    if (value === undefined) setInterne(opt.value);
    onChange?.({
      target: { value: opt.value, name: name ?? '' },
    } as ChangeEvent<HTMLSelectElement>);
    setOuvert(false);
  }

  const controle = (
    <div className={`sel ${disabled ? 'disabled' : ''} ${ouvert ? 'open' : ''} ${className ?? ''}`} ref={racine}>
      <button
        type="button"
        className={`sel-btn ${icone ? 'has-ico' : ''}`}
        disabled={disabled}
        aria-expanded={ouvert}
        aria-haspopup="listbox"
        id={id}
        onClick={() => !disabled && setOuvert((v) => !v)}
      >
        {icone && <span className="sel-ico">{icone}</span>}
        <span className={`sel-val ${!actuel?.value ? 'placeholder' : ''}`}>{actuel?.label || 'Choisir…'}</span>
        <ChevronDown size={16} className="sel-chevron" />
      </button>
      {ouvert && (
        <ul className="sel-liste" role="listbox">
          {options.map((opt) => (
            <li key={`${opt.value}-${opt.label}`}>
              <button
                type="button"
                role="option"
                aria-selected={opt.value === choisi}
                disabled={opt.disabled}
                className={`sel-opt ${opt.value === choisi ? 'active' : ''} ${!opt.value ? 'muted' : ''}`}
                onClick={() => choisir(opt)}
              >
                <span>{opt.label}</span>
                {opt.value === choisi && <Check size={15} />}
              </button>
            </li>
          ))}
        </ul>
      )}
      <select
        className="sel-hidden"
        tabIndex={-1}
        aria-hidden
        name={name}
        required={required}
        value={choisi}
        onChange={onChange}
      >
        {children}
      </select>
    </div>
  );

  if (!label) return controle;
  return <label className="field">{label}{controle}</label>;
}
