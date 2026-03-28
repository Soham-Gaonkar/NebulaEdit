import { useState } from 'react';
import { Layers, Upload, Plus, Sparkles, X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { fileToBase64, improvePrompt } from '@/lib/api';
import { toast } from 'sonner';

interface ImageFusionFormProps {
  onSubmit: (images: string[], prompt: string) => Promise<void>;
  isLoading: boolean;
}

export function ImageFusionForm({ onSubmit, isLoading }: ImageFusionFormProps) {
  const [images, setImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isImproving, setIsImproving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && images.length < 2) {
      const base64 = await fileToBase64(file);
      setImages([...images, base64]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleImprovePrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }
    setIsImproving(true);
    try {
      const result = await improvePrompt(prompt);
      if (result.improved && result.improved.trim() !== prompt.trim()) {
        setPrompt(result.improved);
        toast.success('Prompt improved');
      } else {
        toast.info('No improvements suggested');
      }
    } catch (error) {
      console.error('Improve prompt error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to improve prompt');
    } finally {
      setIsImproving(false);
    }
  };

  const handleSubmit = async () => {
    if (images.length !== 2) {
      toast.error('Please upload exactly 2 images');
      return;
    }
    if (!prompt.trim()) {
      toast.error('Please enter a fusion prompt');
      return;
    }
    await onSubmit(images, prompt);
  };

  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-star-cyan to-star-blue flex items-center justify-center">
          <Layers className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Multi-Image Fusion</h3>
          <p className="text-sm text-muted-foreground">Blend exactly two images with AI</p>
        </div>
      </div>

      {/* Image Grid */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Source Images ({images.length}/2)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {images.map((img, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img src={img} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white">
                {index === 0 ? 'Background' : 'Subject'}
              </div>
            </div>
          ))}
          {images.length < 2 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors flex flex-col items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Add Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>
      </div>

      {/* Fusion Prompt */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">Fusion Prompt</label>
          <Button
            type="button"
            onClick={handleImprovePrompt}
            disabled={isImproving || !prompt.trim()}
            className="h-7 px-2 text-xs rounded-full border border-border/60 bg-card/80 text-foreground hover:border-primary/60 hover:bg-primary/10"
          >
            <Lightbulb className="mr-1 h-3 w-3 text-primary" />
            {isImproving ? 'Improving…' : 'Improve'}
          </Button>
        </div>
        <Textarea
          placeholder="e.g., Add the subject to the background image realistically..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[80px] bg-input border-border/50 focus:border-primary"
        />
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={isLoading || images.length !== 2 || !prompt.trim()}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {isLoading ? 'Fusing...' : 'Fuse Images'}
      </Button>
    </div>
  );
}
