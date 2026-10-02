import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Vaartaa by Ashwini Innovations',
  description: 'Privacy Policy for Vaartaa — how Ashwini Innovations collects, uses, and protects data on the WhatsApp Business API platform.',
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight mb-8">Privacy Policy</h1>
        <div className="prose prose-sm sm:prose-base prose-slate dark:prose-invert">
          <p className="text-muted-foreground mb-6">Last updated: October 2, 2026</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Data Controller</h2>
          <p className="mb-4">This Privacy Policy describes how <strong>Ashwini Innovations</strong> (&ldquo;Vaartaa,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;), with its principal place of business in India, collects, uses, and shares information when you use our website and our WhatsApp Business API platform. For questions about privacy, contact us at <a href="mailto:info@ashwiniinnovations.com" className="underline">info@ashwiniinnovations.com</a> or +91 9640111265.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
          <p className="mb-4">We collect information you provide directly to us, such as when you create or modify your account, request support, or otherwise communicate with us. This may include your name, email address, phone number, business details, and billing information.</p>
          <p className="mb-4">We also collect limited technical information automatically, such as IP address, browser type, and pages visited, to operate and secure the Service.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. End-User and WhatsApp Message Data</h2>
          <p className="mb-4">As a WhatsApp Business API platform, we process message content, contact lists, and conversation metadata <strong>on behalf of our business customers</strong> (who act as data controllers for their own customers). Business customers retain ownership of their customer data. We do not use customer or end-user data for our own marketing purposes, and we access it only to provide, secure, and debug the Service.</p>
          <p className="mb-4">End users of a business&rsquo;s WhatsApp account may exercise rights regarding their data by contacting that business directly, or by contacting us as described in Section 9.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. How We Use Information</h2>
          <p className="mb-4">We use the information we collect to provide and maintain the Service, process transactions, send service notices, comply with legal obligations, enforce our Terms of Service, and prevent abuse, spam, and security threats.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Sharing with Third Parties</h2>
          <p className="mb-4">We use third-party subprocessors to provide our services, including <strong>Meta Platforms, Inc.</strong> (WhatsApp Cloud API message delivery), and cloud infrastructure and hosting providers (Supabase, Vercel, Render). These entities process data only to the extent necessary to provide their services to us, in accordance with their respective privacy policies and our data-processing agreements. We do not sell personal information.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Security</h2>
          <p className="mb-4">We implement appropriate technical and organizational measures to protect the security of personal information and customer data, including encryption in transit (TLS) and at rest, access controls, and credential isolation on the server side.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Data Retention and Deletion</h2>
          <p className="mb-4">We retain personal information for as long as an account is active or as needed to provide the Service. Business customers may delete their account and associated data at any time from within the platform, or by contacting us. Deletion requests are processed within 30 days, subject to legal retention requirements.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Cookies</h2>
          <p className="mb-4">Our website uses cookies and similar technologies for authentication, session management, and preferences. You can control cookies through your browser settings; disabling them may affect the ability to log in and use the Service.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Your Rights</h2>
          <p className="mb-4">Subject to applicable law, you may request access to, correction of, export of, or deletion of your personal information, and you may object to certain processing. To exercise these rights, email <a href="mailto:info@ashwiniinnovations.com" className="underline">info@ashwiniinnovations.com</a>. We respond to verified requests within 30 days.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Children</h2>
          <p className="mb-4">The Service is not directed to individuals under the age of 18, and we do not knowingly collect personal information from children.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Changes to This Policy</h2>
          <p className="mb-4">We may update this Privacy Policy from time to time. Material changes will be announced on this page with an updated revision date, and, where required, with additional notice.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Contact</h2>
          <p className="mb-4">For privacy questions or requests, contact: Ashwini Innovations &mdash; <a href="mailto:info@ashwiniinnovations.com" className="underline">info@ashwiniinnovations.com</a> &mdash; +91 9640111265, India.</p>

          <p className="mt-8 mb-4">
            See also our <Link href="/terms" className="underline font-medium">Terms of Service</Link> and <Link href="/refund-policy" className="underline font-medium">Refund Policy</Link>.
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
