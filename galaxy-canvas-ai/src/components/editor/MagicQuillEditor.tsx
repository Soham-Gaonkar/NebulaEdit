import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Wand2, Eraser, Check, X, Loader2 } from 'lucide-react';
import { magicQuillEdit } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MagicQuillEditorProps {
  imageUrl: string;
  onComplete: (editedImage: string) => void;
  onCancel: () => void;
}

export function MagicQuillEditor({ imageUrl, onComplete, onCancel }: MagicQuillEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;

    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    ctx.beginPath();
    ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);

    if (tool === 'brush') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.fill();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearMask = () => {
    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleApply = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt describing your edit');
      return;
    }

    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    // Check if mask has content
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const hasContent = maskData.data.some((v, i) => i % 4 === 3 && v > 0);

    if (!hasContent) {
      toast.error('Please brush over the area you want to edit');
      return;
    }

    setIsProcessing(true);

    try {
      const maskBase64 = maskCanvas.toDataURL('image/png');
      const result = await magicQuillEdit(imageUrl, maskBase64, prompt);

      if (result.success && result.data) {
        toast.success('AI edit applied successfully!');
        onComplete(result.data.image);
      } else {
        toast.error(result.error || 'Failed to apply AI edit');
      }
    } catch (error) {
      console.error('MagicQuill error:', error);
      toast.error('Failed to process AI edit');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageLoad = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!img || !canvas || !maskCanvas) return;

    // Set canvas sizes
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    maskCanvas.width = img.naturalWidth;
    maskCanvas.height = img.naturalHeight;

    // Draw image
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div>
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            MagicQuill AI Editor
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Brush over areas to edit, then describe the changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isProcessing}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button variant="glow" size="sm" onClick={handleApply} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Apply AI Edit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center overflow-auto">
          <div className="relative">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Edit preview"
              className="max-w-full max-h-[60vh] opacity-0 absolute"
              onLoad={handleImageLoad}
            />
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[60vh] rounded-lg"
            />
            <canvas
              ref={maskCanvasRef}
              className={cn(
                'absolute inset-0 max-w-full max-h-[60vh]',
                'cursor-crosshair'
              )}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
        </div>

        {/* Controls Panel */}
        <div className="w-full lg:w-80 glass-panel p-6 space-y-6">
          {/* Tools */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Tool</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={tool === 'brush' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('brush')}
                className="justify-start"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Brush
              </Button>
              <Button
                variant={tool === 'eraser' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('eraser')}
                className="justify-start"
              >
                <Eraser className="w-4 h-4 mr-2" />
                Eraser
              </Button>
            </div>
          </div>

          {/* Brush Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Brush Size</label>
              <span className="text-xs text-muted-foreground">{brushSize}px</span>
            </div>
            <Slider
              value={[brushSize]}
              onValueChange={([v]) => setBrushSize(v)}
              min={5}
              max={100}
              step={5}
            />
          </div>

          {/* Clear Mask */}
          <Button variant="outline" size="sm" onClick={clearMask} className="w-full">
            Clear Brush Strokes
          </Button>

          {/* Prompt */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Edit Prompt</label>
            <Textarea
              placeholder="e.g., Replace with a red sports car, Add flowers, Change to golden sunset..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] bg-input border-border/50 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">
              Describe what you want to see in the brushed area
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
