"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AuthInput, AuthButton } from '@/components/auth/AuthFormElements';
import { supabase } from '@/lib/supabase';

interface FormErrors {
  password?: string;
  general?: string;
}

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.password = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setErrors({ general: error.message });
        return;
      }

      // On success, redirect to login page with a success message flag
      router.push('/auth/login?reset=success');
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-2xl font-serif font-bold tracking-tight" style={{ color: 'var(--navy-deep)' }}>
          Set New Password
        </h2>
        <p className="text-sm text-gray-500 mt-1.5">
          Please enter your new password below.
        </p>
      </div>

      {errors.general && (
        <div className="p-3 mb-6 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
          {errors.general}
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
          onChange={(v) => { setPassword(v); setErrors({}); }}
          error={errors.password}
          required
          disabled={loading}
        />
        
        <AuthInput
          id="confirm-password"
          label="Confirm Password"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(v) => { setConfirmPassword(v); setErrors({}); }}
          required
          disabled={loading}
        />
      </div>

      {/* Submit */}
      <div className="mt-8">
        <AuthButton loading={loading}>
          Update Password
        </AuthButton>
      </div>
    </form>
  );
}
