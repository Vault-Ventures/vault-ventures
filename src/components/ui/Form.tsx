import React, { useState, useId } from 'react';

// ─── FormField wrapper ────────────────────────────────────────────────────────

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
}

export function FormField({ label, error, hint, required, className = '', children, htmlFor }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="text-[11.5px] font-medium vv-text-secondary leading-none">
          {label}
          {required && <span className="text-[#F04438] ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-[11px] text-[#F04438] leading-snug">{error}</p>}
      {!error && hint && <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-snug">{hint}</p>}
    </div>
  );
}

// ─── Base input class ─────────────────────────────────────────────────────────

const BASE_INPUT = 'w-full vv-control border text-[13px] placeholder-[color:var(--vv-text-tertiary)] transition-colors focus:outline-none rounded-md vv-focus';
const INPUT_NORMAL = 'border-[color:var(--vv-border-strong)] focus:border-[#C67A4E]';
const INPUT_ERROR = 'border-[#F04438]/60 focus:border-[#F04438]';
const INPUT_DISABLED = 'opacity-50 cursor-not-allowed';

// ─── TextInput ────────────────────────────────────────────────────────────────

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function TextInput({ label, error, hint, className = '', disabled, ...props }: TextInputProps) {
  const id = useId();
  return (
    <FormField label={label} error={error} hint={hint} htmlFor={props.id ?? id}>
      <input
        id={props.id ?? id}
        disabled={disabled}
        {...props}
        className={`h-9 px-3 ${BASE_INPUT} ${error ? INPUT_ERROR : INPUT_NORMAL} ${disabled ? INPUT_DISABLED : ''} ${className}`}
      />
    </FormField>
  );
}

// ─── PasswordInput ────────────────────────────────────────────────────────────

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
}

export function PasswordInput({ label, error, hint, className = '', disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <FormField label={label} error={error} hint={hint} htmlFor={props.id ?? id}>
      <div className="relative">
        <input
          id={props.id ?? id}
          type={visible ? 'text' : 'password'}
          disabled={disabled}
          {...props}
          className={`h-9 px-3 pr-10 ${BASE_INPUT} ${error ? INPUT_ERROR : INPUT_NORMAL} ${disabled ? INPUT_DISABLED : ''} ${className}`}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 vv-text-tertiary hover:text-[color:var(--vv-text-secondary)] transition-colors"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}>
          {visible ? (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/>
            </svg>
          ) : (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
              <path strokeLinecap="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
            </svg>
          )}
        </button>
      </div>
    </FormField>
  );
}

// ─── SelectInput ──────────────────────────────────────────────────────────────

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[] | string[];
  placeholder?: string;
}

export function SelectInput({ label, error, hint, options, placeholder, className = '', disabled, ...props }: SelectInputProps) {
  const id = useId();
  const normalizedOptions = options.map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
  return (
    <FormField label={label} error={error} hint={hint} htmlFor={props.id ?? id}>
      <div className="relative">
        <select
          id={props.id ?? id}
          disabled={disabled}
          {...props}
          className={`h-9 px-3 pr-8 appearance-none ${BASE_INPUT} ${error ? INPUT_ERROR : INPUT_NORMAL} ${disabled ? INPUT_DISABLED : ''} ${className}`}>
          {placeholder && <option value="">{placeholder}</option>}
          {normalizedOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 vv-text-tertiary">
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>
    </FormField>
  );
}

// ─── TextareaInput ────────────────────────────────────────────────────────────

interface TextareaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function TextareaInput({ label, error, hint, className = '', disabled, rows = 3, ...props }: TextareaInputProps) {
  const id = useId();
  return (
    <FormField label={label} error={error} hint={hint} htmlFor={props.id ?? id}>
      <textarea
        id={props.id ?? id}
        rows={rows}
        disabled={disabled}
        {...props}
        className={`px-3 py-2.5 ${BASE_INPUT} resize-none leading-relaxed ${error ? INPUT_ERROR : INPUT_NORMAL} ${disabled ? INPUT_DISABLED : ''} ${className}`}
      />
    </FormField>
  );
}

// ─── SearchInput ──────────────────────────────────────────────────────────────

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  shortcut?: string;
}

export function SearchInput({ shortcut, className = '', ...props }: SearchInputProps) {
  return (
    <div className="relative">
      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 vv-text-tertiary" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        type="search"
        {...props}
        className={`h-8 pl-8 ${shortcut ? 'pr-10' : 'pr-3'} ${BASE_INPUT} ${INPUT_NORMAL} ${className}`}
      />
      {shortcut && (
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[color:var(--vv-text-tertiary)] bg-[#0B1220] border border-[color:var(--vv-border)] px-1 py-0.5 rounded hidden sm:block">
          {shortcut}
        </kbd>
      )}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function Toggle({ checked, onChange, disabled, label, description }: ToggleProps) {
  const id = useId();
  return (
    <label htmlFor={id} className={`flex items-start gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] leading-snug">{label}</p>}
          {description && <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5 leading-snug">{description}</p>}
        </div>
      )}
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={e => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          onClick={() => !disabled && onChange(!checked)}
          className={`w-8 h-4 rounded-full transition-colors ${checked ? 'bg-[#C67A4E]' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]'}`}
          style={{ minWidth: 32 }}>
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
      </div>
    </label>
  );
}

// ─── Checkbox ────────────────────────────────────────────────────────────────

interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function Checkbox({ checked, onChange, disabled, label, className = '' }: CheckboxProps) {
  const id = useId();
  return (
    <label htmlFor={id} className={`flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <div className="relative w-4 h-4 flex-shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={e => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          onClick={() => !disabled && onChange(!checked)}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            checked ? 'bg-[#C67A4E] border-[#C67A4E]' : 'border-[color:var(--vv-border-strong)] hover:border-[#5E6D8F]'
          }`}>
          {checked && (
            <svg width="9" height="9" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 12l5 5L20 7"/>
            </svg>
          )}
        </div>
      </div>
      {label && <span className="text-[12.5px] text-[color:var(--vv-text-secondary)]">{label}</span>}
    </label>
  );
}

// ─── RadioGroup ───────────────────────────────────────────────────────────────

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: RadioOption[];
  disabled?: boolean;
}

export function RadioGroup({ name, value, onChange, options, disabled }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      {options.map(opt => (
        <label key={opt.value}
          className={`flex items-start gap-2.5 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
          <div className="mt-0.5 relative flex-shrink-0">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => !disabled && onChange(opt.value)}
              disabled={disabled}
              className="sr-only"
            />
            <div
              onClick={() => !disabled && onChange(opt.value)}
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                value === opt.value ? 'border-[#C67A4E]' : 'border-[color:var(--vv-border-strong)] hover:border-[#5E6D8F]'
              }`}>
              {value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-[#C67A4E]" />}
            </div>
          </div>
          <div>
            <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] leading-snug">{opt.label}</p>
            {opt.description && <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{opt.description}</p>}
          </div>
        </label>
      ))}
    </div>
  );
}