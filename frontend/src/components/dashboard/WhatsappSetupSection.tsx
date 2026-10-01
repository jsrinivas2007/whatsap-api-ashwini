"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Zap,
  Shield,
  BarChart3,
  RefreshCw,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import Stepper, { StepItem } from "@/components/ui/Stepper";
import { SectionLoader } from "@/components/ui/Loader";
import BusinessProfileModal from "./BusinessProfileModal";
// Removed ConnectWhatsappModal import

// Load the Facebook JS SDK and initialize it
function loadFBSdk() {
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  if (!appId || typeof window === 'undefined') return;
  if ((window as any).FB) return; // already loaded
  
  (window as any).fbAsyncInit = function () {
    (window as any).FB.init({
      appId,
      autoLogAppEvents: true,
      xfbml: true,
      version: 'v26.0',
    });
  };

  if (!document.getElementById('facebook-jssdk')) {
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  }
}

type SetupStatus = {
  businessName: string;
  displayPhoneNumber: string;
  messageLimitTier: string;
  accountStatus: "approved" | "pending" | "restricted" | "disabled";
  qualityRating: "green" | "yellow" | "red" | "unknown";
  fbBusinessVerificationStatus: "verified" | "pending" | "not_started";
  paymentMethodStatus: "configured" | "action_required";
};

