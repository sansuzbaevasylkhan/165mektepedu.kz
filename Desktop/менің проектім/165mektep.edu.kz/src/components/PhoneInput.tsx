import { formatPhone, normalizeDigits } from '../lib/phone';

interface Props {
  id?: string;
  value: string; // 10 ұлттық цифр
  onChange: (digits: string) => void;
  error?: string | null;
  label: string;
  autoFocus?: boolean;
}

/** +7 (777)-777-77-77 маскасы. "+7" префиксін өшіруге болмайды. */
export function PhoneInput({ id, value, onChange, error, label, autoFocus }: Props) {
  const display = formatPhone(value);
  const toEnd = (el: HTMLInputElement) => {
    requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
  };
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="input"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        autoFocus={autoFocus}
        value={display}
        placeholder="+7 (777)-777-77-77"
        onChange={(e) => onChange(normalizeDigits(e.target.value))}
        onKeyDown={(e) => {
          const el = e.currentTarget;
          if (e.key === 'Backspace' && el.selectionStart === el.selectionEnd && el.selectionStart === el.value.length) {
            e.preventDefault();
            onChange(value.slice(0, -1));
          }
        }}
        onFocus={(e) => toEnd(e.currentTarget)}
        onClick={(e) => toEnd(e.currentTarget)}
      />
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}
