import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight mb-8">Terms of Service</h1>
        <div className="prose prose-sm sm:prose-base prose-slate dark:prose-invert">
          <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-800 dark:text-amber-200 text-sm mb-8">
            <strong>Placeholder Notice:</strong> These Terms of Service are placeholder text for demonstration purposes only. You must have this document reviewed by legal counsel before operating Vaartaa in production.
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">By accessing or using Vaartaa's services, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
          <p className="mb-4">Vaartaa provides a software-as-a-service platform for managing WhatsApp Business API communications. We act as a technology provider connecting your business to the Meta Cloud API.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Meta Policies Compliance</h2>
          <p className="mb-4">You agree to strictly adhere to the WhatsApp Business Messaging Policy and Commerce Policy. Vaartaa is not responsible for any bans or restrictions placed on your WhatsApp Business Account by Meta due to policy violations.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Subscriptions and Billing</h2>
          <p className="mb-4">You will be billed in advance on a recurring and periodic basis depending on your subscription plan. Conversation costs incurred via the Meta API will be billed in addition to your platform subscription fees.</p>
        </div>
        
        <div className="mt-16 text-center border-t pt-10">
          <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
