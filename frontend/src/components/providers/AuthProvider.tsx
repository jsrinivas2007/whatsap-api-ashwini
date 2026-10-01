"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { Session } from '@supabase/supabase-js';

// To avoid HMR infinite patching, we keep a module-level flag
let isFetchGloballyPatched = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const sessionRef = useRef<Session | null>(null);
  const accountIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Intercept global fetch ONCE to inject x-account-id
    if (!isFetchGloballyPatched && typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const resource = args[0];
        let config = args[1];
        
        if (typeof resource === 'string' && resource.startsWith('/api/')) {
          config = config || {};
          // Merge custom headers
          const headers = new Headers(config.headers || {});
          
          // Use the actual tenant account_id, fallback to user_id, fallback to zeros
          const headerId = accountIdRef.current || sessionRef.current?.user?.id;
          if (headerId) {
            headers.set('x-account-id', headerId);
          }
          
          config.headers = headers;
        }
        
        return originalFetch(resource, config);
      };
      isFetchGloballyPatched = true;
    }

    const fetchUserAccount = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('account_id')
          .eq('id', userId)
          .single();
        
        if (!error && data) {
          accountIdRef.current = (data as any).account_id;
        }
      } catch (e) {
        console.error("Failed to fetch user account", e);
      }
    };

    // 2. Fetch initial session and enforce routing
    supabase.auth.getSession().then(({ data: { session } }) => {
      sessionRef.current = session;
      
      if (session) {
        fetchUserAccount(session.user.id).then(() => {
          if (pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/') {
            router.push('/dashboard');
          }
          setLoading(false);
        });
      } else {
        if (pathname.startsWith('/dashboard')) {
          router.push('/auth/login');
        }
        setLoading(false);
      }
    });

    // 3. Listen to Auth state changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      sessionRef.current = session;
      
      if (session) {
        fetchUserAccount(session.user.id).then(() => {
          if (event === 'SIGNED_IN' && (pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/')) {
            router.push('/dashboard');
          }
        });
      } else {
        accountIdRef.current = null;
        if (event === 'SIGNED_OUT' && pathname.startsWith('/dashboard')) {
          router.push('/auth/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Optionally show a blank screen or loader while checking session initially
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1B2CC1] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
