import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-paper font-sans">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-20">
        <div className="text-center px-6 py-24">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-deep mb-4">Features</h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto mb-8">
            Explore everything you can do with Vaartaa. Coming soon.
          </p>
          <div className="w-16 h-1 bg-sea mx-auto rounded-full"></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
