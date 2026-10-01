"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X, Tag, Plus } from "lucide-react";

type TagType = {
  id: string;
  name: string;
};

function AddTagNode({ data, selected }: NodeProps) {
  const config = (data.config as Record<string, any>) || {};
  const onConfigChange = data.onConfigChange as ((config: Record<string, any>) => void) | undefined;
  const onDelete = data.onDelete as (() => void) | undefined;

  const tagId: string = config.tag_id || "";

  const [tags, setTags] = useState<TagType[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  useEffect(() => {
    // In a real app this would call GET /api/tags
    setTags([
      { id: "t1", name: "VIP" },
      { id: "t2", name: "New Lead" },
    ]);
  }, []);

  const updateConfig = useCallback((updates: Record<string, any>) => {
    if (onConfigChange) onConfigChange({ ...config, ...updates });
  }, [config, onConfigChange]);

  const handleCreateTag = () => {
    if (!tagSearch.trim()) return;
    const newId = `tag_${Date.now()}`;
    const newTag = { id: newId, name: tagSearch.trim() };
    setTags([...tags, newTag]);
    updateConfig({ tag_id: newId });
    setTagSearch("");
    setShowTagDropdown(false);
  };

  const selectedTag = tags.find(t => t.id === tagId);
  const filteredTags = tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()));

  return (
    <div className={`rounded-lg border-2 bg-card shadow-lg w-[320px] transition-shadow ${
      selected ? "ring-2 ring-primary shadow-xl" : ""
    } border-rose-500/40`}>
      <Handle type="target" position={Position.Left} id="target" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600 shrink-0" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.1 1.516 5.828L0 24l6.335-1.652A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.97 0-3.834-.545-5.438-1.485l-.39-.232-3.766.988.998-3.648-.254-.404A9.724 9.724 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
          </svg>
          <span className="text-[13px] font-bold text-foreground">Add Tag</span>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete} className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Which Tag */}
      <div className="px-4 pt-3 pb-3 relative">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <label className="text-[11px] font-semibold text-foreground">Which Tag?</label>
        </div>
        <div 
          className="w-full h-8 rounded-lg border border-border bg-background px-2.5 flex items-center justify-between cursor-pointer"
          onClick={() => setShowTagDropdown(!showTagDropdown)}
        >
          <span className={`text-[12px] ${selectedTag ? 'text-foreground' : 'text-muted-foreground'}`}>
            {selectedTag ? selectedTag.name : "Search or add a tag"}
          </span>
        </div>

        {showTagDropdown && (
          <div className="absolute top-14 left-4 right-4 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden flex flex-col">
            <input 
              type="text" 
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Search or add a tag" 
              autoFocus
              className="w-full h-8 border-b border-border bg-transparent px-3 text-[12px] text-foreground focus:outline-none"
            />
            <div className="max-h-32 overflow-y-auto">
              {filteredTags.map(t => (
                <div 
                  key={t.id} 
                  className="px-3 py-1.5 text-[11px] hover:bg-muted cursor-pointer text-foreground"
                  onClick={() => {
                    updateConfig({ tag_id: t.id });
                    setShowTagDropdown(false);
                    setTagSearch("");
                  }}
                >
                  {t.name}
                </div>
              ))}
              {tagSearch && !filteredTags.find(t => t.name.toLowerCase() === tagSearch.toLowerCase()) && (
                <div 
                  className="px-3 py-1.5 text-[11px] text-primary hover:bg-primary/10 cursor-pointer flex items-center gap-1.5 border-t border-border"
                  onClick={handleCreateTag}
                >
                  <Plus className="h-3 w-3" /> Create "{tagSearch}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Next Step handle */}
      <div className="px-4 pb-3 flex items-center justify-end relative">
        <span className="text-[10px] font-medium text-muted-foreground mr-2">Next Step</span>
        <Handle type="source" position={Position.Right} id="next_step" className="!w-3 !h-3 !bg-primary !border-2 !border-background" style={{ top: "auto", position: "absolute", right: "-6px" }} />
      </div>
    </div>
  );
}

export default memo(AddTagNode);
