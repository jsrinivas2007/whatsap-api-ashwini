"use client";

import { memo, useCallback, useState, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X, Plus, GripVertical, Image as ImageIcon, MessageCircle, Link2, UploadCloud } from "lucide-react";

function MediaNode({ data, selected }: NodeProps) {
  const config = (data.config as Record<string, any>) || {};
  const onConfigChange = data.onConfigChange as ((config: Record<string, any>) => void) | undefined;
  const onDelete = data.onDelete as (() => void) | undefined;
  const messageIndex = (data.messageIndex as number) || 1;

  const caption: string = config.caption || "";
  const buttonMode: string = config.button_mode || "reply_buttons";
  const buttons: { id: string; text: string }[] = config.buttons || [];
  const mediaUrl: string = config.media_url || "";
  const mediaFilename: string = config.media_filename || "Media Attached";

  const [uploading, setUploading] = useState(false);

  const updateConfig = useCallback((updates: Record<string, any>) => {
    if (onConfigChange) onConfigChange({ ...config, ...updates });
  }, [config, onConfigChange]);

  const genId = () => Math.random().toString(36).slice(2, 10);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // In a real app, upload to cloud storage and get URL
    setTimeout(() => {
      const url = URL.createObjectURL(file);
      const type = file.type.split('/')[0] || "document";
      updateConfig({ media_url: url, media_type: type, media_filename: file.name });
      setUploading(false);
    }, 1000);
  };

  return (
    <div className={`rounded-xl border-2 bg-card shadow-lg w-[340px] transition-shadow ${
      selected ? "ring-2 ring-primary shadow-xl" : ""
    } border-purple-500/40`}>
      <Handle type="target" position={Position.Left} id="target" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600 shrink-0" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.1 1.516 5.828L0 24l6.335-1.652A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.97 0-3.834-.545-5.438-1.485l-.39-.232-3.766.988.998-3.648-.254-.404A9.724 9.724 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
          </svg>
          <span className="text-[13px] font-bold text-foreground">Media</span>
          <span className="rounded-full bg-purple-500/10 text-purple-600 px-2 py-0.5 text-[10px] font-semibold">
            Message {messageIndex}
          </span>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete} className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Upload Dropzone */}
      <div className="px-4 pt-3 pb-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
          accept="image/*,video/*,.pdf,.doc,.docx"
        />
        <div 
          className="w-full rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center p-4 bg-muted/20 hover:bg-muted/40 transition cursor-pointer" 
          onClick={() => { if (!uploading && !mediaUrl) fileInputRef.current?.click(); }}
        >
          {mediaUrl ? (
            <div className="text-center w-full relative group">
              <ImageIcon className="h-6 w-6 text-primary mx-auto mb-1" />
              <span className="text-[11px] font-medium text-foreground block truncate px-2">{mediaFilename}</span>
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); updateConfig({ media_url: "", media_filename: "" }); }}
                className="absolute top-0 right-0 h-6 w-6 rounded-full bg-card shadow flex items-center justify-center text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <>
              <button type="button" disabled={uploading} className="bg-primary text-primary-foreground font-medium text-[12px] px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition disabled:opacity-50">
                <UploadCloud className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload Media"}
              </button>
              <p className="text-[10px] text-muted-foreground mt-2">Images, Video, or Document</p>
            </>
          )}
        </div>
      </div>

      {/* Caption textarea */}
      <div className="px-4 pb-2">
        <textarea
          value={caption}
          onChange={(e) => {
            if (e.target.value.length <= 1024) updateConfig({ caption: e.target.value });
          }}
          placeholder="Enter your message... (max 1024 chars)"
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition resize-none"
        />
        <p className="text-[10px] text-muted-foreground text-right mt-0.5">{caption.length}/1024 characters</p>
      </div>

      {/* Button type toggle */}
      <div className="px-4 pb-2">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button type="button" onClick={() => updateConfig({ button_mode: "reply_buttons" })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium transition ${buttonMode === "reply_buttons" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}>
            <MessageCircle className="h-3 w-3" /> Reply Buttons
          </button>
          <button type="button" onClick={() => updateConfig({ button_mode: "url_button" })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium transition ${buttonMode === "url_button" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}>
            <Link2 className="h-3 w-3" /> URL Button
          </button>
        </div>
      </div>

      {/* Button rows */}
      {buttonMode === "reply_buttons" && (
        <div className="px-4 pb-3 space-y-2">
          {buttons.map((btn, i) => (
            <div key={btn.id} className="flex items-center gap-1.5 relative group">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 cursor-grab" />
              <input type="text" value={btn.text} onChange={(e) => { if (e.target.value.length <= 20) { const next = [...buttons]; next[i] = { ...next[i], text: e.target.value }; updateConfig({ buttons: next }); } }}
                placeholder={`Button ${i + 1}`} className="flex-1 h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition" />
              <span className="text-[9px] text-muted-foreground w-8 text-right shrink-0">{btn.text.length}/20</span>
              <button type="button" onClick={() => updateConfig({ buttons: buttons.filter((_, idx) => idx !== i) })} className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition">
                <X className="h-3 w-3" />
              </button>
              <Handle type="source" position={Position.Right} id={`btn-${btn.id}`} className="!w-3 !h-3 !bg-blue-500 !border-2 !border-background" style={{ top: "auto", position: "absolute", right: "-24px" }} />
            </div>
          ))}
          {buttons.length < 3 && (
            <button type="button" onClick={() => updateConfig({ buttons: [...buttons, { id: genId(), text: "" }] })} className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition">
              <Plus className="h-3 w-3" /> Add Button {buttons.length + 1}/3
            </button>
          )}
        </div>
      )}

      {/* URL button mode */}
      {buttonMode === "url_button" && (
        <div className="px-4 pb-3 space-y-2">
          <input type="text" value={config.url_button_text || ""} onChange={(e) => { if (e.target.value.length <= 20) updateConfig({ url_button_text: e.target.value }); }} placeholder="Button label (max 20)" className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition" />
          <input type="url" value={config.url_button_url || ""} onChange={(e) => updateConfig({ url_button_url: e.target.value })} placeholder="https://example.com" className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition" />
        </div>
      )}

      {/* Next Step handle */}
      <div className="px-4 pb-3 flex items-center justify-end relative">
        <span className="text-[10px] font-medium text-muted-foreground mr-2">Next Step</span>
        <Handle type="source" position={Position.Right} id="next_step" className="!w-3 !h-3 !bg-primary !border-2 !border-background" style={{ top: "auto", position: "absolute", right: "-6px" }} />
      </div>
    </div>
  );
}

export default memo(MediaNode);
