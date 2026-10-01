import { supabase } from './supabase';

export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

export async function loginMock(email: string, password: string): Promise<boolean> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.error('Login error:', error.message);
    return false;
  }
  return true;
}

export async function registerMock(fullName: string, email: string, password: string): Promise<boolean> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  if (error) {
    console.error('Register error:', error.message);
    return false;
  }
  return true;
}

export async function logoutMock(): Promise<void> {
  await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
}
