import WhatsappSetupSection from '@/components/dashboard/WhatsappSetupSection';
import TestWhatsappConnectionSection from '@/components/dashboard/TestWhatsappConnectionSection';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#f2f4ef] -m-4 sm:-m-6 md:-m-8 p-4 sm:p-6 md:p-10 font-sans text-[#1a2f24]">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center rounded-md bg-[#e6eee6] px-3 py-1 text-xs font-semibold text-[#276045] mb-2">
              Dashboard
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#0a1f14] mb-2">
              Good to see you, Ashwini
            </h2>
            <p className="text-sm text-[#4a6355] max-w-lg">
              Your WhatsApp channel's activity and customer conversations, all in one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a231e] text-sm font-bold text-white shadow-sm">
              AJ
            </div>
            <div className="text-left">
              <p className="text-[15px] font-bold text-[#1a2f24]">Ashwini Innovations</p>
              <p className="text-[13px] text-[#6b8275]">Workspace • Premium</p>
            </div>
          </div>
        </div>

        <hr className="border-t border-[#dce4db]" />

        <WhatsappSetupSection />
        
        <TestWhatsappConnectionSection />
      </div>
    </div>
  );
}
