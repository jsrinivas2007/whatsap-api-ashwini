import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { AppSettings } from '../hooks/useSettings';
import CyberToggle from '@/components/ui/CyberToggle';
import { Button } from '@/components/ui/Button';
import { AddKeywordModal } from './AddKeywordModal';

interface OptInTabProps {
  settings: AppSettings;
  isSavingAll: boolean;
  onSave: (updates: Partial<AppSettings>) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function OptInTab({ settings, isSavingAll, onSave, showToast }: OptInTabProps) {
  // Local state for the tab so we can edit without saving immediately
  const [optInActive, setOptInActive] = useState(settings.optInActive);
  const [optOutKeywords, setOptOutKeywords] = useState<string[]>(settings.optOutKeywords || []);
  const [optOutMessage, setOptOutMessage] = useState(settings.optOutMessage || '');
  const [optInKeywords, setOptInKeywords] = useState<string[]>(settings.optInKeywords || []);
  const [optInMessage, setOptInMessage] = useState(settings.optInMessage || '');
  
  const [modalType, setModalType] = useState<'opt-in' | 'opt-out' | null>(null);

  const handleAddKeyword = (keyword: string) => {
    if (modalType === 'opt-out') {
      if (!optOutKeywords.includes(keyword)) {
        setOptOutKeywords([...optOutKeywords, keyword]);
      }
    } else if (modalType === 'opt-in') {
      if (!optInKeywords.includes(keyword)) {
        setOptInKeywords([...optInKeywords, keyword]);
      }
    }
  };

  const removeKeyword = (type: 'opt-in' | 'opt-out', keyword: string) => {
    if (type === 'opt-out') {
      setOptOutKeywords(optOutKeywords.filter(k => k !== keyword));
    } else {
      setOptInKeywords(optInKeywords.filter(k => k !== keyword));
    }
  };

  const handleSaveAll = async () => {
    try {
      await onSave({
        optInActive,
        optOutKeywords,
        optOutMessage,
        optInKeywords,
        optInMessage
      });
      showToast('Opt-in settings saved successfully', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to save settings', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground">Opt-In/Out Management</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Configure how users can opt-in or opt-out of your WhatsApp messages</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-medium text-muted-foreground">
            {optInActive ? 'Active' : 'Inactive'}
          </span>
          <CyberToggle checked={optInActive} onChange={setOptInActive} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Opt-Out Settings Card */}
        <div className="flex flex-col rounded-xl border border-rose-200 bg-rose-50/30 p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <X className="h-4 w-4" />
            </div>
            <h3 className="text-[16px] font-semibold text-foreground">Opt-Out Settings</h3>
          </div>

          <div className="mb-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-foreground">Opt-Out Keywords</span>
              <button 
                type="button" 
                onClick={() => setModalType('opt-out')}
                className="flex items-center gap-1.5 rounded-[6px] bg-rose-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-rose-700"
              >
                + Add Keyword
              </button>
            </div>
            
            <div className="flex min-h-[120px] flex-col items-center justify-center rounded-[8px] border border-border bg-card p-4">
              {optOutKeywords.length > 0 ? (
                <div className="flex w-full flex-wrap gap-2 justify-start">
                  {optOutKeywords.map(kw => (
                    <div key={kw} className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[12px] font-semibold text-rose-600 border border-rose-100">
                      {kw}
                      <button onClick={() => removeKeyword('opt-out', kw)} className="ml-1 hover:text-rose-800">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] italic text-muted-foreground">No keywords added yet</p>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground">Note: Keywords are case-insensitive and will be stored in UPPERCASE.</p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-foreground">Opt-Out Response Message</span>
            <textarea
              value={optOutMessage}
              onChange={(e) => setOptOutMessage(e.target.value)}
              className="h-[100px] w-full resize-none rounded-[8px] border border-border bg-card p-3 text-[13px] text-foreground outline-none focus:border-rose-400"
            />
          </div>
        </div>

        {/* Opt-In Settings Card */}
        <div className="flex flex-col rounded-xl border border-emerald-200 bg-emerald-50/30 p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-4 w-4" />
            </div>
            <h3 className="text-[16px] font-semibold text-foreground">Opt-In Settings</h3>
          </div>

          <div className="mb-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-foreground">Opt-In Keywords</span>
              <button 
                type="button" 
                onClick={() => setModalType('opt-in')}
                className="flex items-center gap-1.5 rounded-[6px] bg-emerald-500 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                + Add Keyword
              </button>
            </div>
            
            <div className="flex min-h-[120px] flex-col items-center justify-center rounded-[8px] border border-border bg-card p-4">
              {optInKeywords.length > 0 ? (
                <div className="flex w-full flex-wrap gap-2 justify-start">
                  {optInKeywords.map(kw => (
                    <div key={kw} className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-600 border border-emerald-100">
                      {kw}
                      <button onClick={() => removeKeyword('opt-in', kw)} className="ml-1 hover:text-emerald-800">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] italic text-muted-foreground">No keywords added yet</p>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground">Note: Keywords are case-insensitive and will be stored in UPPERCASE.</p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-foreground">Opt-In Response Message</span>
            <textarea
              value={optInMessage}
              onChange={(e) => setOptInMessage(e.target.value)}
              className="h-[100px] w-full resize-none rounded-[8px] border border-border bg-card p-3 text-[13px] text-foreground outline-none focus:border-emerald-400"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button 
          variant="primary" 
          onClick={handleSaveAll}
          isLoading={isSavingAll}
          className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
        >
          Save Settings
        </Button>
      </div>

      {modalType && (
        <AddKeywordModal 
          type={modalType} 
          onClose={() => setModalType(null)} 
          onAdd={handleAddKeyword} 
        />
      )}
    </div>
  );
}
