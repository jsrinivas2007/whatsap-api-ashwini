'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, AlertCircle } from 'lucide-react';
import { SectionLoader } from '@/components/ui/Loader';
import { SettingsTabs, SETTINGS_TABS } from './components/SettingsTabs';
import { BasicTab } from './components/BasicTab';
import { OptInTab } from './components/OptInTab';
import { TagsTab } from './components/TagsTab';
import { QuickRepliesTab } from './components/QuickRepliesTab';
import { WhatsAppFormsTab } from './components/WhatsAppFormsTab';
import { WhatsAppSettingsCard } from './components/WhatsAppSettingsCard';
import { useSettings } from './hooks/useSettings';
import { Button } from '@/components/ui/Button';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'basic';
  const activeTab = SETTINGS_TABS.some(t => t.id === tab) ? tab : 'basic';

  const {
    settings,
    isLoading,
    error,
    isWhatsAppConnected,
    isSyncing,
    isRegistering,
    isUpdatingSetting,
    isSavingAll,
    fetchAllData,
    updateSetting,
    saveMultipleSettings,
    syncWhatsAppContacts,
    registerPhoneNumber,
  } = useSettings();

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (isLoading) {
    return <SectionLoader text="Loading settings..." />;
  }

  if (error || !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 rounded-full bg-rose-500/10 p-3 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">Failed to load settings</h3>
        <p className="mb-6 text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={fetchAllData}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Toast Notification matches existing pattern */}
      {toast && (
        <div className={`fixed right-6 top-6 z-[100] flex items-center gap-2 rounded-[8px] px-4 py-3 text-[12px] font-medium text-white shadow-lg animate-in fade-in slide-in-from-top-2 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your workspace preferences, billing, and WhatsApp connections.</p>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <SettingsTabs activeTab={activeTab} />
        
        <div className="p-6">
          {activeTab === 'basic' ? (
            <div className="flex flex-col gap-6">
              <BasicTab 
                settings={settings}
                isUpdatingSetting={isUpdatingSetting}
                onUpdateSetting={updateSetting}
                showToast={showToast}
              />
              <WhatsAppSettingsCard
                isConnected={isWhatsAppConnected}
                isSyncing={isSyncing}
                isRegistering={isRegistering}
                onSync={syncWhatsAppContacts}
                onRegister={registerPhoneNumber}
                showToast={showToast}
                onConnectRedirect={() => router.push('/dashboard/settings?tab=basic')}
              />
            </div>
          ) : activeTab === 'opt-in' ? (
            <OptInTab
              settings={settings}
              isSavingAll={isSavingAll}
              onSave={saveMultipleSettings}
              showToast={showToast}
            />
          ) : activeTab === 'quick-reply' ? (
            <QuickRepliesTab showToast={showToast} />
          ) : activeTab === 'whatsapp-forms' ? (
            <WhatsAppFormsTab showToast={showToast} />
          ) : activeTab === 'tags' ? (
            <TagsTab
              showToast={showToast}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Coming Soon</h3>
              <p className="mt-2 text-sm text-muted-foreground">The {SETTINGS_TABS.find(t => t.id === activeTab)?.label} settings are currently under development.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SectionLoader text="Loading settings..." />}>
      <SettingsContent />
    </Suspense>
  );
}
