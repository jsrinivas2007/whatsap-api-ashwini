"use client";

import { useState } from 'react';
import { AuthInput, AuthButton } from '@/components/auth/AuthFormElements';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: 'book_demo' | 'talk_to_us';
}

export function ContactModal({ isOpen, onClose, source }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    work_email: '',
    company_name: '',
    phone: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, source })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative max-h-[95vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-all z-10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-sea-foam/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-sea" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif font-bold text-navy-deep mb-2">Thank You</h3>
              <p className="text-text-muted mb-8">Thanks — we'll be in touch shortly.</p>
              <button 
                onClick={onClose}
                className="w-full bg-navy-deep text-white py-3 rounded-xl font-medium hover:bg-navy-mid transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-serif font-bold text-navy-deep mb-2">
                {source === 'book_demo' ? 'Book a Demo' : 'Talk to Us'}
              </h2>
              <p className="text-sm text-text-muted mb-6">
                Fill out the form below and our team will get back to you as soon as possible.
              </p>

              {error && (
                <div className="p-3 mb-6 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <AuthInput
                  id="name"
                  label="Full Name"
                  type="text"
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
                  required
                />
                <AuthInput
                  id="work_email"
                  label="Work Email"
                  type="email"
                  placeholder="jane@company.com"
                  value={formData.work_email}
                  onChange={(val) => setFormData(prev => ({ ...prev, work_email: val }))}
                  required
                />
                <AuthInput
                  id="company_name"
                  label="Company Name"
                  type="text"
                  placeholder="Acme Corp"
                  value={formData.company_name}
                  onChange={(val) => setFormData(prev => ({ ...prev, company_name: val }))}
                  required
                />
                <AuthInput
                  id="phone"
                  label="Phone Number (Optional)"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(val) => setFormData(prev => ({ ...prev, phone: val }))}
                />
                <div className="space-y-1.5">
                  <label htmlFor="message" className="block text-sm font-medium text-navy-deep">Message / Notes (Optional)</label>
                  <textarea
                    id="message"
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sea focus:ring-2 focus:ring-sea/20 outline-none transition-all resize-none"
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>
                
                <div className="pt-4">
                  <AuthButton loading={loading} disabled={!formData.name || !formData.work_email || !formData.company_name}>
                    Request a demo
                  </AuthButton>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
