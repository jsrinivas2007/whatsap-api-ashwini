"use client";

import { Bot } from "lucide-react";

export default function AIAgentPage() {
  return (
    <div className="flex h-[calc(100vh-100px)] w-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bot className="h-12 w-12" />
      </div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground">WhatsApp AI Agent</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        We are building something amazing. The WhatsApp AI Agent feature is coming soon!
      </p>
      <div className="mt-8 rounded-full bg-secondary px-6 py-2 text-sm font-medium text-secondary-foreground shadow-sm border border-border">
        Coming Soon
      </div>
    </div>
  );
}
