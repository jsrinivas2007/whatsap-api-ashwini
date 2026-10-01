"use client";

import React, { useEffect, useState } from 'react';
import './loader.css';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loader({ size = 'md', className = '' }: LoaderProps) {
  // Map sizes to expected layout footprint since CSS transform scale keeps original layout size
  const dimensions = {
    sm: 'w-[32px] h-[20px]',
    md: 'w-[64px] h-[40px]',
    lg: 'w-[96px] h-[60px]',
  };
  
  return (
    <div className={`${dimensions[size]} flex items-center justify-center overflow-visible ${className}`}>
      <div className={`loader-container size-${size}`}>
        <div className="loader-mark"></div>
        <div className="loader-mark"></div>
        <div className="loader-mark"></div>
      </div>
    </div>
  );
}

// Custom hook to delay showing loaders to prevent flicker on fast loads
export function useDelayShow(delayMs: number = 250) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);
  return show;
}

export function PageLoader() {
  const show = useDelayShow(250);
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader size="lg" />
    </div>
  );
}

export function SectionLoader({ text }: { text?: string }) {
  const show = useDelayShow(250);
  if (!show) return null;
  
  return (
    <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center p-8 text-muted-foreground">
      <Loader size="md" className="mb-4" />
      {text && <span className="text-sm font-medium text-muted-foreground">{text}</span>}
    </div>
  );
}

export function OverlayLoader({ text }: { text?: string }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-[inherit]">
      <div className="flex flex-col items-center">
        <Loader size="md" />
        {text && <span className="mt-4 text-sm font-medium text-foreground bg-background/80 px-3 py-1 rounded-full shadow-sm">{text}</span>}
      </div>
    </div>
  );
}

export function ButtonLoader({ className = '' }: { className?: string }) {
  // Buttons usually need immediate feedback
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Loader size="sm" />
    </div>
  );
}
