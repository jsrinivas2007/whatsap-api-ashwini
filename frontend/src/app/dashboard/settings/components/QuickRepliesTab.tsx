import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Pencil, Trash2, X, AlertCircle, Bold, Italic, Strikethrough, Code } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionLoader } from '@/components/ui/Loader';
import PhoneMockup from '@/components/dashboard/PhoneMockup';

interface QuickReply {
  id: string;
  title: string;
  message: string;
  shortcut?: string | null;
  created_at: string;
}

export function QuickRepliesTab({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quick-replies');
      if (res.ok) {
        setReplies(await res.json());
      }
    } catch (err) {
      showToast('Failed to load quick replies', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPanel = (reply?: QuickReply) => {
    setEditingReply(reply || null);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingReply(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this quick reply?')) return;
    try {
      const res = await fetch(`/api/quick-replies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setReplies(prev => prev.filter(r => r.id !== id));
      showToast('Quick reply deleted', 'success');
    } catch {
      showToast('Error deleting quick reply', 'error');
    }
  };

  if (loading) return <SectionLoader text="Loading quick replies..." />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground">Quick Replies</h2>
          <p className="text-[13px] text-muted-foreground">Manage pre-written responses for common messages.</p>
        </div>
        <Button onClick={() => openPanel()} variant="primary" className="bg-[#1B2CC1] hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Quick Reply
        </Button>
      </div>

      {replies.length > 0 ? (
        <div className="rounded-[8px] border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold">Title</th>
                <th className="px-6 py-3 font-semibold">Shortcut</th>
                <th className="px-6 py-3 font-semibold">Message</th>
                <th className="px-6 py-3 font-semibold">Created At</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {replies.map(reply => (
                <tr key={reply.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium">{reply.title}</td>
                  <td className="px-6 py-4">
                    {reply.shortcut ? <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">/{reply.shortcut}</span> : '-'}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate">
                    {reply.message}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(reply.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openPanel(reply)} className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(reply.id)} className="ml-2 p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-500 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-border bg-card py-16 text-center">
          <MessageSquare className="mb-4 h-10 w-10 text-muted-foreground/30" />
          <h3 className="text-[15px] font-semibold">Create Your First Quick Reply</h3>
          <p className="mt-1 text-[13px] text-muted-foreground max-w-md">Save time by creating pre-written responses for common messages. Quick replies help you maintain consistent communication with your customers.</p>
          <Button onClick={() => openPanel()} variant="outline" className="mt-4">
            + Create Quick Reply
          </Button>
        </div>
      )}

      {panelOpen && (
        <QuickReplySidePanel
          reply={editingReply}
          onClose={closePanel}
          onSave={async () => {
            await fetchData();
            closePanel();
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function QuickReplySidePanel({
  reply,
  onClose,
  onSave,
  showToast,
}: {
  reply: QuickReply | null;
  onClose: () => void;
  onSave: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [title, setTitle] = useState(reply?.title || '');
  const [message, setMessage] = useState(reply?.message || '');
  const [shortcut, setShortcut] = useState(reply?.shortcut || '');
  const [saving, setSaving] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  const handleSelect = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    if (start !== end) {
      setSelectionRange({ start, end });
    } else {
      setSelectionRange(null);
    }
  };

  const applyFormatting = (prefix: string, suffix: string) => {
    if (!textareaRef.current || !selectionRange) return;
    const { start, end } = selectionRange;
    const selectedText = message.substring(start, end);
    const newMsg = message.substring(0, start) + prefix + selectedText + suffix + message.substring(end);
    setMessage(newMsg);
    setSelectionRange(null);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = end + prefix.length + suffix.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    if (message !== (reply?.message || '') || title !== (reply?.title || '')) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to close?')) return;
    }
    onClose();
  };

  const save = async () => {
    if (!title.trim() || !message.trim()) return;
    setSaving(true);
    try {
      const payload = { title: title.trim(), message: message.trim(), shortcut: shortcut.trim() };
      const url = reply ? `/api/quick-replies/${reply.id}` : '/api/quick-replies';
      const method = reply ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error saving quick reply');
      }
      
      showToast(reply ? 'Quick reply updated' : 'Quick reply created', 'success');
      onSave();
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-sm transition-all" onClick={handleBackdropClick}>
      <div className="h-full w-full max-w-[480px] bg-background shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-[18px] font-semibold">{reply ? 'Edit Quick Reply' : 'Create Quick Reply'}</h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div>
            <label className="text-[13px] font-semibold text-foreground">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Internal name (e.g., Pricing Info)"
              className="mt-2 h-10 w-full rounded-[8px] border border-border bg-card px-3 text-[13px] outline-none focus:border-primary"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">Internal name — not sent to the customer</p>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-foreground">Shortcut (Optional)</label>
            <div className="mt-2 flex items-center rounded-[8px] border border-border bg-card px-3 h-10 focus-within:border-primary">
              <span className="text-muted-foreground mr-1">/</span>
              <input
                value={shortcut}
                onChange={e => setShortcut(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="pricing"
                className="w-full bg-transparent text-[13px] outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Type this in chat to insert quickly. Must be unique.</p>
          </div>

          <div className="relative">
            <label className="text-[13px] font-semibold text-foreground flex justify-between">
              Message
              <span className="text-[11px] font-normal text-muted-foreground">{message.length}/4096</span>
            </label>
            
            {selectionRange && (
              <div className="absolute right-2 top-8 z-10 flex gap-1 rounded-md border border-border bg-background p-1 shadow-md">
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormatting('*', '*'); }} className="p-1 rounded hover:bg-muted text-foreground" title="Bold"><Bold className="h-3 w-3" /></button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormatting('_', '_'); }} className="p-1 rounded hover:bg-muted text-foreground" title="Italic"><Italic className="h-3 w-3" /></button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormatting('~', '~'); }} className="p-1 rounded hover:bg-muted text-foreground" title="Strikethrough"><Strikethrough className="h-3 w-3" /></button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormatting('```', '```'); }} className="p-1 rounded hover:bg-muted text-foreground" title="Monospace"><Code className="h-3 w-3" /></button>
              </div>
            )}
            
            <textarea
              ref={textareaRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyUp={handleSelect}
              onMouseUp={handleSelect}
              placeholder="Type your pre-written response..."
              className="mt-2 h-32 w-full resize-none rounded-[8px] border border-border bg-card p-3 text-[13px] outline-none focus:border-primary"
              maxLength={4096}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Format using *bold*, _italic_, ~strikethrough~, or ```monospace```
            </p>
          </div>

          <div className="pt-2 border-t border-border">
            <label className="text-[13px] font-semibold text-foreground mb-4 block">Live Preview</label>
            <div className="flex justify-center scale-90 origin-top">
              <PhoneMockup body={message || 'Your message will appear here'} />
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 flex justify-end gap-3 bg-card mt-auto">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={save}
            disabled={!title.trim() || !message.trim() || saving}
            className="bg-[#1B2CC1] text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : (reply ? 'Save Changes' : 'Create')}
          </Button>
        </div>
      </div>
    </div>
  );
}
