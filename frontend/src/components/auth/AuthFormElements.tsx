"use client";

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ButtonLoader } from '@/components/ui/Loader';

interface AuthInputProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function AuthInput({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium" style={{ color: 'var(--navy-deep)' }}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`
            w-full h-11 px-4 text-sm rounded-lg border bg-white
            transition-all duration-200 outline-none
            placeholder:text-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error 
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
              : 'border-gray-200 focus:ring-2 hover:border-gray-300'
            }
            ${isPassword ? 'pr-11' : ''}
          `}
          style={!error ? { 
            // @ts-ignore
            '--tw-ring-color': 'rgba(28, 110, 140, 0.3)',
            borderColor: 'var(--sea)'
          } : undefined}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

/* ─── Primary Button ─── */
interface AuthButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  loading?: boolean;
  disabled?: boolean;
}

export function AuthButton({ children, onClick, type = 'submit', loading = false, disabled = false }: AuthButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="
        w-full h-12 rounded-lg text-white text-sm font-semibold
        transition-all duration-200 
        disabled:opacity-60 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
      "
      style={{ 
        backgroundColor: disabled || loading ? 'var(--slate)' : 'var(--primary)',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          (e.target as HTMLElement).style.backgroundColor = '#0b5650'; // darker teal
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          (e.target as HTMLElement).style.backgroundColor = 'var(--primary)';
        }
      }}
    >
      {loading ? (
        <>
          <ButtonLoader className="text-white" />
          Processing…
        </>
      ) : children}
    </button>
  );
}

/* ─── Divider ─── */
export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
    </div>
  );
}
