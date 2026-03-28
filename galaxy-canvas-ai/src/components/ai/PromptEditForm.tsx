import { useState } from 'react';
import { Wand2, Upload, Sparkles, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { fileToBase64, improvePrompt } from '@/lib/api';
import { toast } from 'sonner';

interface PromptEditFormProps {
  onSubmit: (image: string, prompt: string) => Promise<void>;
  isLoading: boolean;
}

export function PromptEditForm({ onSubmit, isLoading }: PromptEditFormProps) {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isImproving, setIsImproving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setImage(base64);
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      toast.error('Please upload an image first');
      return;
    }
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    await onSubmit(image, prompt);
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

  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nebula-purple to-nebula-pink flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">AI Prompt Edit</h3>
          <p className="text-sm text-muted-foreground">Describe your changes in natural language</p>
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
          <label className="flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Click to upload</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        )}
      </div>

      {/* Prompt Input */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">Edit Prompt</label>
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
          placeholder="e.g., Make the sky more dramatic with purple and orange sunset colors..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px] bg-input border-border/50 focus:border-primary"
        />
      </div>

      {/* Submit */}
      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={isLoading || !image || !prompt.trim()}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {isLoading ? 'Processing...' : 'Generate Edit'}
      </Button>
    </div>
  );
}
