import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <FeaturesSection />
        
        {/* CTA Section */}
        <section className="relative py-24 px-4">
          <div className="absolute inset-0 nebula-bg opacity-30" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Ready to <span className="gradient-text">Transform</span> Your Images?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of creators using AI-powered editing tools to bring their vision to life.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/30 py-8 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold gradient-text">NebulaEdit</span>
              <span className="text-sm text-muted-foreground">© 2024</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Powered by Advanced AI • Built for Creators
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
