import { useState } from 'react';
import { Sun, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { fileToBase64 } from '@/lib/api';
import { toast } from 'sonner';

interface RelightingFormProps {
  onSubmit: (image: string, params: { direction: number; intensity: number; color: string }) => Promise<void>;
  isLoading: boolean;
}

const lightColors = [
  { value: '#ffffff', label: 'White' },
  { value: '#ffd700', label: 'Golden' },
  { value: '#ff6b35', label: 'Warm' },
  { value: '#00d4ff', label: 'Cool' },
  { value: '#ff00ff', label: 'Magenta' },
];

export function RelightingForm({ onSubmit, isLoading }: RelightingFormProps) {
  const [image, setImage] = useState<string | null>(null);
  const [direction, setDirection] = useState(180);
  const [intensity, setIntensity] = useState(50);
  const [lightColor, setLightColor] = useState('#ffffff');

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
    await onSubmit(image, { direction, intensity, color: lightColor });
  };

  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
          <Sun className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">AI Relighting</h3>
          <p className="text-sm text-muted-foreground">Change lighting conditions instantly</p>
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

      {/* Light Direction */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-medium text-foreground">Light Direction</label>
          <span className="text-sm text-muted-foreground">{direction}°</span>
        </div>
        <Slider
          value={[direction]}
          onValueChange={([v]) => setDirection(v)}
          min={0}
          max={360}
          step={15}
        />
      </div>

      {/* Intensity */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-medium text-foreground">Intensity</label>
          <span className="text-sm text-muted-foreground">{intensity}%</span>
        </div>
        <Slider
          value={[intensity]}
          onValueChange={([v]) => setIntensity(v)}
          min={0}
          max={100}
        />
      </div>

      {/* Light Color */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Light Color</label>
        <div className="flex gap-2">
          {lightColors.map((color) => (
            <button
              key={color.value}
              onClick={() => setLightColor(color.value)}
              className={`w-10 h-10 rounded-lg transition-all ${
                lightColor === color.value ? 'ring-2 ring-primary scale-110' : ''
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
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
        {isLoading ? 'Relighting...' : 'Apply Lighting'}
      </Button>
    </div>
  );
}
