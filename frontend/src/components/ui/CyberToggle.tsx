'use client';

type CyberToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
};

export default function CyberToggle({ checked, onChange, label, disabled = false }: CyberToggleProps) {
  return (
    <label className={`cyber-toggle ${disabled ? 'cyber-toggle-disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="cyber-toggle-input"
      />
      <span className="cyber-toggle-track" aria-hidden="true">
        <span className="cyber-toggle-lines" />
        <span className="cyber-toggle-thumb"><span className="cyber-toggle-core" /><span className="cyber-toggle-inner" /></span>
        <span className="cyber-toggle-status" />
      </span>
      {label ? <span className="cyber-toggle-label">{label}</span> : null}
    </label>
  );
}
