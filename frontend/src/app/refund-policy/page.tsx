import Link from 'next/link';

export default function RefundPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight mb-8">Refund Policy</h1>
        <div className="prose prose-sm sm:prose-base prose-slate dark:prose-invert">
          <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-800 dark:text-amber-200 text-sm mb-8">
            <strong>Placeholder Notice:</strong> This Refund Policy is placeholder text for demonstration purposes only. You must have this document reviewed by legal counsel before operating Vaartaa in production.
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Subscription Refunds</h2>
          <p className="mb-4">Vaartaa offers a 7-day free trial on all plans. Once a subscription is activated and billed, subscription fees are generally non-refundable.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. WhatsApp Conversation Fees</h2>
          <p className="mb-4">Conversation fees are charged by Meta and passed through our platform. These usage-based fees are non-refundable under any circumstances, as they reflect actual API usage.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Account Cancellations</h2>
          <p className="mb-4">You may cancel your subscription at any time. Your account will remain active until the end of your current billing cycle. No prorated refunds will be issued for partial months.</p>
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
