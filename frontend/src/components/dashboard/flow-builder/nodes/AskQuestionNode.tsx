"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X, MessageCircle, ArrowRight, Save, AlertTriangle, Plus } from "lucide-react";

type Attribute = {
  id: string;
  name: string;
};

const REPLY_TYPES = [
  "Text", "Name", "Number", "Email", "Phone", "URL", "Date", "Date & Time"
];

function AskQuestionNode({ data, selected }: NodeProps) {
  const config = (data.config as Record<string, any>) || {};
  const onConfigChange = data.onConfigChange as ((config: Record<string, any>) => void) | undefined;
  const onDelete = data.onDelete as (() => void) | undefined;
  const messageIndex = (data.messageIndex as number) || 1;

  const question: string = config.question || "";
  const expectedReplyType: string = config.expected_reply_type || "Text";
  const saveToAttributeId: string = config.save_to_attribute_id || "";
  const retryMessage: string = config.retry_message || "";

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeSearch, setAttributeSearch] = useState("");
  const [showAttributeDropdown, setShowAttributeDropdown] = useState(false);

  useEffect(() => {
    // In a real app this would call GET /api/attribute-definitions
    setAttributes([
      { id: "1", name: "First Name" },
      { id: "2", name: "Email Address" },
      { id: "3", name: "Phone Number" },
    ]);
  }, []);

  const updateConfig = useCallback((updates: Record<string, any>) => {
    if (onConfigChange) onConfigChange({ ...config, ...updates });
  }, [config, onConfigChange]);

  const handleCreateAttribute = () => {
    if (!attributeSearch.trim()) return;
    const newId = `attr_${Date.now()}`;
    const newAttr = { id: newId, name: attributeSearch.trim() };
    setAttributes([...attributes, newAttr]);
    updateConfig({ save_to_attribute_id: newId });
    setAttributeSearch("");
    setShowAttributeDropdown(false);
  };

  const selectedAttribute = attributes.find(a => a.id === saveToAttributeId);
  const filteredAttributes = attributes.filter(a => a.name.toLowerCase().includes(attributeSearch.toLowerCase()));

  return (
    <div className={`rounded-lg border-2 bg-card shadow-lg w-[340px] transition-shadow ${
      selected ? "ring-2 ring-primary shadow-xl" : ""
    } border-amber-500/40`}>
      <Handle type="target" position={Position.Left} id="target" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600 shrink-0" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.1 1.516 5.828L0 24l6.335-1.652A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.97 0-3.834-.545-5.438-1.485l-.39-.232-3.766.988.998-3.648-.254-.404A9.724 9.724 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
          </svg>
          <span className="text-[13px] font-bold text-foreground">Ask a Question</span>
          <span className="rounded-full bg-amber-500/10 text-amber-600 px-2 py-0.5 text-[10px] font-semibold">
            Message {messageIndex}
          </span>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete} className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Question field */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
          <label className="text-[11px] font-semibold text-foreground">Question</label>
        </div>
        <textarea
          value={question}
          onChange={(e) => {
            if (e.target.value.length <= 1024) updateConfig({ question: e.target.value });
          }}
          placeholder="What would you like to ask the contact? (up to 1024 characters)"
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition resize-none"
        />
        <p className="text-[10px] text-muted-foreground text-right mt-0.5">{question.length}/1024</p>
      </div>

      {/* Expected Reply Type */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <label className="text-[11px] font-semibold text-foreground">Expected Reply Type</label>
        </div>
        <select
          value={expectedReplyType}
          onChange={(e) => updateConfig({ expected_reply_type: e.target.value })}
          className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
        >
          {REPLY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Save Response To Attribute */}
      <div className="px-4 pb-2 relative">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Save className="h-3.5 w-3.5 text-muted-foreground" />
          <label className="text-[11px] font-semibold text-foreground">Save Response To Attribute</label>
        </div>
        <div 
          className="w-full h-8 rounded-lg border border-border bg-background px-2.5 flex items-center justify-between cursor-pointer"
          onClick={() => setShowAttributeDropdown(!showAttributeDropdown)}
        >
          <span className={`text-[12px] ${selectedAttribute ? 'text-foreground' : 'text-muted-foreground'}`}>
            {selectedAttribute ? selectedAttribute.name : "Search or create a new attribute"}
          </span>
        </div>

        {showAttributeDropdown && (
          <div className="absolute top-14 left-4 right-4 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden flex flex-col">
            <input 
              type="text" 
              value={attributeSearch}
              onChange={(e) => setAttributeSearch(e.target.value)}
              placeholder="Type to search or create..." 
              autoFocus
              className="w-full h-8 border-b border-border bg-transparent px-3 text-[12px] text-foreground focus:outline-none"
            />
            <div className="max-h-32 overflow-y-auto">
              {filteredAttributes.map(attr => (
                <div 
                  key={attr.id} 
                  className="px-3 py-1.5 text-[11px] hover:bg-muted cursor-pointer text-foreground"
                  onClick={() => {
                    updateConfig({ save_to_attribute_id: attr.id });
                    setShowAttributeDropdown(false);
                    setAttributeSearch("");
                  }}
                >
                  {attr.name}
                </div>
              ))}
              {attributeSearch && !filteredAttributes.find(a => a.name.toLowerCase() === attributeSearch.toLowerCase()) && (
                <div 
                  className="px-3 py-1.5 text-[11px] text-primary hover:bg-primary/10 cursor-pointer flex items-center gap-1.5 border-t border-border"
                  onClick={handleCreateAttribute}
                >
                  <Plus className="h-3 w-3" /> Create "{attributeSearch}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Follow-up on Invalid Reply */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
          <label className="text-[11px] font-semibold text-foreground">Follow-up on Invalid Reply</label>
        </div>
        <textarea
          value={retryMessage}
          onChange={(e) => {
            if (e.target.value.length <= 1024) updateConfig({ retry_message: e.target.value });
          }}
          placeholder="What should we send if the reply doesn't match the expected type? (up to 1024 characters)"
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition resize-none"
        />
        <p className="text-[10px] text-muted-foreground text-right mt-0.5">{retryMessage.length}/1024</p>
      </div>

      {/* Next Step handle */}
      <div className="px-4 pb-3 flex items-center justify-end relative">
        <span className="text-[10px] font-medium text-muted-foreground mr-2">Next Step</span>
        <Handle type="source" position={Position.Right} id="next_step" className="!w-3 !h-3 !bg-primary !border-2 !border-background" style={{ top: "auto", position: "absolute", right: "-6px" }} />
      </div>
    </div>
  );
}

export default memo(AskQuestionNode);
