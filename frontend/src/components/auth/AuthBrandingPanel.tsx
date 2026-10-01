import { MessageSquare, Zap, Send, CheckCircle2 } from 'lucide-react';

export default function AuthBrandingPanel() {
  return (
    <div className="relative w-full lg:w-2/3 flex flex-col min-h-[44vh] lg:min-h-screen overflow-hidden p-8 lg:p-14" 
      style={{
        background: 'radial-gradient(circle at top right, #0F3350 0%, transparent 60%), linear-gradient(170deg, #071A2C 0%, #0A2338 50%, #0D2A42 100%)',
      }}
    >
      {/* Top Left Badge */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded overflow-hidden flex items-center justify-center">
          <img src="/images/logo.jpeg" alt="Ashwini Innovations Logo" className="w-full h-full object-contain" />
        </div>
        <span className="text-base font-semibold tracking-[0.08em] text-white uppercase">
          Ashwini Innovations
        </span>
      </div>

      {/* Center Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-[500px] mt-12 lg:mt-0">
        <h1 className="font-serif text-[38px] lg:text-[58px] leading-[1.06] font-normal text-ink mb-6">
          WhatsApp, <span className="text-sea-bright font-light italic">on autopilot.</span>
        </h1>
        <p className="text-[15.5px] text-slate leading-[1.65] max-w-[460px]">
          <span className="font-semibold text-sea-foam">Ashwini</span> connects your business to the official WhatsApp API and automates the conversation — from first reply to final delivery.
        </p>
      </div>

      {/* 3-Column Step Row (Bottom) */}
      <div className="relative z-10 hidden lg:grid grid-cols-3 gap-6 pt-6 mt-8 border-t border-white/10">
        <div>
          <div className="w-7 h-7 rounded-lg border border-sea-bright/30 bg-sea-bright/10 flex items-center justify-center mb-3">
            <Zap className="w-3.5 h-3.5 text-sea-bright" />
          </div>
          <h3 className="text-[12px] font-bold text-ink mb-1">Trigger</h3>
          <p className="text-[11.5px] text-slate">Lead, form or schedule</p>
        </div>
        <div>
          <div className="w-7 h-7 rounded-lg border border-sea-bright/30 bg-sea-bright/10 flex items-center justify-center mb-3">
            <Send className="w-3.5 h-3.5 text-sea-bright" />
          </div>
          <h3 className="text-[12px] font-bold text-ink mb-1">Send</h3>
          <p className="text-[11.5px] text-slate">Template or live chat</p>
        </div>
        <div>
          <div className="w-7 h-7 rounded-lg border border-sea-bright/30 bg-sea-bright/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-sea-bright" />
          </div>
          <h3 className="text-[12px] font-bold text-ink mb-1">Delivered</h3>
          <p className="text-[11.5px] text-slate">Read receipts, real time</p>
        </div>
      </div>

      {/* Automation Flow Visual (Background Graphic) */}
      <div className="absolute right-0 lg:right-[8%] top-[-8%] h-[116%] w-[100%] lg:w-[65%] z-0 pointer-events-none opacity-60 lg:opacity-100 flex items-center justify-center overflow-visible">
        <svg viewBox="0 0 500 500" className="w-full h-full min-w-[500px] -translate-x-4 -translate-y-8" preserveAspectRatio="xMidYMid meet">
          {/* Path definitions */}
          <defs>
            <path id="flowPath" d="M 120 420 C 250 420, 250 260, 320 220 C 370 190, 390 120, 420 80" />
            <linearGradient id="pathGradient" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--sea-bright)" stopOpacity="0.1" />
              <stop offset="50%" stopColor="var(--sea-bright)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--sea-bright)" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Static dashed path */}
          <path 
            d="M 120 420 C 250 420, 250 260, 320 220 C 370 190, 390 120, 420 80" 
            fill="none" 
            stroke="var(--sea-bright)" 
            strokeWidth="1.5" 
            strokeDasharray="6 8" 
            className="opacity-35" 
          />
          
          {/* Animated flowing dash segment */}
          <path 
            d="M 120 420 C 250 420, 250 260, 320 220 C 370 190, 390 120, 420 80" 
            fill="none" 
            stroke="url(#pathGradient)" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            strokeDasharray="40 1000"
            className="animate-flow-dash"
          />

          {/* Node 1: Trigger (Lightning Bolt) */}
          <g transform="translate(120, 420)">
            <circle cx="0" cy="0" r="20" fill="var(--navy-deep)" stroke="var(--sea-bright)" strokeWidth="1.5" />
            <g transform="translate(-10, -10) scale(0.85)" stroke="var(--sea-bright)" fill="var(--sea-bright)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </g>
          </g>

          {/* Node 2: Message 1 */}
          <g transform="translate(230, 315)">
            <circle cx="0" cy="0" r="16" fill="var(--navy-deep)" stroke="var(--sea-bright)" strokeWidth="1.5" className="opacity-90" />
            <g transform="translate(-11, -11) scale(0.9)" stroke="var(--sea-bright)" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <polyline points="15 9 11 13 8 10" />
            </g>
          </g>

          {/* Node 3: Message 2 */}
          <g transform="translate(320, 220)">
            <circle cx="0" cy="0" r="16" fill="var(--navy-deep)" stroke="var(--sea-bright)" strokeWidth="1.5" className="opacity-90" />
            <g transform="translate(-11, -11) scale(0.9)" stroke="var(--sea-bright)" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <polyline points="15 9 11 13 8 10" />
            </g>
          </g>

          {/* Node 4: Delivered (End) */}
          <g transform="translate(420, 80)">
            <circle cx="0" cy="0" r="24" fill="var(--navy-deep)" stroke="var(--sea-bright)" strokeWidth="2" />
            <g transform="translate(-12, -12)" stroke="var(--sea-bright)" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 6 7 17 2 12" />
              <path d="M22 10 15.5 16.5" />
            </g>
          </g>

          {/* Ambient decorations (faint chat bubbles) */}
          <g transform="translate(180, 150) scale(0.8)" stroke="var(--sea-bright)" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </g>
          
          <g transform="translate(380, 350) scale(1.1)" stroke="var(--sea-bright)" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-15">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </g>
        </svg>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flow-dash {
          0% { stroke-dashoffset: 1040; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-flow-dash {
          animation: flow-dash 4.5s linear infinite;
        }
      `}} />
    </div>
  );
}
