"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', label: 'India (+91)' },
  { code: '+1', country: 'US', label: 'United States (+1)' },
  { code: '+44', country: 'GB', label: 'United Kingdom (+44)' },
  { code: '+971', country: 'AE', label: 'UAE (+971)' },
  { code: '+966', country: 'SA', label: 'Saudi Arabia (+966)' },
  { code: '+65', country: 'SG', label: 'Singapore (+65)' },
  { code: '+61', country: 'AU', label: 'Australia (+61)' },
  { code: '+49', country: 'DE', label: 'Germany (+49)' },
  { code: '+33', country: 'FR', label: 'France (+33)' },
  { code: '+81', country: 'JP', label: 'Japan (+81)' },
  { code: '+86', country: 'CN', label: 'China (+86)' },
  { code: '+55', country: 'BR', label: 'Brazil (+55)' },
  { code: '+27', country: 'ZA', label: 'South Africa (+27)' },
  { code: '+234', country: 'NG', label: 'Nigeria (+234)' },
  { code: '+254', country: 'KE', label: 'Kenya (+254)' },
];

interface CountryCodeSelectorProps {
  selectedCode: string;
  onCodeChange: (code: string) => void;
  phoneNumber: string;
  onPhoneChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function CountryCodeSelector({
  selectedCode,
  onCodeChange,
  phoneNumber,
  onPhoneChange,
  error,
  disabled = false,
}: CountryCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCountry = COUNTRY_CODES.find(c => c.code === selectedCode) || COUNTRY_CODES[0];

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: '#091540' }}>
        Personal WhatsApp Number<span className="text-red-500 ml-0.5">*</span>
      </label>
      <div className="flex gap-2">
        {/* Country Code Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className={`
              h-11 px-3 rounded-lg border bg-white text-sm
              flex items-center gap-1.5 min-w-[100px]
              transition-all duration-200 outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}
            `}
            style={isOpen && !error ? { borderColor: '#7692FF' } : undefined}
          >
            <span className="text-xs text-gray-500">{selectedCountry.country}</span>
            <span className="font-medium" style={{ color: '#091540' }}>{selectedCountry.code}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {COUNTRY_CODES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onCodeChange(country.code);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors
                    flex items-center justify-between
                    ${selectedCode === country.code ? 'font-medium' : ''}
                  `}
                  style={selectedCode === country.code ? { backgroundColor: 'rgba(118, 146, 255, 0.1)', color: '#1B2CC1' } : { color: '#091540' }}
                >
                  <span>{country.label}</span>
                  {selectedCode === country.code && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#1B2CC1' }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          placeholder="Enter WhatsApp number"
          value={phoneNumber}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '');
            onPhoneChange(value);
          }}
          disabled={disabled}
          className={`
            flex-1 h-11 px-4 text-sm rounded-lg border bg-white
            transition-all duration-200 outline-none
            placeholder:text-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 hover:border-gray-300'}
          `}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = '#7692FF';
          }}
          onBlur={(e) => {
            if (!error) e.target.style.borderColor = '#e5e7eb';
          }}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
