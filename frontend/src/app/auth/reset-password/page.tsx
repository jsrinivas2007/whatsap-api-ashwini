"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthInput, AuthButton } from '@/components/auth/AuthFormElements';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if we have a valid session established by the recovery link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionValid(true);
      }
      setCheckingSession(false);
    });

    // Also listen for the PASSWORD_RECOVERY event
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionValid(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const isValid = password.length >= 8 && password === confirmPassword;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError('');
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;
      
      // Sign out to clear the recovery session
      await supabase.auth.signOut();
      
      // Redirect to login with success indicator
      router.push('/auth/login?reset=success');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--sea)' }}></div>
      </div>
    );
  }

  if (!sessionValid) {
    return (
      <div className="animate-in fade-in duration-300 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-navy-deep mb-2" style={{ color: 'var(--navy-deep)' }}>
          Invalid or expired link
        </h2>
        <p className="text-sm text-gray-500 mb-8">
          This reset link has expired or already been used. Please request a new one.
        </p>
        <Link 
          href="/auth/forgot-password"
          className="inline-flex justify-center w-full rounded-lg text-white text-sm font-semibold py-3 transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--navy-deep)' }}
        >
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-2xl font-serif font-bold tracking-tight" style={{ color: 'var(--navy-deep)' }}>
          Set a new password
        </h2>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
          Choose a strong password for your account. Minimum 8 characters.
        </p>
      </div>

      {error && (
        <div className="p-3 mb-6 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Fields */}
      <div className="space-y-5">
        <AuthInput
          id="password"
          label="New Password"
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={setPassword}
          required
          disabled={loading}
        />

        <AuthInput
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={confirmPassword && password !== confirmPassword ? "Passwords do not match" : undefined}
          required
          disabled={loading}
        />
      </div>

      {/* Submit */}
      <div className="mt-8">
        <AuthButton loading={loading} disabled={!isValid}>
          Reset password
        </AuthButton>
      </div>
    </form>
  );
}
