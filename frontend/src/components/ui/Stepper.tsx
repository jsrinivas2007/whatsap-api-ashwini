import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export type StepItem = {
  id: string;
  title: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  content: React.ReactNode;
  defaultExpanded?: boolean;
  disabled?: boolean;
};

export default function Stepper({ steps }: { steps: StepItem[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    steps.forEach((s) => (initial[s.id] = s.defaultExpanded ?? true));
    return initial;
  });

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isOpen = expanded[step.id] && !step.disabled;

        return (
          <div key={step.id} className={`relative flex gap-4 ${step.disabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            {/* Left line & icon indicator */}
            <div className="flex flex-col items-center">
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-background bg-primary/10 text-primary">
                {step.icon ? (
                  step.icon
                ) : (
                  <span className="text-[12px] font-bold">{index + 1}</span>
                )}
              </div>
              {!isLast && (
                <div className="w-[2px] flex-1 bg-border mt-2 mb-2" />
              )}
            </div>

            {/* Right content */}
            <div className={`flex-1 pb-8 ${isLast ? "pb-2" : ""}`}>
              <button
                type="button"
                onClick={() => toggle(step.id)}
                className="flex w-full items-center justify-between py-1 text-left"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-[16px] font-semibold text-foreground">
                    {step.title}
                  </h3>
                  {step.badge}
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="mt-3 text-[13px] text-foreground">
                  {step.content}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
