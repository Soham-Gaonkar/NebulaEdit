import { useState } from 'react';
import { ZoomIn, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fileToBase64 } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UpscaleFormProps {
  onSubmit: (image: string, scale: number) => Promise<void>;
  isLoading: boolean;
}

const scaleOptions = [
  { value: 2, label: '2x', desc: 'Double resolution' },
  { value: 4, label: '4x', desc: 'Quadruple resolution' },
  { value: 8, label: '8x', desc: 'Maximum detail' },
];

export function UpscaleForm({ onSubmit, isLoading }: UpscaleFormProps) {
  const [image, setImage] = useState<string | null>(null);
  const [scale, setScale] = useState(2);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setImage(base64);
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      toast.error('Please upload an image');
      return;
    }
    await onSubmit(image, scale);
  };

  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
          <ZoomIn className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">AI Upscaling</h3>
          <p className="text-sm text-muted-foreground">Enhance resolution with AI</p>
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Source Image</label>
        {image ? (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <img src={image} alt="Upload" className="w-full h-full object-contain" />
            <button
              onClick={() => setImage(null)}
              className="absolute top-2 right-2 p-1 rounded bg-background/80 hover:bg-background"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Click to upload</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        )}
      </div>

      {/* Scale Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Upscale Factor</label>
        <div className="grid grid-cols-3 gap-2">
          {scaleOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setScale(option.value)}
              className={cn(
                'p-3 rounded-lg border text-center transition-all',
                scale === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 hover:border-primary/50'
              )}
            >
              <div className="font-display font-bold text-lg text-foreground">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <Button 
        variant="glow" 
        className="w-full" 
        onClick={handleSubmit}
        disabled={isLoading || !image}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {isLoading ? 'Upscaling...' : `Upscale ${scale}x`}
      </Button>
    </div>
  );
}
