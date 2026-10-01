"use client";

import { useState, FormEvent } from 'react';
import { Plus, X } from 'lucide-react';

interface CreateFlowModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (flowId: string) => void;
}

export function CreateFlowModal({ open, onClose, onCreated }: CreateFlowModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create flow');
        return;
      }

      const flow = await res.json();
      setName('');
      onCreated(flow.id);
    } catch {
      setError('Failed to create flow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Plus className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-foreground flex-1">Create New Flow</h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <label htmlFor="flow-name" className="block text-sm font-medium text-foreground mb-2">
              Flow Name
            </label>
            <input
              id="flow-name"
              type="text"
              placeholder="Enter flow name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              disabled={loading}
              autoFocus
              className="w-full h-11 rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition disabled:opacity-50"
            />
            {error && (
              <p className="mt-2 text-sm text-rose-500">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="h-10 px-5 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="h-10 px-5 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
