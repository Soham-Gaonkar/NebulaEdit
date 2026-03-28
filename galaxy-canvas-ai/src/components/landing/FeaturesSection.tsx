import { 
  Crop, 
  Sliders, 
  Layers, 
  Wand2, 
  Image, 
  Sparkles,
  SunMedium,
  ZoomIn
} from 'lucide-react';

const features = [
  {
    icon: Crop,
    title: 'Geometry Tools',
    description: 'Crop, rotate, flip, and scale with precision. Professional transformations at your fingertips.',
    color: 'text-star-cyan',
  },
  {
    icon: Sliders,
    title: 'Fine Adjustments',
    description: 'Control exposure, brightness, contrast, saturation, highlights, shadows, and more.',
    color: 'text-nebula-pink',
  },
  {
    icon: Layers,
    title: 'Layer System',
    description: 'Non-destructive editing with full layer support. Add text, shapes, and drawings.',
    color: 'text-nebula-purple',
  },
  {
    icon: Wand2,
    title: 'AI Prompt Editing',
    description: 'Describe your changes in natural language. Let AI transform your vision into reality.',
    color: 'text-star-cyan',
  },
  {
    icon: Image,
    title: 'Multi-Image Fusion',
    description: 'Combine multiple images with AI-powered blending and style transfer.',
    color: 'text-nebula-pink',
  },
  {
    icon: SunMedium,
    title: 'AI Relighting',
    description: 'Change lighting conditions instantly. Add dramatic effects or natural illumination.',
    color: 'text-nebula-purple',
  },
  {
    icon: ZoomIn,
    title: 'Smart Upscaling',
    description: 'Enhance resolution without losing quality. AI-powered detail enhancement.',
    color: 'text-star-cyan',
  },
  {
    icon: Sparkles,
    title: 'MagicQuill',
    description: 'Text-guided brush editing. Paint your intentions and watch AI bring them to life.',
    color: 'text-nebula-pink',
  },
];

export function FeaturesSection() {
  return (
    <section className="relative py-24 px-4">
      <div className="absolute inset-0 nebula-bg opacity-50" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Powerful Features</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need for professional image editing, enhanced with cutting-edge AI capabilities.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-panel p-6 hover:border-primary/30 transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
