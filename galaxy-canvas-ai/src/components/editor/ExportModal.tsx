import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { downloadImage } from '@/lib/api';
import { useEditorStore } from '@/store/editorStore';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

type ExportFormat = 'png' | 'jpg' | 'webp';

export function ExportModal({ open, onClose }: ExportModalProps) {
  const { currentImage } = useEditorStore();
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(90);
  const [isExporting, setIsExporting] = useState(false);

  const formats: { value: ExportFormat; label: string; desc: string }[] = [
    { value: 'png', label: 'PNG', desc: 'Lossless, best for graphics' },
    { value: 'jpg', label: 'JPG', desc: 'Smaller size, good for photos' },
    { value: 'webp', label: 'WebP', desc: 'Modern format, best compression' },
  ];

  const handleExport = async () => {
    if (!currentImage) return;
    
    setIsExporting(true);
    
    try {
      // Create a canvas to apply all adjustments
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = currentImage;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      canvas.width = img.width;
      canvas.height = img.height;

      // Apply adjustments using canvas filters
      const { adjustments, rotation, flipH, flipV } = useEditorStore.getState();
      
      ctx.save();
      
      // Apply transforms
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Apply CSS-like filters
      const brightness = 1 + (adjustments.brightness + adjustments.exposure) / 100;
      const contrast = 1 + adjustments.contrast / 100;
      const saturate = 1 + adjustments.saturation / 100;
      
      ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;
      
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      // Export based on format
      let mimeType = 'image/png';
      if (format === 'jpg') mimeType = 'image/jpeg';
      if (format === 'webp') mimeType = 'image/webp';

      const dataUrl = canvas.toDataURL(mimeType, quality / 100);
      downloadImage(dataUrl, `nebula-edit-${Date.now()}`, format);
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Export Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Format</label>
            <div className="grid grid-cols-3 gap-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all',
                    format === f.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-primary/50'
                  )}
                >
                  <div className="font-semibold text-foreground">{f.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider (for JPG and WebP) */}
          {format !== 'png' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Quality</label>
                <span className="text-sm text-muted-foreground">{quality}%</span>
              </div>
              <Slider
                value={[quality]}
                onValueChange={([v]) => setQuality(v)}
                min={10}
                max={100}
                step={5}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="glow" 
            onClick={handleExport}
            disabled={!currentImage || isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
