import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Vaartaa by Ashwini Innovations',
  description: 'Terms of Service for Vaartaa — WhatsApp Business API platform by Ashwini Innovations.',
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight mb-8">Terms of Service</h1>
        <div className="prose prose-sm sm:prose-base prose-slate dark:prose-invert">
          <p className="text-muted-foreground mb-6">Last updated: October 2, 2026</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">By accessing or using Vaartaa (&ldquo;the Service&rdquo;), operated by Ashwini Innovations (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
          <p className="mb-4">Vaartaa provides a software-as-a-service platform for managing WhatsApp Business API communications. We act as a technology provider connecting your business to the Meta WhatsApp Cloud API. The Service includes messaging, contact management, campaign automation, and related tooling.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Meta Policies Compliance</h2>
          <p className="mb-4">You agree to strictly adhere to the WhatsApp Business Messaging Policy and WhatsApp Commerce Policy. Vaartaa is not responsible for any bans, quality-rating downgrades, or restrictions placed on your WhatsApp Business Account by Meta due to policy violations committed by you or your end users.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Subscriptions and Billing</h2>
          <p className="mb-4">You will be billed in advance on a recurring and periodic basis depending on your subscription plan. Conversation costs incurred via the Meta WhatsApp Cloud API may be billed in addition to your platform subscription fees. Fees are non-refundable except as described in our Refund Policy.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Responsibilities</h2>
          <p className="mb-4">You are responsible for (a) the accuracy of information you provide, (b) all activity under your account, (c) obtaining consent from recipients before messaging them, and (d) ensuring your use of the Service complies with all applicable laws in your jurisdiction.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Acceptable Use</h2>
          <p className="mb-4">You may not use the Service to send spam, unlawful content, misleading communications, or any content prohibited under the WhatsApp Business Messaging Policy. We reserve the right to suspend or terminate accounts that violate these restrictions.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Intellectual Property</h2>
          <p className="mb-4">All software, design, trademarks, and documentation provided through the Service remain the property of Ashwini Innovations or its licensors. You retain ownership of the data and content you upload.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Disclaimer and Limitation of Liability</h2>
          <p className="mb-4">The Service is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum extent permitted by law, Ashwini Innovations shall not be liable for any indirect, incidental, or consequential damages arising from your use of, or inability to use, the Service.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Governing Law</h2>
          <p className="mb-4">These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Hyderabad, Telangana, India.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact</h2>
          <p className="mb-4">Questions about these Terms may be sent to <a href="mailto:info@ashwiniinnovations.com" className="underline">info@ashwiniinnovations.com</a> or by phone at +91 9640111265.</p>

          <p className="mt-8 mb-4">
            See also our <Link href="/privacy" className="underline font-medium">Privacy Policy</Link> and <Link href="/refund-policy" className="underline font-medium">Refund Policy</Link>.
          </p>
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
