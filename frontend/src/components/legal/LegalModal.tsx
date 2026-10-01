import { useEffect } from 'react';

export type LegalDocumentType = 'terms' | 'privacy' | null;

interface LegalModalProps {
  type: LegalDocumentType;
  onClose: () => void;
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  useEffect(() => {
    if (type) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [type]);

  if (!type) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-deep/80 backdrop-blur-sm animate-in fade-in duration-200 text-left">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden relative flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border bg-white">
          <h2 className="text-2xl font-serif font-bold text-navy-deep">
            {type === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 text-sm text-text-dark leading-relaxed space-y-4">
          {type === 'terms' && (
            <>
              <p className="font-semibold text-text-muted">Effective Date: 26 September 2026</p>
              <p>By using Ashwini Innovations' website, software, WhatsApp marketing, automation, or related services, you agree to these Terms of Use.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">1. Use of Services</h3>
              <p>You agree to use our services only for lawful business purposes and in compliance with applicable laws and third-party platform policies, including WhatsApp/Meta policies.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">2. WhatsApp Messaging</h3>
              <p>You are responsible for obtaining appropriate customer consent and ensuring that your messages are not spam, misleading, fraudulent, or prohibited.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">3. Account</h3>
              <p>You are responsible for keeping your account credentials secure and for all activity conducted through your account.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">4. Payments</h3>
              <p>Subscription fees are charged according to the plan selected. Prices, features, and usage limits may change with reasonable notice. Third-party charges may apply separately.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">5. Service Availability</h3>
              <p>We work to maintain reliable services but do not guarantee uninterrupted or error-free operation, particularly where third-party platforms or integrations are involved.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">6. Prohibited Use</h3>
              <p>You must not use our services for illegal activities, fraud, spam, harassment, unauthorized access, malware, or activities that violate third-party policies.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">7. Suspension</h3>
              <p>Ashwini Innovations may suspend or terminate accounts that violate these Terms or applicable laws/policies.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">8. Intellectual Property</h3>
              <p>Our website, software, branding, designs, content, and technology belong to Ashwini Innovations or its licensors and may not be copied or commercially reused without permission.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">9. Limitation of Liability</h3>
              <p>Ashwini Innovations is not responsible for indirect losses, business losses, or outcomes caused by third-party platforms, service interruptions, or misuse of the Services.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">10. Changes</h3>
              <p>We may update these Terms from time to time. Continued use of our Services means you accept the updated Terms.</p>
            </>
          )}

          {type === 'privacy' && (
            <>
              <p className="font-semibold text-text-muted">Effective Date: 26 September 2026</p>
              <p>Ashwini Innovations respects your privacy. This Privacy Policy explains how we collect, use, and protect information when you use our website and services.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">1. Information We Collect</h3>
              <p>We may collect:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Name, phone number, email, and business details</li>
                <li>Account and login information</li>
                <li>Contact and campaign information provided by you</li>
                <li>Payment and transaction details</li>
                <li>Website usage and technical information</li>
              </ul>
              
              <h3 className="font-bold text-navy-deep mt-4">2. How We Use Information</h3>
              <p>We use information to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide and manage our services</li>
                <li>Process subscriptions and payments</li>
                <li>Send requested communications</li>
                <li>Provide customer support</li>
                <li>Improve our products and services</li>
                <li>Prevent fraud, misuse, and security issues</li>
              </ul>
              
              <h3 className="font-bold text-navy-deep mt-4">3. WhatsApp & Customer Data</h3>
              <p>If you use our WhatsApp marketing or automation services, you are responsible for ensuring that you have the necessary permission to use and message your contacts. We process such information only as necessary to provide the requested services.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">4. Sharing of Information</h3>
              <p>We do not sell your personal information. We may share information with trusted service providers, payment processors, hosting providers, or third-party integrations when necessary to provide our services or comply with legal requirements.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">5. Data Security</h3>
              <p>We take reasonable technical and organizational measures to protect your information against unauthorized access, misuse, loss, or disclosure.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">6. Data Retention</h3>
              <p>We retain information only for as long as reasonably necessary to provide our services, meet business requirements, or comply with applicable laws.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">7. Your Rights</h3>
              <p>You may contact us to request access, correction, or deletion of your personal information, subject to applicable legal requirements.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">8. Cookies</h3>
              <p>Our website may use cookies and similar technologies to improve functionality, security, analytics, and user experience.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">9. Third-Party Services</h3>
              <p>Our services may connect with platforms such as WhatsApp/Meta, Google, payment providers, and other third-party services. Their own privacy policies may also apply.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">10. Changes to This Policy</h3>
              <p>We may update this Privacy Policy from time to time. The latest version will be published on this page.</p>
              
              <h3 className="font-bold text-navy-deep mt-4">11. Contact Us</h3>
              <p>Ashwini Innovations<br/>
              Email: info@ashwiniinnovations.com<br/>
              Phone: +91 9640111265<br/>
              </p>
              
              <p className="italic text-text-muted mt-6 text-xs">This is a concise website-ready template. For final legal compliance, especially if you process customer/WhatsApp data in India, have it reviewed by a qualified lawyer.</p>
            </>
          )}
        </div>
        
        <div className="p-6 border-t border-border bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-navy-deep text-white px-6 py-2 rounded-lg font-medium hover:bg-navy-mid transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
