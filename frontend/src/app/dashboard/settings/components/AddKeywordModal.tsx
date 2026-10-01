import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AddKeywordModalProps {
  type: 'opt-in' | 'opt-out';
  onClose: () => void;
  onAdd: (keyword: string) => void;
}

const OPT_OUT_SUGGESTIONS = ['STOP', 'CANCEL', 'UNSUBSCRIBE', 'END', 'QUIT'];
const OPT_IN_SUGGESTIONS = ['START', 'JOIN', 'SUBSCRIBE', 'YES'];

export function AddKeywordModal({ type, onClose, onAdd }: AddKeywordModalProps) {
  const [keyword, setKeyword] = useState('');
  
  const isOptOut = type === 'opt-out';
  const suggestions = isOptOut ? OPT_OUT_SUGGESTIONS : OPT_IN_SUGGESTIONS;
  
  const handleAdd = () => {
    if (keyword.trim()) {
      onAdd(keyword.trim().toUpperCase());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-[460px] rounded-2xl border border-border bg-card p-6 text-foreground shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold tracking-tight">
            Add {isOptOut ? 'Opt-Out' : 'Opt-In'} Keyword
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-[14px] font-medium text-foreground">New Keyword</label>
            <input 
              autoFocus
              type="text" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder={`ENTER ${isOptOut ? 'OPT-OUT' : 'OPT-IN'} KEYWORD`}
              className="h-11 w-full rounded-[8px] border border-border bg-background px-4 text-[14px] font-medium text-foreground outline-none uppercase placeholder:normal-case focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <p className="mb-3 text-[14px] font-medium text-muted-foreground">Suggested Keywords:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setKeyword(sug)}
                  className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors ${
                    isOptOut 
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!keyword.trim()}
            className={`inline-flex h-10 items-center justify-center rounded-[8px] px-6 text-[13px] font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isOptOut ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            Add Keyword
          </button>
        </div>
      </div>
    </div>
  );
}
