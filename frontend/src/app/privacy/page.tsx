import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight mb-8">Privacy Policy</h1>
        <div className="prose prose-sm sm:prose-base prose-slate dark:prose-invert">
          <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-800 dark:text-amber-200 text-sm mb-8">
            <strong>Placeholder Notice:</strong> This Privacy Policy is placeholder text for demonstration purposes only. You must have this document reviewed by legal counsel before operating Vaartaa in production.
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4">We collect information you provide directly to us, such as when you create or modify your account, request support, or otherwise communicate with us. This may include your name, email address, phone number, and billing information.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. End-User Data</h2>
          <p className="mb-4">As a WhatsApp Business API platform, we process messages and contacts on your behalf. You retain ownership of your customer data. We do not use your customer data for our own marketing purposes.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Security</h2>
          <p className="mb-4">We implement appropriate technical and organizational measures to protect the security of your personal information and customer data, including encryption in transit and at rest.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Third-Party Services</h2>
          <p className="mb-4">We use third-party subprocessors (like Meta and AWS/GCP) to provide our services. Your data may be transferred to and processed by these entities in accordance with their respective privacy policies.</p>
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
