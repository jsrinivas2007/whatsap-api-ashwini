import React from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import { X } from "lucide-react";

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <foreignObject
        width={20}
        height={20}
        x={labelX - 10}
        y={labelY - 10}
        className="overflow-visible z-50 pointer-events-auto"
      >
        <button
          className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground transition nodrag nopan"
          onClick={(event) => {
            event.stopPropagation();
            // We use a custom event because React Flow's native edge click is overridden when foreignObject is used
            // but for simplicity we can just dispatch a window event that the parent listens to.
            window.dispatchEvent(new CustomEvent('deleteEdge', { detail: id }));
          }}
        >
          <X className="h-3 w-3" />
        </button>
      </foreignObject>
    </>
  );
}
