import React from 'react';
import { 
  Wifi, 
  Battery, 
  Signal, 
  ChevronLeft, 
  Video, 
  Phone, 
  MoreVertical,
  Reply,
  ExternalLink,
  FormInput,
  CheckCheck,
  Image as ImageIcon
} from 'lucide-react';

interface TemplateButton {
  type: string;
  button_text: string;
}

interface PhoneMockupProps {
  brandName?: string;
  brandAvatar?: string;
  headerType?: string;
  headerContent?: string | null;
  body: string;
  footer?: string;
  buttons?: TemplateButton[];
}

export default function PhoneMockup({
  brandName = 'Your Brand',
  brandAvatar = 'YB',
  headerType = 'NONE',
  headerContent = null,
  body,
  footer,
  buttons = []
}: PhoneMockupProps) {
  // Simple WhatsApp markdown parser for preview
  const parseWhatsAppMarkdown = (text: string) => {
    if (!text) return null;
    
    // Process markdown (simple regex replacements for preview)
    // Note: This is a simplistic implementation for visual preview only
    const parts = text.split(/(\*[^*]+\*|_[^_]+_|~[^~]+~|```[^`]+```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <strong key={index}>{part.slice(1, -1)}</strong>;
      }
      if (part.startsWith('_') && part.endsWith('_')) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('~') && part.endsWith('~')) {
        return <del key={index}>{part.slice(1, -1)}</del>;
      }
      if (part.startsWith('```') && part.endsWith('```')) {
        return <code key={index} className="bg-gray-100 rounded px-1 text-sm font-mono">{part.slice(3, -3)}</code>;
      }
      // Replace newlines with <br />
      return <span key={index}>{part.split('\n').map((line, i, arr) => (
        <React.Fragment key={i}>
          {line}
          {i < arr.length - 1 && <br />}
        </React.Fragment>
      ))}</span>;
    });
  };

  const getButtonIcon = (type: string) => {
    switch (type) {
      case 'QUICK_REPLY': return <Reply className="h-4 w-4 text-[#0090FF] rotate-180" />;
      case 'URL': return <ExternalLink className="h-4 w-4 text-[#0090FF]" />;
      case 'PHONE_NUMBER': return <Phone className="h-4 w-4 text-[#0090FF]" />;
      case 'FLOW': return <FormInput className="h-4 w-4 text-[#0090FF]" />;
      default: return null;
    }
  };

  return (
    <div className="w-[320px] shrink-0 overflow-hidden rounded-[40px] border-[8px] border-black bg-[#efeae2] shadow-2xl relative" style={{ height: '650px' }}>
      
      {/* Status Bar */}
      <div className="flex h-12 items-center justify-between px-6 text-black bg-white/60 backdrop-blur-md sticky top-0 z-10">
        <span className="text-[14px] font-semibold">9:41</span>
        <div className="flex items-center gap-1.5">
          <Signal className="h-4 w-4" />
          <Wifi className="h-4 w-4" />
          <Battery className="h-[18px] w-[18px]" />
        </div>
      </div>

      {/* WhatsApp Header */}
      <div className="flex items-center justify-between bg-[#075e54] px-3 py-2 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <button className="flex items-center text-white">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-300 text-slate-800 font-semibold text-sm overflow-hidden shrink-0">
            {brandAvatar}
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-medium leading-tight truncate w-32">{brandName}</span>
            <span className="text-[11px] text-white/80">Business Account</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Video className="h-5 w-5" />
          <Phone className="h-5 w-5" />
          <MoreVertical className="h-5 w-5" />
        </div>
      </div>

      {/* Chat Area */}
      <div className="p-4 flex flex-col h-[calc(100%-116px)] overflow-y-auto">
        <div className="bg-[#e1f5fe] self-center text-[11px] text-slate-600 px-3 py-1 rounded-lg mb-4 shadow-sm">
          Today
        </div>

        {/* Message Bubble container */}
        <div className="flex flex-col max-w-[90%] self-start mt-2">
          
          <div className="bg-white rounded-xl rounded-tl-none shadow-sm border border-slate-100 relative mb-1 flex flex-col overflow-hidden">
            
            {/* Header (Full bleed for media) */}
            {headerType === 'IMAGE' && (
              <div className="w-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs overflow-hidden" style={{ minHeight: '160px' }}>
                {headerContent && (headerContent.startsWith('http') || headerContent.startsWith('blob:') || headerContent.startsWith('data:')) ? (
                  <img src={headerContent} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-500 gap-2">
                    <ImageIcon className="h-8 w-8 opacity-60" />
                    <span className="font-medium text-sm">Image Attached</span>
                  </div>
                )}
              </div>
            )}
            {headerType === 'VIDEO' && (
              <div className="w-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs relative overflow-hidden" style={{ minHeight: '160px' }}>
                {headerContent && (headerContent.startsWith('http') || headerContent.startsWith('blob:') || headerContent.startsWith('data:')) ? (
                  <video src={headerContent} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-500 gap-2 z-10">
                    <Video className="h-8 w-8 opacity-60" />
                    <span className="font-medium text-sm">Video Attached</span>
                  </div>
                )}
                {headerContent && (headerContent.startsWith('http') || headerContent.startsWith('blob:') || headerContent.startsWith('data:')) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <Video className="h-8 w-8 text-white opacity-80" />
                  </div>
                )}
              </div>
            )}

            <div className="p-2">
              {/* Header Text or Document */}
              {headerType === 'TEXT' && headerContent && (
                <div className="font-bold text-[15px] text-slate-800 mb-1 px-1">
                  {headerContent}
                </div>
              )}
              {headerType === 'DOCUMENT' && (
                <div className="w-full h-12 bg-slate-100 border border-slate-200 rounded-lg mb-2 flex items-center px-3 text-slate-500 text-xs gap-2 overflow-hidden">
                  <FormInput className="h-5 w-5 shrink-0" />
                  <span className="truncate">
                    {headerContent && !headerContent.startsWith('4:') ? headerContent : 'Document Attached'}
                  </span>
                </div>
              )}

              {/* Body */}
              <div className="text-[14px] text-slate-800 leading-snug px-1 whitespace-pre-wrap">
                {parseWhatsAppMarkdown(body) || 'Message body...'}
              </div>

              {/* Footer */}
              {footer && (
                <div className="text-[12px] text-slate-500 mt-2 px-1">
                  {footer}
                </div>
              )}

              {/* Timestamp */}
              <div className="flex justify-end items-center gap-1 mt-1 pr-1">
                <span className="text-[10px] text-slate-400">9:41 AM</span>
              </div>
            </div>

            {/* Buttons */}
            {buttons && buttons.length > 0 && (
              <div className="flex flex-col w-full bg-white">
                {buttons.map((btn, idx) => (
                  <div key={idx} className="border-t border-slate-100 px-3 py-2.5 flex items-center justify-center gap-2 text-[14px] font-medium text-[#0090FF] active:bg-slate-50 transition">
                    {getButtonIcon(btn.type)}
                    <span className="truncate">{btn.button_text || 'Button text'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
