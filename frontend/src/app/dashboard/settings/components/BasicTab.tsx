import React, { useState } from 'react';
import { ExternalLink, AlertTriangle, Phone, Check, AlertCircle } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { SettingsRow } from './SettingsRow';
import CyberToggle from '@/components/ui/CyberToggle';
import { AppSettings } from '../hooks/useSettings';
import { Button } from '@/components/ui/Button';

interface BasicTabProps {
  settings: AppSettings;
  isUpdatingSetting: Record<keyof AppSettings, boolean>;
  onUpdateSetting: (key: keyof AppSettings, value: any) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function BasicTab({ settings, isUpdatingSetting, onUpdateSetting, showToast }: BasicTabProps) {
  const handleToggle = async (key: keyof AppSettings, checked: boolean) => {
    try {
      await onUpdateSetting(key, checked);
      showToast(`${key === 'autoChatAssignment' ? 'Auto Chat Assignment' : 'Drip Campaign Automation'} updated successfully`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to update setting', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard title="Company Information">
        <div className="grid gap-6 px-6 py-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-medium text-muted-foreground">Company Name</span>
            <span className="text-[14px] font-medium text-foreground">
              {settings.companyName || '—'}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-medium text-muted-foreground">Website</span>
            {settings.website ? (
              <a 
                href={settings.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-primary hover:underline"
              >
                {settings.website}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span className="text-[14px] font-medium text-foreground">—</span>
            )}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard 
        title="General Settings" 
        subtitle="Configure how your account works"
      >
        <SettingsRow 
          title="Auto Chat Assignment (Round Robin)" 
          description="Automatically assigns incoming WhatsApp chats to your team one by one, so everyone gets an equal number of chats."
        >
          <CyberToggle 
            checked={settings.autoChatAssignment}
            disabled={isUpdatingSetting.autoChatAssignment}
            onChange={(checked) => handleToggle('autoChatAssignment', checked)} 
          />
        </SettingsRow>
        <SettingsRow 
          title="Drip Campaign Automation" 
          description="Trigger the automated message flow from the Automation section when an API campaign template is sent"
        >
          <CyberToggle 
            checked={settings.dripCampaignAutomation}
            disabled={isUpdatingSetting.dripCampaignAutomation}
            onChange={(checked) => handleToggle('dripCampaignAutomation', checked)} 
          />
        </SettingsRow>
      </SettingsCard>
    </div>
  );
}
