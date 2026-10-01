"use client";

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthInput, AuthButton, AuthDivider } from '@/components/auth/AuthFormElements';
import CountryCodeSelector from '@/components/auth/CountryCodeSelector';
import { registerMock, isAuthenticated } from '@/lib/auth';
import { useEffect } from 'react';
import { LegalModal, LegalDocumentType } from '@/components/legal/LegalModal';

interface FormData {
  fullName: string;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    countryCode: '+91',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalDocumentType>(null);

  // AuthProvider handles redirect if already authenticated

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'WhatsApp number is required';
    } else if (form.phone.length < 6 || form.phone.length > 15) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || !agreedToTerms) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const ok = await registerMock(form.fullName, form.email, form.password);

      if (!ok) {
        setErrors({ email: 'Unable to create the account right now.' });
        return;
      }

      router.push('/dashboard');
    } catch {
      setErrors({ email: 'Something went wrong while creating the account.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-2xl font-serif font-bold tracking-tight" style={{ color: 'var(--navy-deep)' }}>
          Create your account
        </h2>
        <p className="text-sm text-gray-500 mt-1.5">
          Start your 7-day free trial. No credit card required.
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-5">
        <AuthInput
          id="fullName"
          label="Full Name"
          placeholder="Enter your full name"
          value={form.fullName}
          onChange={(v) => { setForm({ ...form, fullName: v }); setErrors({ ...errors, fullName: undefined }); }}
          error={errors.fullName}
          required
          disabled={loading}
        />

        <AuthInput
          id="email"
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          value={form.email}
          onChange={(v) => { setForm({ ...form, email: v }); setErrors({ ...errors, email: undefined }); }}
          error={errors.email}
          required
          disabled={loading}
        />

        <CountryCodeSelector
          selectedCode={form.countryCode}
          onCodeChange={(code) => setForm({ ...form, countryCode: code })}
          phoneNumber={form.phone}
          onPhoneChange={(v) => { setForm({ ...form, phone: v }); setErrors({ ...errors, phone: undefined }); }}
          error={errors.phone}
          disabled={loading}
        />

        <AuthInput
          id="password"
          label="Password"
          type="password"
          placeholder="Create a password"
          value={form.password}
          onChange={(v) => { setForm({ ...form, password: v }); setErrors({ ...errors, password: undefined }); }}
          error={errors.password}
          required
          disabled={loading}
        />
      </div>

      {/* Terms Agreement */}
      <div className="mt-5 flex items-start gap-2.5">
        <input
          type="checkbox"
          id="terms"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          disabled={loading}
          className="mt-0.5 w-4 h-4 rounded border-gray-300 cursor-pointer accent-[#1C6E8C]"
        />
        <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
          I agree to the{' '}
          <button type="button" onClick={() => setLegalModalType('terms')} className="font-medium hover:underline" style={{ color: 'var(--sea)' }}>Terms of Service</button>
          {' '}and{' '}
          <button type="button" onClick={() => setLegalModalType('privacy')} className="font-medium hover:underline" style={{ color: 'var(--sea)' }}>Privacy Policy</button>
        </label>
      </div>

      {/* Submit */}
      <div className="mt-6">
        <AuthButton loading={loading} disabled={!agreedToTerms}>
          Create Account
        </AuthButton>
      </div>

      {/* Divider + Login Link */}
      <AuthDivider />
      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: 'var(--sea)' }}>
          Log In
        </Link>
      </p>

      <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
    </form>
  );
}
