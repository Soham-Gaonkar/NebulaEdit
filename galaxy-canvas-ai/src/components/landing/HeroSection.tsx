import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroNebula from '@/assets/hero-nebula.jpg';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroNebula})` }}
      />
      
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
      
      {/* Additional effects */}
      <div className="absolute inset-0 star-field opacity-30" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nebula-purple/20 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-star-cyan/20 rounded-full blur-[80px] animate-float" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 backdrop-blur-sm border border-border/50 mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-star-cyan" />
          <span className="text-sm text-muted-foreground">Powered by Advanced AI</span>
        </div>

        {/* Main Heading */}
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="block text-foreground">Transform Your</span>
          <span className="block gradient-text glow-text mt-2">Images with AI</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Professional-grade editing with integrated AI features. Create stunning visuals with 
          intelligent tools, real-time previews, and magical transformations—all in one editor.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Link to="/editor">
            <Button variant="glow" size="xl" className="group">
              <Wand2 className="w-5 h-5" />
              Start Editing
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-border/30 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {[
            { value: '10+', label: 'AI Models' },
            { value: '50+', label: 'Filters & Effects' },
            { value: '∞', label: 'Possibilities' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
