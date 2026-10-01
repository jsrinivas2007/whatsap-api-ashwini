"use client";

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthInput, AuthButton, AuthDivider } from '@/components/auth/AuthFormElements';
import { loginMock, isAuthenticated } from '@/lib/auth';
import { useEffect } from 'react';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('reset=success')) {
      setResetSuccess(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // AuthProvider handles redirect if already authenticated

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const ok = await loginMock(form.email, form.password);

      if (!ok) {
        setErrors({ email: 'Unable to sign in with the provided credentials.' });
        return;
      }

      router.push('/dashboard');
    } catch {
      setErrors({ email: 'Something went wrong during sign in. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-2xl font-serif font-bold tracking-tight" style={{ color: 'var(--navy-deep)' }}>
          Welcome back
        </h2>
        <p className="text-sm text-gray-500 mt-1.5">
          Log in to manage your WhatsApp campaigns.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-3 mb-6 text-sm text-green-700 bg-green-50 rounded-lg border border-green-100 flex items-start gap-2">
          <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Password updated successfully. Please log in with your new password.
        </div>
      )}

      {/* Fields */}
      <div className="space-y-5">
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

        <div>
          <AuthInput
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(v) => { setForm({ ...form, password: v }); setErrors({ ...errors, password: undefined }); }}
            error={errors.password}
            required
            disabled={loading}
          />
          <div className="mt-1.5 text-right">
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium hover:underline"
              style={{ color: 'var(--sea)' }}
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-8">
        <AuthButton loading={loading}>
          Log In
        </AuthButton>
      </div>

      {/* Divider + Register Link */}
      <AuthDivider />
      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="font-semibold hover:underline" style={{ color: 'var(--sea)' }}>
          Create Account
        </Link>
      </p>
    </form>
  );
}
