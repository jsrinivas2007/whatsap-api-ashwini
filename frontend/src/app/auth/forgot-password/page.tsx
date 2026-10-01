"use client";

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { AuthInput, AuthButton } from '@/components/auth/AuthFormElements';
import { supabase } from '@/lib/supabase';

interface FormErrors {
  email?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setErrors({ email: error.message });
        return;
      }

      setSuccess(true);
    } catch {
      setErrors({ email: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-2xl font-serif font-bold tracking-tight" style={{ color: 'var(--navy-deep)' }}>
          Reset Password
        </h2>
        <p className="text-sm text-gray-500 mt-1.5">
          Enter your email address and we will send you a link to reset your password.
        </p>
      </div>

      {success && (
        <div className="p-3 mb-6 text-sm text-green-700 bg-green-50 rounded-lg border border-green-100 flex items-start gap-2">
          <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Check your email for the password reset link!
        </div>
      )}

      {/* Fields */}
      <div className="space-y-5">
        <AuthInput
          id="email"
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(v) => { setEmail(v); setErrors({}); }}
          error={errors.email}
          required
          disabled={loading || success}
        />
      </div>

      {/* Submit */}
      <div className="mt-8">
        <AuthButton loading={loading} disabled={success}>
          Send Reset Link
        </AuthButton>
      </div>

      <div className="mt-6 text-center text-sm">
        <Link href="/auth/login" className="font-medium hover:underline text-gray-500">
          &larr; Back to Log in
        </Link>
      </div>
    </form>
  );
}
