import React, { useState, useEffect } from 'react';
import { Tag, Layers, Plus, Pencil, Trash2, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionLoader } from '@/components/ui/Loader';

interface TagData {
  id: string;
  name: string;
  color: string;
  contact_count: number;
}

interface AttributeData {
  id: string;
  key_name: string;
}

export function TagsTab({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'attributes' | 'tags'>('attributes');
  const [tags, setTags] = useState<TagData[]>([]);
  const [attributes, setAttributes] = useState<AttributeData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [editingAttr, setEditingAttr] = useState<AttributeData | null>(null);

  // Forms
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3b82f6');
  const [attrKey, setAttrKey] = useState('');
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resTags, resAttrs] = await Promise.all([
        fetch('/api/tags'),
        fetch('/api/attribute-definitions')
      ]);
      if (resTags.ok) setTags(await resTags.json());
      if (resAttrs.ok) setAttributes(await resAttrs.json());
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveTag = async () => {
    if (!tagName.trim()) return;
    try {
      const payload = { name: tagName.trim(), color: tagColor };
      const url = editingTag ? `/api/tags/${editingTag.id}` : '/api/tags';
      const method = editingTag ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchData();
      setShowTagModal(false);
      showToast(editingTag ? 'Tag updated' : 'Tag created', 'success');
    } catch (e: any) {
      showToast('Error saving tag', 'error');
    }
  };

  const handleDeleteTag = async (tag: TagData) => {
    if (!window.confirm(`Delete tag "${tag.name}"? It is currently used by ${tag.contact_count} contacts.`)) return;
    try {
      const res = await fetch(`/api/tags/${tag.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      await fetchData();
      showToast('Tag deleted', 'success');
    } catch (e: any) {
      showToast('Error deleting tag', 'error');
    }
  };

  const handleSaveAttr = async () => {
    if (!attrKey.trim() || !/^[a-zA-Z0-9_]+$/.test(attrKey)) {
      showToast('Key must be alphanumeric and underscores only', 'error');
      return;
    }
    try {
      const payload = { key_name: attrKey.trim() };
      const url = editingAttr ? `/api/attribute-definitions/${editingAttr.id}` : '/api/attribute-definitions';
      const method = editingAttr ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchData();
      setShowAttrModal(false);
      showToast(editingAttr ? 'Attribute updated' : 'Attribute created', 'success');
    } catch (e: any) {
      showToast('Error saving attribute', 'error');
    }
  };

  const handleDeleteAttr = async (attr: AttributeData) => {
    if (!window.confirm(`Delete attribute "${attr.key_name}"? This will remove its value from every contact that has it.`)) return;
    try {
      const res = await fetch(`/api/attribute-definitions/${attr.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      await fetchData();
      showToast('Attribute deleted', 'success');
    } catch (e: any) {
      showToast('Error deleting attribute', 'error');
    }
  };

  if (loading) return <SectionLoader text="Loading tags & attributes..." />;

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSubTab('attributes')}
            className={`whitespace-nowrap flex items-center gap-2 border-b-2 py-4 px-1 text-[14px] font-medium transition-colors ${
              activeSubTab === 'attributes'
                ? 'border-[#1B2CC1] text-[#1B2CC1]'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            <Layers className="h-4 w-4" />
            Attributes
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {attributes.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('tags')}
            className={`whitespace-nowrap flex items-center gap-2 border-b-2 py-4 px-1 text-[14px] font-medium transition-colors ${
              activeSubTab === 'tags'
                ? 'border-[#1B2CC1] text-[#1B2CC1]'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            <Tag className="h-4 w-4" />
            Tags
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {tags.length}
            </span>
          </button>
        </nav>
      </div>

      {activeSubTab === 'attributes' && (
        <div className="flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold">Attributes</h2>
              <p className="text-[13px] text-muted-foreground">Custom key fields to store additional information about your contacts</p>
            </div>
            <Button
              onClick={() => {
                setEditingAttr(null);
                setAttrKey('');
                setShowAttrModal(true);
              }}
              variant="primary"
              className="bg-[#1B2CC1] hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Attribute
            </Button>
          </div>

          {attributes.length > 0 ? (
            <div className="rounded-[8px] border border-border overflow-hidden bg-card">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Key Name</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attributes.map(attr => (
                    <tr key={attr.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium">{attr.key_name}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditingAttr(attr);
                            setAttrKey(attr.key_name);
                            setShowAttrModal(true);
                          }}
                          className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAttr(attr)}
                          className="ml-2 p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-500 rounded"
                        >
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
              <Layers className="mb-4 h-10 w-10 text-muted-foreground/30" />
              <h3 className="text-[15px] font-semibold">No attributes yet</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">Add custom fields to store extra information about your contacts.</p>
              <Button onClick={() => { setEditingAttr(null); setAttrKey(''); setShowAttrModal(true); }} variant="outline" className="mt-4">
                + Add Attribute
              </Button>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'tags' && (
        <div className="flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold">Tags</h2>
              <p className="text-[13px] text-muted-foreground">Labels to organize and segment your contacts</p>
            </div>
            <Button
              onClick={() => {
                setEditingTag(null);
                setTagName('');
                setTagColor('#3b82f6');
                setShowTagModal(true);
              }}
              variant="primary"
              className="bg-[#1B2CC1] hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Tag
            </Button>
          </div>

          {tags.length > 0 ? (
            <div className="rounded-[8px] border border-border overflow-hidden bg-card">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Contacts</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tags.map(tag => (
                    <tr key={tag.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <span 
                          className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium"
                          style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {tag.contact_count} contacts
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditingTag(tag);
                            setTagName(tag.name);
                            setTagColor(tag.color || '#3b82f6');
                            setShowTagModal(true);
                          }}
                          className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag)}
                          className="ml-2 p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-500 rounded"
                        >
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
              <Tag className="mb-4 h-10 w-10 text-muted-foreground/30" />
              <h3 className="text-[15px] font-semibold">No tags yet</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">Create labels to organize and segment your contacts.</p>
              <Button onClick={() => { setEditingTag(null); setTagName(''); setTagColor('#3b82f6'); setShowTagModal(true); }} variant="outline" className="mt-4">
                + Add Tag
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showAttrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-[400px] rounded-[8px] bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold">{editingAttr ? 'Edit Attribute' : 'Add Attribute'}</h3>
              <button onClick={() => setShowAttrModal(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="mb-6">
              <label className="mb-2 block text-[13px] font-medium">Key Name</label>
              <input
                value={attrKey}
                onChange={e => setAttrKey(e.target.value)}
                placeholder="e.g. region_name"
                className="w-full rounded-[6px] border border-border bg-card px-3 py-2 text-[13px] outline-none focus:border-[#1B2CC1]"
              />
              <p className="mt-2 text-[11px] text-muted-foreground">Alphanumeric and underscores only.</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAttrModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveAttr} className="bg-[#1B2CC1] text-white">Save</Button>
            </div>
          </div>
        </div>
      )}

      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-[400px] rounded-[8px] bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold">{editingTag ? 'Edit Tag' : 'Add Tag'}</h3>
              <button onClick={() => setShowTagModal(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-[13px] font-medium">Tag Name</label>
              <input
                value={tagName}
                onChange={e => setTagName(e.target.value)}
                placeholder="e.g. Hot Lead"
                className="w-full rounded-[6px] border border-border bg-card px-3 py-2 text-[13px] outline-none focus:border-[#1B2CC1]"
              />
            </div>
            <div className="mb-6">
              <label className="mb-2 block text-[13px] font-medium">Color</label>
              <div className="flex gap-2">
                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'].map(c => (
                  <button
                    key={c}
                    onClick={() => setTagColor(c)}
                    className={`h-6 w-6 rounded-full border-2 ${tagColor === c ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowTagModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveTag} className="bg-[#1B2CC1] text-white">Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
