import { useState } from "react";
import {
  X,
  Phone,
  MessageSquare,
  ArrowRightLeft,
  Shield,
  Loader2
} from "lucide-react";
import { useFacebook } from "@/components/providers/FacebookProvider";

interface ConnectWhatsappModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConnectWhatsappModal({
  isOpen,
  onClose,
  onSuccess,
}: ConnectWhatsappModalProps) {
  const [selectedOption, setSelectedOption] = useState<"new_number" | "existing_number" | "migrated" | null>(null);
  const [otpConfirmed, setOtpConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isSdkReady } = useFacebook();

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!selectedOption || !otpConfirmed) return;
    setLoading(true);
    setError(null);

    try {
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname === 'localhost') {
        throw new Error("Meta requires HTTPS for Facebook Login. I have started a secure HTTPS proxy for you in the background! Please change your browser URL to exactly: https://localhost:3005 to continue.");
      }

      // 1. Init Session with backend to ensure connection_type is noted
      const initRes = await fetch("/api/whatsapp/embedded-signup/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_type: selectedOption }),
      });

      if (!initRes.ok) throw new Error("Failed to initialize session on backend");

      // 2. Launch Meta Embedded Signup via FB SDK
      window.FB.login((response: any) => {
        if (response.authResponse) {
          const code = response.authResponse.code;
          
          // 3. Callback with the auth code to backend
          fetch("/api/whatsapp/embedded-signup/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ connection_type: selectedOption, code }),
          })
          .then(async (callbackRes) => {
             if (!callbackRes.ok) {
               const errData = await callbackRes.json().catch(() => ({}));
               throw new Error(errData.message || "Failed to complete connection on server");
             }
             onSuccess();
          })
          .catch((err) => {
            setError(err.message || "An error occurred during server token exchange.");
          })
          .finally(() => {
            setLoading(false);
          });
        } else {
          // User cancelled or SDK failed to return authResponse
          setError("Facebook login was cancelled or failed. Please try again.");
          setLoading(false);
        }
      }, {
        config_id: process.env.NEXT_PUBLIC_WHATSAPP_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          feature: 'whatsapp_embedded_signup',
          sessionInfoVersion: '3'
        }
      });
    } catch (err: any) {
      setError(err.message || "An error occurred initiating connection.");
      setLoading(false);
    }
  };

  const options = [
    {
      id: "new_number" as const,
      icon: <Phone className="h-5 w-5" />,
      title: "New number",
      description: "I want to use a new number that is not active on any WhatsApp Business app",
    },
    {
      id: "existing_number" as const,
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Existing number",
      description: "I want to use a phone number that's currently active on WhatsApp Business app",
    },
    {
      id: "migrated" as const,
      icon: <ArrowRightLeft className="h-5 w-5" />,
      title: "Migrate",
      description: "I want to migrate my existing WhatsApp API number from another provider (Twilio, Wati, Interakt, AiSensy, etc.)",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-card shadow-lg border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Connect WhatsApp Business API</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="rounded-[8px] bg-rose-500/10 p-3 text-sm text-rose-600 border border-rose-500/20">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Select your connection method:</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => !loading && setSelectedOption(opt.id)}
                    className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 flex flex-col gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:bg-muted"
                    } ${loading ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    {isSelected && (
                      <div className="absolute right-3 top-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {opt.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{opt.title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{opt.description}</p>
                    </div>
                    <div className="mt-auto pt-2">
                      <a href="#" className="text-xs font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        Watch tutorial
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold text-foreground">Verification Requirements</h4>
            </div>
            {selectedOption === 'existing_number' && (
              <div className="mb-4 rounded-[8px] bg-amber-500/10 p-3 text-sm text-amber-600 border border-amber-500/20 dark:text-amber-400">
                <strong>Important for Existing Numbers:</strong> If this number is currently active on the WhatsApp mobile app, it will <strong>not</strong> show up in Meta's dropdown menu. You must first go to Settings → Account → Delete Account in your WhatsApp app on your phone to free up the number for the API.
              </div>
            )}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={otpConfirmed}
                onChange={(e) => setOtpConfirmed(e.target.checked)}
                disabled={loading}
                className="mt-0.5 h-4 w-4 rounded border-input bg-background text-primary shadow-sm focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground leading-snug">
                I confirm that I can receive OTP (One-Time Password) via SMS or Call on this number.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-border bg-muted/30 p-5 sm:flex-row">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            By continuing, you agree to our <a href="#" className="underline hover:text-foreground">Terms of Service</a> and <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center rounded-[8px] border border-border bg-card px-4 text-[13px] font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              disabled={!selectedOption || !otpConfirmed || loading || !isSdkReady}
              className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center gap-2 rounded-[8px] px-6 text-[13px] font-semibold text-white shadow-sm transition-colors disabled:opacity-50 disabled:pointer-events-none"
              style={{ backgroundColor: '#1877F2' }}
            >
              {(loading || !isSdkReady) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {!isSdkReady ? "Loading SDK..." : "Connecting..."}
                </>
              ) : (
                "Continue with Facebook"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
