import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nebula-purple via-nebula-pink to-star-cyan flex items-center justify-center shadow-lg group-hover:shadow-[0_0_20px_hsl(280_100%_70%/0.5)] transition-shadow duration-300">
              <Sparkles className="w-5 h-5 text-foreground" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">
              NebulaEdit
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
