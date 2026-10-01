import React, { useState } from 'react';
import { Phone, AlertTriangle, Users } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { SettingsRow } from './SettingsRow';
import { Button } from '@/components/ui/Button';
import { FacebookEmbeddedSignup } from './FacebookEmbeddedSignup';

interface WhatsAppSettingsCardProps {
  isConnected: boolean;
  isSyncing: boolean;
  isRegistering: boolean;
  onSync: () => Promise<number>;
  onRegister: () => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onConnectRedirect: () => void;
}

export function WhatsAppSettingsCard({
  isConnected,
  isSyncing,
  isRegistering,
  onSync,
  onRegister,
  showToast,
  onConnectRedirect
}: WhatsAppSettingsCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSync = async () => {
    try {
      const count = await onSync();
      showToast(`Successfully synced ${count} contacts`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to sync contacts', 'error');
    }
  };

  const handleRegisterConfirm = async () => {
    setShowConfirm(false);
    try {
      await onRegister();
      showToast('Phone number registered successfully', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to register phone number', 'error');
    }
  };

  return (
    <>
      <SettingsCard 
        title="WhatsApp Settings" 
        subtitle="Manage your WhatsApp Business API configuration"
      >
        {!isConnected ? (
          <SettingsRow 
            title="Phone Number Registration" 
            description="Verify your API setup or re-register after a display name change"
          >
            <FacebookEmbeddedSignup
              onSuccess={(data, code) => {
                showToast('Embedded Signup completed! Exchange code sent to backend.', 'success');
                // The actual backend call to exchange this code for an access token goes here
              }}
              onError={(error) => showToast(error.message || 'Signup failed', 'error')}
            />
          </SettingsRow>
        ) : (
          <>
            <SettingsRow 
              title="Sync WhatsApp Contacts" 
              description="Import your existing WhatsApp Business App contacts to this platform"
            >
              <Button 
                variant="primary" 
                onClick={handleSync} 
                isLoading={isSyncing}
              >
                {!isSyncing && <Users className="h-4 w-4" />}
                {isSyncing ? 'Syncing...' : 'Sync Contacts'}
              </Button>
            </SettingsRow>

            <SettingsRow 
              title="Phone Number Registration" 
              description="Verify your API setup or re-register after a display name change"
            >
              <Button 
                variant="outline" 
                onClick={() => setShowConfirm(true)}
                isLoading={isRegistering}
              >
                {!isRegistering && <Phone className="h-4 w-4" />}
                {isRegistering ? 'Registering...' : 'Register Phone'}
              </Button>
            </SettingsRow>
          </>
        )}
      </SettingsCard>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in backdrop-blur-sm">
          <div className="flex w-full max-w-[400px] flex-col rounded-xl bg-card p-6 shadow-xl border border-border text-foreground">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-[16px] font-semibold">Confirm Registration</h3>
            </div>
            <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">
              This action will verify your API setup or re-register your number after a display name change. Are you sure you want to proceed?
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleRegisterConfirm}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
