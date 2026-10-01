import React, { useState, useEffect } from 'react';
import { ExternalLink, FileText, Plus, X, AlertCircle, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionLoader } from '@/components/ui/Loader';

interface WhatsAppFlow {
  id: string;
  name: string;
  status: 'draft' | 'published' | 'error';
  screens_count: number;
  created_at: string;
  error_message?: string;
}

export function WhatsAppFormsTab({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [flows, setFlows] = useState<WhatsAppFlow[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [panelOpen, setPanelOpen] = useState(false);
  const [playgroundUrl, setPlaygroundUrl] = useState('https://business.facebook.com/wa/manage/flows/');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [flowsRes, urlRes] = await Promise.all([
        fetch('/api/whatsapp-flows'),
        fetch('/api/whatsapp-flows/playground-url')
      ]);
      
      if (flowsRes.ok) {
        setFlows(await flowsRes.json());
      }
      if (urlRes.ok) {
        const urlData = await urlRes.json();
        if (urlData.url) setPlaygroundUrl(urlData.url);
      }
    } catch (err) {
      showToast('Failed to load WhatsApp Flows', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this form?')) return;
    try {
      const res = await fetch(`/api/whatsapp-flows/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setFlows(prev => prev.filter(f => f.id !== id));
      showToast('Form deleted', 'success');
    } catch {
      showToast('Error deleting form', 'error');
    }
  };

  if (loading) return <SectionLoader text="Loading WhatsApp Forms..." />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground">WhatsApp Forms/Flows</h2>
          <p className="text-[13px] text-muted-foreground">Create interactive forms and experiences for your WhatsApp customers.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={playgroundUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-[8px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 border border-border bg-card text-foreground hover:bg-muted h-10 px-6 text-[13px]"
          >
            Build in Playground <ExternalLink className="ml-2 h-4 w-4" />
          </a>
          <Button onClick={() => setPanelOpen(true)} variant="primary" className="bg-[#1B2CC1] hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Create Form
          </Button>
        </div>
      </div>

      {flows.length > 0 ? (
        <div className="rounded-[8px] border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Screens</th>
                <th className="px-6 py-3 font-semibold">Created At</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {flows.map(flow => (
                <tr key={flow.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium">{flow.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      flow.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                      flow.status === 'error' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {flow.status.charAt(0).toUpperCase() + flow.status.slice(1)}
                    </span>
                    {flow.status === 'error' && flow.error_message && (
                      <p className="mt-1 text-[11px] text-rose-600 truncate max-w-[200px]" title={flow.error_message}>
                        {flow.error_message}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {flow.screens_count} screen{flow.screens_count !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(flow.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(flow.id)} className="p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-500 rounded text-xs text-rose-600">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-border bg-card py-16 text-center">
          <FileText className="mb-4 h-10 w-10 text-muted-foreground/30" />
          <h3 className="text-[15px] font-semibold">No forms yet</h3>
          <p className="mt-1 text-[13px] text-muted-foreground max-w-md">Get started by creating your first WhatsApp Form.</p>
          <Button onClick={() => setPanelOpen(true)} variant="outline" className="mt-4">
            + Create Form
          </Button>
        </div>
      )}

      {panelOpen && (
        <WhatsAppFormSidePanel
          playgroundUrl={playgroundUrl}
          onClose={() => setPanelOpen(false)}
          onSave={async () => {
            await fetchData();
            setPanelOpen(false);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export function WhatsAppFormSidePanel({
  playgroundUrl,
  onClose,
  onSave,
  showToast,
}: {
  playgroundUrl: string;
  onClose: () => void;
  onSave: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [name, setName] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  const validateJson = (text: string) => {
    if (!text.trim()) {
      setJsonError(null);
      return false;
    }
    try {
      const parsed = JSON.parse(text);
      if (!parsed.version) {
        setJsonError('Missing top-level "version" field.');
        return false;
      }
      if (!parsed.screens || !Array.isArray(parsed.screens)) {
        setJsonError('Missing top-level "screens" array.');
        return false;
      }
      setJsonError(null);
      return true;
    } catch (e) {
      setJsonError('Invalid JSON format.');
      return false;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    if (name.trim() || jsonText.trim()) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to close?')) return;
    }
    onClose();
  };

  const save = async () => {
    if (!name.trim() || !jsonText.trim()) return;
    if (!validateJson(jsonText)) return;
    
    setSaving(true);
    setMetaError(null);
    try {
      const parsedJson = JSON.parse(jsonText);
      const payload = { name: name.trim(), flow_json: parsedJson };
      
      const res = await fetch('/api/whatsapp-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Error creating form');
      }

      if (data.status === 'error') {
        setMetaError(data.error_message || 'Meta rejected the Flow JSON.');
        setSaving(false);
        return;
      }
      
      showToast('WhatsApp Form created and published!', 'success');
      onSave();
    } catch (e: any) {
      showToast(e.message, 'error');
      setSaving(false);
    }
  };

  const isValid = name.trim().length > 0 && jsonText.trim().length > 0 && jsonError === null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-sm transition-all" onClick={handleBackdropClick}>
      <div className="h-full w-full max-w-[480px] bg-background shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-[18px] font-semibold">Create New WhatsApp Form</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Build your form in the playground, then paste the JSON here.</p>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="rounded-[8px] bg-blue-50 border border-blue-100 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-[13px] font-semibold text-blue-900">Use WhatsApp Flows Playground</h3>
                <p className="text-[12px] text-blue-800 mt-1 mb-3">
                  Meta's Playground is the easiest way to visually build your form and export the valid JSON required here.
                </p>
                <a 
                  href={playgroundUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[8px] font-medium transition-colors focus:outline-none border border-border text-foreground hover:bg-muted h-8 px-3 text-[12px] bg-white shadow-sm"
                >
                  Open Playground <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {metaError && (
            <div className="rounded-[8px] bg-rose-50 border border-rose-100 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-[13px] font-semibold text-rose-900">Meta API Error</h3>
                  <p className="text-[12px] text-rose-800 mt-1">{metaError}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-[13px] font-semibold text-foreground">Form Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Customer Feedback Form"
              className="mt-2 h-10 w-full rounded-[8px] border border-border bg-card px-3 text-[13px] outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[13px] font-semibold text-foreground">Flow JSON</label>
            <textarea
              value={jsonText}
              onChange={e => {
                setJsonText(e.target.value);
                validateJson(e.target.value);
              }}
              onBlur={() => validateJson(jsonText)}
              placeholder={`{\n  "version": "5.0",\n  "screens": [\n    ...\n  ]\n}`}
              className={`mt-2 h-64 w-full resize-none rounded-[8px] border ${jsonError ? 'border-rose-500 focus:border-rose-500' : 'border-border focus:border-primary'} bg-card p-3 text-[13px] outline-none font-mono`}
            />
            {jsonError ? (
              <p className="mt-1 text-[11px] text-rose-500">{jsonError}</p>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">The JSON must be valid and follow Meta's Flow JSON schema.</p>
            )}
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 flex justify-end gap-3 bg-card mt-auto">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={save}
            disabled={!isValid || saving}
            className="bg-[#1B2CC1] text-white disabled:opacity-50"
          >
            {saving ? 'Creating & Publishing...' : 'Create & Publish'}
          </Button>
        </div>
      </div>
    </div>
  );
}
