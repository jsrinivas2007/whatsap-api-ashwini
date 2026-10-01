"use client";

import { useState, useEffect } from 'react';
import { ArrowRight, Save, Send, Link, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const API = (process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://whatsap-api-ashwini.onrender.com' : 'http://localhost:3001')).replace(/\/+$/, '');

export default function TestWhatsappConnectionSection() {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testRecipient, setTestRecipient] = useState('');

  const [status, setStatus] = useState<'Disconnected' | 'Testing' | 'Connected'>('Testing');
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // ── On mount: check if credentials are already saved in the backend ──
  useEffect(() => {
    const checkExistingConfig = async () => {
      try {
        const res = await fetch(`${API}/api/whatsapp/setup-status`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) { setStatus('Disconnected'); return; }
        const data = await res.json();
        // If a record exists with a phone number, credentials have been saved before
        if (data && data.displayPhoneNumber) {
          setStatus('Connected');
        } else {
          setStatus('Disconnected');
        }
      } catch {
        setStatus('Disconnected');
      }
    };
    checkExistingConfig();
  }, []);

  const handleSaveConfiguration = async () => {
    if (!phoneNumberId || !wabaId || !accessToken) {
      setMessage({ type: 'error', text: 'Please fill in Phone Number ID, WABA ID, and Access Token.' });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`${API}/api/whatsapp/test-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumberId, wabaId, accessToken }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save configuration');
      }
      setMessage({ type: 'success', text: 'Configuration saved. Ready to send test messages!' });
      setStatus('Connected');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred while saving.' });
      setStatus('Disconnected');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testRecipient) {
      setMessage({ type: 'error', text: 'Please provide a test recipient phone number.' });
      return;
    }
    setIsSending(true);
    setMessage(null);
    try {
      const response = await fetch(`${API}/api/whatsapp/send-test-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: testRecipient }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send test message');
      }
      setMessage({ type: 'success', text: '✅ Test message sent successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred while sending the message.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-[#e8efe9] mt-8">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#f0f4f1] text-[#276045]">
              <Link className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center rounded-md bg-[#e6eee6] px-2 py-1 text-[11px] font-semibold text-[#276045] mb-2">
                Development / Test
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[#0a1f14]">
                Test WhatsApp Connection
              </h3>
              <p className="mt-1 text-[14px] text-[#4a6355] max-w-lg leading-relaxed">
                Manually configure and test your Meta API credentials to verify message delivery before full integration.
              </p>
            </div>
          </div>

          {/* Live status badge — reflects server state on load */}
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border ${
              status === 'Connected'
                ? 'bg-[#edfcf2] text-[#127a38] border-[#aef0c4]'
                : status === 'Testing'
                ? 'bg-[#fef9e8] text-[#a16207] border-[#fce388]'
                : 'bg-[#f2f4ef] text-[#4a6355] border-[#dce4db]'
            }`}
          >
            {status === 'Connected' && <CheckCircle2 className="h-4 w-4" />}
            {status === 'Testing' && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === 'Disconnected' && <AlertCircle className="h-4 w-4" />}
            Status: {status}
          </div>
        </div>

        {/* Feedback message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
              message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Left — credentials form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#1a2f24] mb-1.5">Phone Number ID</label>
              <input
                type="text"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="e.g. 1234567890"
                className="w-full px-4 py-3 rounded-xl border border-[#dce4db] bg-white focus:outline-none focus:ring-2 focus:ring-[#276045]/20 focus:border-[#276045] transition-all text-[15px]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1a2f24] mb-1.5">WhatsApp Business Account ID</label>
              <input
                type="text"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                placeholder="e.g. 0987654321"
                className="w-full px-4 py-3 rounded-xl border border-[#dce4db] bg-white focus:outline-none focus:ring-2 focus:ring-[#276045]/20 focus:border-[#276045] transition-all text-[15px]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1a2f24] mb-1.5">Access Token</label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAB..."
                className="w-full px-4 py-3 rounded-xl border border-[#dce4db] bg-white focus:outline-none focus:ring-2 focus:ring-[#276045]/20 focus:border-[#276045] transition-all text-[15px]"
              />
              <p className="mt-1.5 text-xs text-[#6b8275]">
                Token is securely sent to your backend and never exposed in the browser.
              </p>
            </div>

            <button
              onClick={handleSaveConfiguration}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#276045] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1a422f] disabled:opacity-70 transition-colors w-full justify-center"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Test Configuration
            </button>
          </div>

          {/* Right — send test message */}
          <div className="bg-[#fcfdfc] p-6 rounded-[20px] border border-[#e8efe9] space-y-4">
            <h4 className="font-bold text-[#1a2f24] flex items-center gap-2">
              <Send className="h-4 w-4 text-[#276045]" />
              Test Connection
            </h4>
            <p className="text-sm text-[#4a6355]">
              Once configured, send a{' '}
              <code className="bg-[#e6eee6] px-1.5 py-0.5 rounded text-[#276045]">hello_world</code>{' '}
              template to verify delivery.
            </p>

            <div className="pt-2">
              <label className="block text-sm font-semibold text-[#1a2f24] mb-1.5">
                Test Recipient Phone Number
              </label>
              <input
                type="text"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Include country code, e.g. 919876543210"
                className="w-full px-4 py-3 rounded-xl border border-[#dce4db] bg-white focus:outline-none focus:ring-2 focus:ring-[#276045]/20 focus:border-[#276045] transition-all text-[15px]"
              />
            </div>

            <button
              onClick={handleSendTestMessage}
              disabled={isSending || status !== 'Connected'}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1a2f24] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full justify-center mt-2"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Send Test Message
            </button>

            {status === 'Disconnected' && (
              <p className="text-xs text-[#6b8275] text-center">
                Save your configuration first to enable this button.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
