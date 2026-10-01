import { useState, useEffect, useCallback } from 'react';

export interface AppSettings {
  companyName: string;
  website: string;
  autoChatAssignment: boolean;
  dripCampaignAutomation: boolean;
  optInActive: boolean;
  optOutKeywords: string[];
  optOutMessage: string;
  optInKeywords: string[];
  optInMessage: string;
  tags: string[];
  attributes: string[];
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track specific action states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUpdatingSetting, setIsUpdatingSetting] = useState<Record<string, boolean>>({});
  const [isSavingAll, setIsSavingAll] = useState(false);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch WhatsApp Status (Real Endpoint)
      const waRes = await fetch('/api/whatsapp/setup-status');
      if (waRes.ok) {
        setIsWhatsAppConnected(true);
      } else if (waRes.status === 404 || (await waRes.text()) === '') {
        setIsWhatsAppConnected(false);
      } else {
        setIsWhatsAppConnected(false);
      }

      // 2. Fetch General Settings (Mock Endpoint)
      try {
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const json = await settingsRes.json();
          setSettings(json);
        } else {
          throw new Error('Failed to fetch settings');
        }
      } catch (e) {
        // Mock fallback
        setSettings({
          companyName: 'Ashwini Innovations',
          website: 'https://ashwini.com',
          autoChatAssignment: true,
          dripCampaignAutomation: false,
          optInActive: false,
          optOutKeywords: [],
          optOutMessage: 'You have been opted out. Reply START to opt in again.',
          optInKeywords: ['JOIN'],
          optInMessage: 'Thank you for opting in to our messages. Reply STOP to opt out at any time.',
          tags: ['High Intent', 'VIP', 'Pricing', 'Hot Lead'],
          attributes: ['Region: India', 'Owner: Sales', 'Owner: You'],
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const updateSetting = async (key: keyof AppSettings, value: any): Promise<void> => {
    if (!settings) return;
    
    setIsUpdatingSetting(prev => ({ ...prev, [key]: true }));
    const previousSettings = { ...settings };
    
    // Optimistic Update
    setSettings(prev => prev ? { ...prev, [key]: value } : null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      
      await new Promise(r => setTimeout(r, 600)); // Simulate delay
      if (!res.ok && res.status !== 404) {
        throw new Error('Update failed');
      }
      
    } catch (e: any) {
      setSettings(previousSettings);
      throw e;
    } finally {
      setIsUpdatingSetting(prev => ({ ...prev, [key]: false }));
    }
  };

  const saveMultipleSettings = async (updates: Partial<AppSettings>): Promise<void> => {
    if (!settings) return;
    setIsSavingAll(true);
    const previousSettings = { ...settings };
    setSettings(prev => prev ? { ...prev, ...updates } : null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      await new Promise(r => setTimeout(r, 800)); // Simulate delay
      if (!res.ok && res.status !== 404) {
        throw new Error('Update failed');
      }
    } catch (e: any) {
      setSettings(previousSettings);
      throw e;
    } finally {
      setIsSavingAll(false);
    }
  };

  const syncWhatsAppContacts = async (): Promise<number> => {
    setIsSyncing(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      return 124;
    } finally {
      setIsSyncing(false);
    }
  };

  const registerPhoneNumber = async (): Promise<void> => {
    setIsRegistering(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
    } finally {
      setIsRegistering(false);
    }
  };

  return {
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
  };
}
