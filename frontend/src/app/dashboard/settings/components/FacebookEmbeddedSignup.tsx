'use client';

import React, { useEffect, useCallback, useState } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/Button';

interface FacebookEmbeddedSignupProps {
  onSuccess: (data: any, code: string) => void;
  onError: (error: any) => void;
  appId?: string;
  configId?: string;
  version?: string;
}

export function FacebookEmbeddedSignup({
  onSuccess,
  onError,
  appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
  configId = process.env.NEXT_PUBLIC_WHATSAPP_CONFIG_ID || process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID || '',
  version = 'v26.0'
}: FacebookEmbeddedSignupProps) {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize SDK
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).fbAsyncInit = function() {
        if ((window as any).FB) {
          (window as any).FB.init({
            appId: appId,
            autoLogAppEvents: true,
            xfbml: true,
            version: version
          });
          setIsSdkLoaded(true);
        }
      };
    }
  }, [appId, version]);

  // Message listener for the Embedded Signup flow
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('facebook.com')) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('WA_EMBEDDED_SIGNUP event:', data);
          if (data.event === 'CANCEL') {
            setIsConnecting(false);
            if (data.data?.error_message) {
              onError(new Error(data.data.error_message));
            } else {
              onError(new Error('User cancelled the signup flow'));
            }
          }
          // The successful FINISH event will be handled by the fbLoginCallback below
          // because we need the exchangeable code from the authResponse.
        }
      } catch (err) {
        // Ignored
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onError]);

  const launchWhatsAppSignup = useCallback(() => {
    if (!isSdkLoaded || !(window as any).FB) {
      onError(new Error("Facebook SDK not loaded yet. Please ensure you have configured NEXT_PUBLIC_FACEBOOK_APP_ID."));
      return;
    }

    if (!configId) {
      onError(new Error("Missing NEXT_PUBLIC_WHATSAPP_CONFIG_ID environment variable."));
      return;
    }

    setIsConnecting(true);

    const fbLoginCallback = (response: any) => {
      setIsConnecting(false);
      if (response.authResponse) {
        const code = response.authResponse.code;
        // The session data should also be captured from the message event ideally, 
        // but passing the code is the critical part to exchange for a token backend.
        onSuccess(response, code);
      } else {
        onError(new Error("Failed to authenticate with Facebook"));
      }
    };

    (window as any).FB.login(fbLoginCallback, {
      config_id: configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
      }
    });
  }, [isSdkLoaded, configId, onSuccess, onError]);

  return (
    <>
      <Script 
        src="https://connect.facebook.net/en_US/sdk.js" 
        strategy="lazyOnload"
        crossOrigin="anonymous"
        onLoad={() => {
          // If FB was loaded before our fbAsyncInit fires, trigger it manually
          if ((window as any).FB && !(window as any).FB.getAuthResponse) {
            (window as any).fbAsyncInit();
          }
        }}
      />
      <Button 
        onClick={launchWhatsAppSignup} 
        disabled={!isSdkLoaded || isConnecting}
        className="bg-[#1877f2] text-white hover:bg-[#1877f2]/90 border-0"
      >
        <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
        </svg>
        {isConnecting ? 'Connecting...' : 'Login with Facebook'}
      </Button>
    </>
  );
}
