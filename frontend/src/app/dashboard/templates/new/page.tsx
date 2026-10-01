"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Info, Plus, GripVertical, X, Type, Image as ImageIcon, Video, FileText, Reply, ExternalLink, Phone, FormInput, Bold, Italic, Strikethrough, Code, Sparkles } from "lucide-react";
import PhoneMockup from "@/components/dashboard/PhoneMockup";
import Link from "next/link";
import { OverlayLoader, ButtonLoader } from "@/components/ui/Loader";
import { WhatsAppFormSidePanel } from "@/app/dashboard/settings/components/WhatsAppFormsTab";
import AIGenerateModal from "./AIGenerateModal";

type ButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'FLOW';
type HeaderType = 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';

interface TemplateVariable {
  position: number;
  sample_value: string;
}

interface TemplateButton {
  id: string; // for React key
  type: ButtonType;
  button_text: string;
  phone_number?: string;
  website_url?: string;
  form_id?: string;
}

export default function NewTemplatePage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [category, setCategory] = useState("MARKETING");
  const [headerType, setHeaderType] = useState<HeaderType>("NONE");
  const [headerContent, setHeaderContent] = useState("");
  const [headerFileName, setHeaderFileName] = useState("");
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [buttons, setButtons] = useState<TemplateButton[]>([]);
  
  const [showButtonPopover, setShowButtonPopover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [publishedFlows, setPublishedFlows] = useState<{id: string, name: string}[]>([]);
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [playgroundUrl, setPlaygroundUrl] = useState('https://business.facebook.com/wa/manage/flows/');
  const [showAiGenModal, setShowAiGenModal] = useState(false);
  const [aiGenType, setAiGenType] = useState<'text' | 'image'>('text');

  useEffect(() => {
    const fetchFlows = async () => {
      try {
        const [flowsRes, urlRes] = await Promise.all([
          fetch('/api/whatsapp-flows/published'),
          fetch('/api/whatsapp-flows/playground-url')
        ]);
        if (flowsRes.ok) setPublishedFlows(await flowsRes.json());
        if (urlRes.ok) {
          const urlData = await urlRes.json();
          if (urlData.url) setPlaygroundUrl(urlData.url);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchFlows();
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Floating toolbar state
  const [selectionRange, setSelectionRange] = useState<{ start: number, end: number } | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number, left: number } | null>(null);

  const [focusedVar, setFocusedVar] = useState<number | null>(null);

  // Dynamic variable detection and renumbering
  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newBody = e.target.value;
    const selectionStart = e.target.selectionStart;
    
    // Find all {{n}} in order of appearance
    const matches = Array.from(newBody.matchAll(/\{\{(\d+)\}\}/g));
    const uniqueNums = Array.from(new Set(matches.map(m => parseInt(m[1], 10))));
    
    // Check if they form a perfect sequence 1..N
    const sortedNums = [...uniqueNums].sort((a,b)=>a-b);
    const isSequential = sortedNums.length === 0 || (sortedNums[0] === 1 && sortedNums[sortedNums.length-1] === sortedNums.length);
    
    if (isSequential) {
      setBody(newBody);
      setVariables(prev => {
        return sortedNums.map(num => {
          const existing = prev.find(v => v.position === num);
          return { position: num, sample_value: existing ? existing.sample_value : '' };
        });
      });
    } else {
      // Need to renumber to 1..N
      const mapping: Record<number, number> = {};
      uniqueNums.forEach((oldNum, idx) => {
        mapping[oldNum] = idx + 1;
      });
      
      newBody = newBody.replace(/\{\{(\d+)\}\}/g, (match, numStr) => {
        return `{{${mapping[parseInt(numStr, 10)]}}}`;
      });
      
      setBody(newBody);
      setVariables(prev => {
        return uniqueNums.map((oldNum, idx) => {
          const newNum = idx + 1;
          const existing = prev.find(v => v.position === oldNum);
          return { position: newNum, sample_value: existing ? existing.sample_value : '' };
        });
      });
      
      // Restore cursor
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(selectionStart, selectionStart);
        }
      }, 0);
    }
  };

  const handleAddVariable = () => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    const matches = Array.from(body.matchAll(/\{\{(\d+)\}\}/g));
    const maxNum = matches.length > 0 ? Math.max(...matches.map(m => parseInt(m[1], 10))) : 0;
    const nextVar = maxNum + 1;
    
    const insertText = `{{${nextVar}}}`;
    const newBody = body.substring(0, start) + insertText + body.substring(end);
    
    // Simulate event for handleBodyChange
    const fakeEvent = { target: { value: newBody, selectionStart: start + insertText.length } } as React.ChangeEvent<HTMLTextAreaElement>;
    handleBodyChange(fakeEvent);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + insertText.length, start + insertText.length);
      }
    }, 0);
  };

  const checkCursorForVariable = () => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    
    const matches = Array.from(body.matchAll(/\{\{(\d+)\}\}/g));
    for (const m of matches) {
      const start = m.index!;
      const end = start + m[0].length;
      if (cursorPos > start && cursorPos < end) { // Cursor is INSIDE the placeholder
        const num = parseInt(m[1], 10);
        setFocusedVar(num);
        const inputEl = document.getElementById(`var-input-${num}`);
        if (inputEl) {
          inputEl.focus();
        }
        return;
      }
    }
    setFocusedVar(null);
  };

  const handleTextareaEvent = (e: React.SyntheticEvent) => {
    checkCursorForVariable();
    handleSelect();
  };

  // Text selection tracking for toolbar
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
    const selectedText = body.substring(start, end);
    const newBody = body.substring(0, start) + prefix + selectedText + suffix + body.substring(end);
    setBody(newBody);
    setSelectionRange(null);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = end + prefix.length + suffix.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Replace variable placeholders with sample values for the preview
  const getPreviewBody = () => {
    let preview = body;
    variables.forEach(v => {
      const val = v.sample_value ? v.sample_value : `{{${v.position}}}`;
      preview = preview.replace(new RegExp(`\\{\\{${v.position}\\}\\}`, 'g'), val);
    });
    return preview;
  };

  const counts = {
    QUICK_REPLY: buttons.filter(b => b.type === 'QUICK_REPLY').length,
    URL: buttons.filter(b => b.type === 'URL').length,
    PHONE_NUMBER: buttons.filter(b => b.type === 'PHONE_NUMBER').length,
    FLOW: buttons.filter(b => b.type === 'FLOW').length,
  };

  const addButton = (type: ButtonType) => {
    const newBtn: TemplateButton = { id: Math.random().toString(), type, button_text: '' };
    setButtons([...buttons, newBtn]);
    setShowButtonPopover(false);
  };

  const removeButton = (id: string) => {
    setButtons(buttons.filter(b => b.id !== id));
  };

  const updateButton = (id: string, field: keyof TemplateButton, value: string) => {
    setButtons(buttons.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  // Simple drag logic
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    // Swap items
    const items = [...buttons];
    const draggedItem = items[draggedIdx];
    items.splice(draggedIdx, 1);
    items.splice(index, 0, draggedItem);
    
    setDraggedIdx(index);
    setButtons(items);
  };

  const onDragEnd = () => {
    setDraggedIdx(null);
  };

  const validateForm = () => {
    if (!name.trim() || !/^[a-z0-9_]+$/.test(name)) return false;
    if (!body.trim()) return false;
    if (variables.some(v => !v.sample_value.trim())) return false;
    if (buttons.some(b => !b.button_text.trim())) return false;
    if (buttons.some(b => b.type === 'PHONE_NUMBER' && !b.phone_number?.trim())) return false;
    if (buttons.some(b => b.type === 'URL' && !b.website_url?.trim())) return false;
    if (buttons.some(b => b.type === 'FLOW' && !b.form_id?.trim())) return false;
    return true;
  };

  const handleInputFocus = (num: number) => {
    setFocusedVar(num);
    const regex = new RegExp(`\\{\\{${num}\\}\\}`);
    const match = body.match(regex);
    if (match && match.index !== undefined && textareaRef.current) {
      const start = match.index;
      const end = start + match[0].length;
      // Temporarily highlight the text in textarea by selecting it
      textareaRef.current.setSelectionRange(start, end);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setToast(null);
    
    try {
      let finalHeaderContent = headerContent;
      let finalHeaderHandle = '';
      
      if (headerFile && (headerType === 'IMAGE' || headerType === 'VIDEO' || headerType === 'DOCUMENT')) {
        setToast('Uploading media...');
        const formData = new FormData();
        formData.append('file', headerFile);
        
        const upRes = await fetch('/api/templates/media/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!upRes.ok) {
          const upErr = await upRes.json().catch(() => ({}));
          throw new Error(upErr.message || 'Media upload failed');
        }
        
        const upData = await upRes.json();
        finalHeaderHandle = upData.handle;
        
        // Convert to base64 for our DB preview
        finalHeaderContent = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(headerFile);
        });
      }
      
      const payload = {
        name,
        language,
        category,
        header_type: headerType,
        header_content: finalHeaderContent,
        header_handle: finalHeaderHandle,
        body,
        footer,
        variables,
        buttons
      };

      setToast('Submitting template...');
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Submission failed');
      }
      
      setToast('Template submitted successfully');
      setTimeout(() => {
        router.push('/dashboard/templates');
      }, 1500);

    } catch (e: any) {
      setToast(`Error: ${e.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full text-foreground relative">
      {isSubmitting && <OverlayLoader text="Submitting template..." />}
      {toast && (
        <div className="fixed right-6 top-6 z-[80] rounded-[8px] bg-foreground px-4 py-3 text-[12px] font-medium text-background shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/templates" className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h2 className="text-[24px] font-bold tracking-[-0.03em]">Create Template</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/dashboard/templates')} className="rounded-[8px] border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground hover:bg-muted">
            Cancel
          </button>
          <button 
            disabled={!validateForm() || isSubmitting}
            onClick={handleSubmit} 
            className="inline-flex items-center gap-2 rounded-[8px] bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <><ButtonLoader className="text-primary-foreground" /> Submitting...</> : 'Submit for Review'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 pb-10">
        
        {/* Left Column - Form */}
        <div className="flex-1 space-y-8 max-w-3xl">
          
          {/* Basics */}
          <section className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-[16px] font-semibold text-foreground border-b border-border pb-3">Basic Information</h3>
            
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="block text-[13px] font-semibold text-foreground">
                Template Name
                <input 
                  value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="mt-2 h-10 w-full rounded-[8px] border border-border bg-background px-3 text-[13px] font-normal placeholder:text-muted-foreground focus:border-primary outline-none"
                  placeholder="e.g. welcome_message"
                  maxLength={512}
                />
                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>Lowercase, numbers and underscores only</span>
                  <span>{name.length}/512</span>
                </div>
              </label>

              <label className="block text-[13px] font-semibold text-foreground">
                Category <Info className="inline h-3 w-3 text-muted-foreground ml-1" />
                <select 
                  value={category} onChange={e => setCategory(e.target.value)}
                  className="mt-2 h-10 w-full rounded-[8px] border border-border bg-background px-3 text-[13px] font-normal outline-none focus:border-primary"
                >
                  <option value="MARKETING">Marketing (Promos, offers, updates)</option>
                  <option value="UTILITY">Utility (Confirmations, alerts)</option>
                  <option value="AUTHENTICATION">Authentication (OTPs)</option>
                </select>
              </label>
              
              <label className="block text-[13px] font-semibold text-foreground md:col-span-2">
                Language
                <select 
                  value={language} onChange={e => setLanguage(e.target.value)}
                  className="mt-2 h-10 w-full rounded-[8px] border border-border bg-background px-3 text-[13px] font-normal outline-none focus:border-primary"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </label>
            </div>
          </section>

          {/* Content */}
          <section className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-[16px] font-semibold text-foreground border-b border-border pb-3">Message Content</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <label className="block text-[13px] font-semibold text-foreground">
                Header <span className="font-normal text-muted-foreground">(Optional)</span>
                <select 
                  value={headerType} onChange={e => { setHeaderType(e.target.value as HeaderType); setHeaderContent(''); setHeaderFileName(''); setHeaderFile(null); }}
                  className="mt-2 h-10 w-full rounded-[8px] border border-border bg-background px-3 text-[13px] font-normal outline-none focus:border-primary"
                >
                  <option value="NONE">None</option>
                  <option value="TEXT">Text</option>
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video</option>
                  <option value="DOCUMENT">Document</option>
                </select>
              </label>

              {headerType === 'TEXT' && (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold text-foreground">Header Text</span>
                    <button type="button" onClick={() => { setAiGenType('text'); setShowAiGenModal(true); }} className="text-[12px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Generate</button>
                  </div>
                  <input 
                    value={headerContent} onChange={e => setHeaderContent(e.target.value)}
                    maxLength={60}
                    placeholder="Enter header text"
                    className="h-10 w-full rounded-[8px] border border-border bg-background px-3 text-[13px] font-normal placeholder:text-muted-foreground outline-none focus:border-primary"
                  />
                </div>
              )}

              {(headerType === 'IMAGE' || headerType === 'VIDEO' || headerType === 'DOCUMENT') && (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold text-foreground">Upload {headerType.charAt(0) + headerType.slice(1).toLowerCase()}</span>
                    <div className="flex items-center gap-3">
                      {headerType === 'IMAGE' && (
                        <button type="button" onClick={() => { setAiGenType('image'); setShowAiGenModal(true); }} className="text-[12px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Generate</button>
                      )}
                      <a href="#" className="text-[12px] font-medium text-primary hover:underline">View requirements</a>
                    </div>
                  </div>
                  <div className="flex h-10 items-center justify-between rounded-[8px] border border-border bg-background px-3">
                    <div className="flex items-center gap-2 text-muted-foreground overflow-hidden">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-[13px] truncate">{headerFileName ? headerFileName : 'Choose file'}</span>
                    </div>
                    <label className="shrink-0 rounded bg-primary/10 px-3 py-1 text-[12px] font-medium text-primary hover:bg-primary/20 transition cursor-pointer">
                      Browse
                      <input 
                        type="file" 
                        className="hidden" 
                        accept={headerType === 'IMAGE' ? 'image/*' : headerType === 'VIDEO' ? 'video/*' : '*/*'}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            setHeaderFile(file);
                            setHeaderFileName(file.name);
                            if (headerType === 'DOCUMENT') {
                              setHeaderContent(file.name); // document just shows name
                            } else {
                              setHeaderContent(URL.createObjectURL(file)); // image/video shows preview
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-[13px] font-semibold text-foreground">
                  Body Message
                </label>
                <button type="button" onClick={handleAddVariable} className="text-[12px] font-semibold text-primary hover:text-primary/80 bg-primary/10 px-2 py-1 rounded">
                  + Add Variable
                </button>
              </div>
              
              <div className="relative">
                <textarea 
                  ref={textareaRef}
                  value={body} 
                  onChange={handleBodyChange}
                  onSelect={handleTextareaEvent}
                  onClick={handleTextareaEvent}
                  onKeyUp={handleTextareaEvent}
                  maxLength={1024}
                  placeholder="Type your message here..."
                  className="min-h-[160px] w-full rounded-[8px] border border-border bg-background p-3 text-[14px] font-normal placeholder:text-muted-foreground outline-none focus:border-primary"
                />
                
                {/* Floating Formatting Toolbar */}
                {selectionRange && selectionRange.start !== selectionRange.end && (
                  <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 z-10 flex gap-1 rounded-[8px] border border-border bg-card p-1 shadow-md">
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormatting('*', '*'); }} className="p-1.5 rounded hover:bg-muted text-foreground" title="Bold"><Bold className="h-4 w-4" /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormatting('_', '_'); }} className="p-1.5 rounded hover:bg-muted text-foreground" title="Italic"><Italic className="h-4 w-4" /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormatting('~', '~'); }} className="p-1.5 rounded hover:bg-muted text-foreground" title="Strikethrough"><Strikethrough className="h-4 w-4" /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormatting('```', '```'); }} className="p-1.5 rounded hover:bg-muted text-foreground" title="Monospace"><Code className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
              
              <div className="mt-2 flex justify-end text-[11px] text-muted-foreground">
                <span>{body.length}/1024</span>
              </div>
            </div>

            {variables.length > 0 && (
              <div className="rounded-[8px] bg-muted/30 p-4 border border-border">
                <h4 className="text-[13px] font-semibold text-foreground mb-3">Sample Values</h4>
                <p className="text-[11px] text-muted-foreground mb-4">Required for WhatsApp to approve the template format.</p>
                <div className="space-y-3">
                  {variables.map(v => {
                    const isFocused = focusedVar === v.position;
                    const isEmpty = !v.sample_value.trim();
                    return (
                      <div key={v.position} className="flex flex-col gap-1">
                        <label className="flex items-center gap-3 text-[13px] font-medium text-foreground">
                          <span className={`w-10 text-center font-mono border rounded py-1 px-2 transition-colors ${isFocused ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border'}`}>{`{{${v.position}}}`}</span>
                          <input 
                            id={`var-input-${v.position}`}
                            value={v.sample_value}
                            onFocus={() => handleInputFocus(v.position)}
                            onBlur={() => setFocusedVar(null)}
                            onChange={(e) => setVariables(variables.map(item => item.position === v.position ? { ...item, sample_value: e.target.value } : item))}
                            placeholder={`Enter value for {{${v.position}}}`}
                            className={`h-9 flex-1 rounded-[6px] border bg-background px-3 text-[13px] font-normal outline-none transition-all ${isFocused ? 'border-primary ring-2 ring-primary/20' : 'border-border focus:border-primary'} ${isEmpty && !isFocused ? 'border-rose-300' : ''}`}
                          />
                        </label>
                        {isEmpty && (
                          <span className="text-[10px] text-rose-500 ml-[52px]">This value is required before submission.</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <label className="block text-[13px] font-semibold text-foreground">
              Footer <span className="font-normal text-muted-foreground">(Optional)</span>
              <input 
                value={footer} onChange={e => setFooter(e.target.value)}
                maxLength={60}
                placeholder="e.g. Reply STOP to opt out"
                className="mt-2 h-10 w-full rounded-[8px] border border-border bg-background px-3 text-[13px] font-normal placeholder:text-muted-foreground outline-none focus:border-primary"
              />
              <div className="mt-1 text-right text-[11px] text-muted-foreground">{footer.length}/60</div>
            </label>
          </section>

          {/* Buttons Config */}
          <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-[16px] font-semibold text-foreground">Buttons <span className="font-normal text-muted-foreground">(Optional)</span></h3>
                <p className="mt-1 text-[12px] text-muted-foreground">Drag button cards to change the order shown in the template.</p>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setShowButtonPopover(!showButtonPopover)}
                  className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-primary/10 px-3 text-[13px] font-semibold text-primary hover:bg-primary/20"
                >
                  <Plus className="h-4 w-4" /> Add Button
                </button>

                {showButtonPopover && (
                  <div className="absolute right-0 top-full mt-2 w-64 z-20 rounded-xl border border-border bg-card p-2 shadow-xl">
                    <div className="flex flex-col gap-1">
                      <button disabled={counts.QUICK_REPLY >= 4} onClick={() => addButton('QUICK_REPLY')} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted text-left disabled:opacity-40">
                        <Reply className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex flex-col"><span className="text-[13px] font-semibold text-foreground">Quick Reply</span><span className="text-[10px] text-muted-foreground">Max 4 buttons ({counts.QUICK_REPLY} added)</span></div>
                      </button>
                      <button disabled={counts.URL >= 2} onClick={() => addButton('URL')} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted text-left disabled:opacity-40">
                        <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex flex-col"><span className="text-[13px] font-semibold text-foreground">Visit Website</span><span className="text-[10px] text-muted-foreground">Max 2 buttons ({counts.URL} added)</span></div>
                      </button>
                      <button disabled={counts.PHONE_NUMBER >= 1} onClick={() => addButton('PHONE_NUMBER')} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted text-left disabled:opacity-40">
                        <Phone className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex flex-col"><span className="text-[13px] font-semibold text-foreground">Call Phone</span><span className="text-[10px] text-muted-foreground">Max 1 button {counts.PHONE_NUMBER >= 1 && <span className="font-bold text-rose-500">(Limit)</span>}</span></div>
                      </button>
                      <button disabled={counts.FLOW >= 1} onClick={() => addButton('FLOW')} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted text-left disabled:opacity-40">
                        <FormInput className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex flex-col"><span className="text-[13px] font-semibold text-foreground">Form Button</span><span className="text-[10px] text-muted-foreground">Max 1 button {counts.FLOW >= 1 && <span className="font-bold text-rose-500">(Limit)</span>}</span></div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {buttons.map((btn, index) => (
                <div 
                  key={btn.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDragEnd={onDragEnd}
                  className={`relative rounded-xl border border-border bg-background p-4 shadow-sm transition-all ${draggedIdx === index ? 'opacity-50 scale-[0.98]' : 'opacity-100'}`}
                >
                  <div className="absolute right-3 top-3 flex items-center gap-2">
                    <button type="button" onClick={() => removeButton(btn.id)} className="text-muted-foreground hover:text-rose-500"><X className="h-4 w-4" /></button>
                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"><GripVertical className="h-4 w-4" /></div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    {btn.type === 'QUICK_REPLY' && <Reply className="h-4 w-4 text-primary" />}
                    {btn.type === 'URL' && <ExternalLink className="h-4 w-4 text-primary" />}
                    {btn.type === 'PHONE_NUMBER' && <Phone className="h-4 w-4 text-primary" />}
                    {btn.type === 'FLOW' && <FormInput className="h-4 w-4 text-primary" />}
                    <span className="text-[13px] font-bold text-foreground">
                      {btn.type === 'FLOW' ? 'Form' : btn.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block text-[12px] font-semibold text-foreground">
                      Button Text
                      <input 
                        value={btn.button_text} onChange={e => updateButton(btn.id, 'button_text', e.target.value)}
                        maxLength={25} placeholder="e.g. Stop"
                        className="mt-1.5 h-9 w-full rounded-[6px] border border-border bg-card px-3 text-[13px] font-normal outline-none focus:border-primary"
                      />
                    </label>

                    {btn.type === 'URL' && (
                      <label className="block text-[12px] font-semibold text-foreground">
                        Website URL
                        <input 
                          value={btn.website_url || ''} onChange={e => updateButton(btn.id, 'website_url', e.target.value)}
                          placeholder="https://example.com"
                          className="mt-1.5 h-9 w-full rounded-[6px] border border-border bg-card px-3 text-[13px] font-normal outline-none focus:border-primary"
                        />
                      </label>
                    )}

                    {btn.type === 'PHONE_NUMBER' && (
                      <label className="block text-[12px] font-semibold text-foreground">
                        Phone Number
                        <input 
                          value={btn.phone_number || ''} onChange={e => updateButton(btn.id, 'phone_number', e.target.value)}
                          placeholder="+1234567890"
                          className="mt-1.5 h-9 w-full rounded-[6px] border border-border bg-card px-3 text-[13px] font-normal outline-none focus:border-primary"
                        />
                      </label>
                    )}

                    {btn.type === 'FLOW' && (
                      <div className="block">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] font-semibold text-foreground">Form ID</span>
                          <button type="button" onClick={() => setShowFormPanel(true)} className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1">
                            <Plus className="h-3 w-3" /> Create Form
                          </button>
                        </div>
                        <select 
                          value={btn.form_id || ''} 
                          onChange={e => updateButton(btn.id, 'form_id', e.target.value)}
                          className="h-9 w-full rounded-[6px] border border-border bg-card px-3 text-[13px] font-normal outline-none focus:border-primary"
                        >
                          <option value="">Select a Form</option>
                          {publishedFlows.map(flow => (
                            <option key={flow.id} value={flow.id}>{flow.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {buttons.length === 0 && (
                <div className="rounded-[8px] border border-dashed border-border p-6 text-center text-muted-foreground">
                  <p className="text-[13px]">No buttons added. Click "Add Button" to include interactive buttons.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column - Live Preview */}
        <div className="hidden lg:block lg:w-[350px]">
          <div className="sticky top-6 flex justify-center">
            <PhoneMockup 
              brandName="Ashwini Innovations"
              headerType={headerType}
              headerContent={headerContent}
              body={getPreviewBody()}
              footer={footer}
              buttons={buttons}
            />
          </div>
        </div>
      </div>
      
      {showFormPanel && (
        <WhatsAppFormSidePanel
          playgroundUrl={playgroundUrl}
          onClose={() => setShowFormPanel(false)}
          onSave={async () => {
            const res = await fetch('/api/whatsapp-flows/published');
            if (res.ok) setPublishedFlows(await res.json());
            setShowFormPanel(false);
          }}
          showToast={(msg) => {
            setToast(msg);
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}

      {showAiGenModal && (
        <AIGenerateModal 
          type={aiGenType} 
          onClose={() => setShowAiGenModal(false)}
          onUseResult={(res) => {
            if (aiGenType === 'text') {
              setHeaderContent(res);
            } else {
              setHeaderFileName('ai_generated_image.png');
              // Assuming you have logic in PhoneMockup to render a placeholder from string if it's a URL
              setHeaderContent(res); 
            }
          }}
        />
      )}
    </div>
  );
}
