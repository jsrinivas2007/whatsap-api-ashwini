import Link from 'next/link';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export default function ContactUsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">Get in touch</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about our WhatsApp Business API platform? Our team is here to help you scale your messaging.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-semibold mb-8">Contact Information</h2>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Email</h3>
                  <p className="text-muted-foreground mb-1">For general inquiries and support.</p>
                  <a href="mailto:info@ashwiniinnovations.com" className="text-primary hover:underline font-medium">info@ashwiniinnovations.com</a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Phone</h3>
                  <p className="text-muted-foreground mb-1">Call us directly.</p>
                  <a href="tel:+919640111265" className="text-primary hover:underline font-medium">+91 9640111265</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Ashwini Innovations</h3>
                  <p className="text-muted-foreground">
                    India
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card border rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
            <form className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none bg-background transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none bg-background transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Work Email</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none bg-background transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none bg-background transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea rows={4} className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none bg-background transition-all resize-none"></textarea>
              </div>

              <button type="button" className="w-full bg-foreground text-background py-3 rounded-full font-medium hover:bg-foreground/90 transition-colors mt-6 flex justify-center items-center gap-2">
                Send Message <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-20 text-center border-t pt-10">
          <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