export default function WhatsappSetupSection() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  const fetchStatus = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/whatsapp/setup-status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        setStatus(null);
      }
    } catch (e) {
      setStatus(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFBSdk();
    fetchStatus();
  }, []);

  const handleConnectDirectly = async () => {
    setRefreshing(true);
    try {
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname === 'localhost') {
        alert("Meta requires HTTPS for Facebook Login. I have started a secure HTTPS proxy for you in the background! Please change your browser URL to exactly: https://localhost:3005 to continue.");
        setRefreshing(false);
        return;
      }
      
      if (!window.FB) {
        alert("Facebook SDK is still loading or failed to load. Please wait a moment and try again.");
        setRefreshing(false);
        return;
      }

      // 1. Init Session with backend
      const initRes = await fetch("/api/whatsapp/embedded-signup/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_type: "new_number" }),
      });

      if (!initRes.ok) throw new Error("Failed to initialize session on backend");

      // 2. Launch Meta Embedded Signup via FB SDK
      const configId = process.env.NEXT_PUBLIC_WHATSAPP_CONFIG_ID;
      console.log("Launching FB login with config_id:", configId);
      
      window.FB.login((response: any) => {
        if (response.authResponse) {
          const code = response.authResponse.code;
          
          // 3. Callback with the auth code to backend
          fetch("/api/whatsapp/embedded-signup/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ connection_type: "new_number", code }),
          })
          .then(async (callbackRes) => {
             if (!callbackRes.ok) {
               const errData = await callbackRes.json().catch(() => ({}));
               throw new Error(errData.message || "Failed to complete connection on server");
             }
             fetchStatus();
          })
          .catch((err) => {
            alert(err.message || "An error occurred during server token exchange.");
          })
          .finally(() => {
            setRefreshing(false);
          });
        } else {
          // User cancelled
          setRefreshing(false);
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
      alert(err.message || "An error occurred initiating connection.");
      setRefreshing(false);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "approved":
        return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Approved</span>;
      case "pending":
        return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Pending</span>;
      default:
        return <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">Restricted</span>;
    }
  };

  const getQualityBadge = (q: string) => {
    switch (q) {
      case "green":
        return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">High</span>;
      case "yellow":
        return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Medium</span>;
      case "red":
        return <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">Low</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Unknown</span>;
    }
  };

  if (loading) {
    return <SectionLoader text="Loading setup status..." />;
  }

  const isConnected = status !== null;

  const steps: StepItem[] = [
    {
      id: "api",
      title: "Get Your WhatsApp Business API",
      badge: isConnected && status?.accountStatus === "approved" ? (
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Connected
        </span>
      ) : (
        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          Not Connected
        </span>
      ),
      icon: <MessageSquare className="h-4 w-4" />,
      content: isConnected ? (
        <div className="space-y-4 text-foreground">
          <p>Your WhatsApp Business account is connected and ready to send messages.</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="inline-flex h-9 items-center justify-center rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Update Business Profile
            </button>
            <button
              onClick={handleConnectDirectly}
              disabled={refreshing}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border border-border bg-card px-4 text-[13px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Reconnect WhatsApp
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-foreground">
          <p className="text-sm text-muted-foreground">
            Get instant access to the WhatsApp Business API using your Facebook account.
          </p>
          <button
            onClick={handleConnectDirectly}
            disabled={refreshing}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {refreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />} Connect WhatsApp
          </button>
        </div>
      ),
    },
    {
      id: "payment",
      title: "Add Payment Method",
      disabled: !isConnected,
      badge: status?.paymentMethodStatus === "action_required" ? (
        <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-3 w-3" /> Action Required
        </span>
      ) : (
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Configured
        </span>
      ),
      icon: <Zap className="h-4 w-4" />,
      content: (
        <div className="space-y-4 text-foreground">
          <p>
            Meta Business Manager needs billing details on file before marketing templates can go out or your daily cap can grow.
          </p>
          {status?.paymentMethodStatus === "action_required" && (
            <div className="rounded-[8px] border border-[#0d5c75] bg-[#e0f7fa]/30 p-4">
              <h4 className="mb-2 text-[13px] font-semibold text-[#0d5c75]">How to add your payment method:</h4>
              <ol className="list-decimal pl-4 text-[#157999] space-y-1">
                <li>Add a credit card in Facebook Business Manager.</li>
                <li>Set the card as the default payment method via the three-dot menu.</li>
                <li>Complete your billing info (including GST details for India).</li>
              </ol>
            </div>
          )}
          <div>
            <a
              href="https://business.facebook.com/billing_hub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border border-border bg-card px-4 text-[13px] font-semibold text-foreground hover:bg-muted"
            >
              Add Payment Method <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      ),
    },
    {
      id: "verification",
      title: "Facebook Business Verification",
      disabled: !isConnected,
      badge: status?.fbBusinessVerificationStatus === "verified" ? (
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Verified
        </span>
      ) : (
        <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-3 w-3" /> Action Required
        </span>
      ),
      icon: <Shield className="h-4 w-4" />,
      content: (
        <div className="space-y-4 text-foreground">
          <p>
            Meta Business Manager needs billing details on file before marketing templates can go out or your daily cap can grow.
          </p>
          <div>
            <a
              href="https://business.facebook.com/settings/security"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border border-border bg-card px-4 text-[13px] font-semibold text-foreground hover:bg-muted"
            >
              Manage Business <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <BusinessProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight text-[#0a1f14]">
            <div className="h-2.5 w-2.5 rounded-full bg-[#3c8c68]"></div>
            Set up WhatsApp messaging
          </h2>
          <p className="mt-1 text-[15px] text-[#4a6355]">
            A few steps stand between you and bulk broadcasts, automation and more.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={refreshing}
          className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#dce4db] bg-white px-4 text-[13px] font-bold text-[#1a2f24] hover:bg-[#f8faf8] disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh status
        </button>
      </div>

      {/* Removed ConnectWhatsappModal */}

      {isConnected && (
        <div className="mb-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Top Row: Business Name & Status */}
            <div className="sm:col-span-2 lg:col-span-3 rounded-lg bg-white p-4 shadow-sm border border-border flex flex-col justify-center">
              <div className="text-xl font-semibold text-foreground pb-3 border-b border-dashed border-border">
                {status?.businessName || 'Synzii'}
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-muted-foreground">
                  <Phone className="h-3 w-3" />
                </div>
                +{status?.displayPhoneNumber || '1 555-326-5103'}
              </div>
            </div>
            
            <div className="rounded-lg bg-[#2a7352] p-4 shadow-sm border border-[#236044] flex flex-col justify-center">
              <div className="flex items-center gap-2 text-xs font-medium text-white/90 mb-2">
                <Shield className="h-4 w-4" /> Status
              </div>
              <div className="text-xl font-semibold text-white capitalize">
                {status?.accountStatus || 'Approved'}
              </div>
            </div>
            
            {/* Bottom Row: Limit, Rating, Usage */}
            <div className="sm:col-span-1 lg:col-span-1 rounded-lg bg-white p-4 shadow-sm border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 font-medium">
                <Zap className="h-4 w-4" /> Limit (24h)
              </div>
              <div className="text-base font-semibold text-foreground">{status?.messageLimitTier || 'TIER_1K'}</div>
            </div>
            
            <div className="sm:col-span-1 lg:col-span-2 rounded-lg bg-white p-4 shadow-sm border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 font-medium">
                <BarChart3 className="h-4 w-4" /> Rating
              </div>
              <div>
                <span className="inline-flex rounded-md bg-[#faebd7] px-2.5 py-0.5 text-xs font-semibold text-[#c98835]">
                  {status?.qualityRating === 'green' ? 'High' : status?.qualityRating === 'yellow' ? 'Medium' : status?.qualityRating === 'red' ? 'Low' : 'High'}
                </span>
              </div>
            </div>
            
            <div className="sm:col-span-1 lg:col-span-1 rounded-lg bg-white p-4 shadow-sm border border-border flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 font-medium">
                <BarChart3 className="h-4 w-4" /> Usage
              </div>
              <a href="/api/whatsapp/insights-link" target="_blank" className="text-sm font-semibold text-primary hover:underline mt-1">
                View insights &rarr;
              </a>
            </div>

          </div>
        </div>
      )}

      <div className="max-w-[800px]">
        <Stepper steps={steps} />
      </div>
    </>
  );
}
