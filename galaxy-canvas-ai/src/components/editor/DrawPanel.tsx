import { Pen, Eraser, Type, Palette } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editorStore';
import { Slider } from '@/components/ui/slider';

interface DrawPanelProps {
  onClose: () => void;
}

type DrawMode = 'draw' | 'erase' | 'text';

export function DrawPanel({ onClose }: DrawPanelProps) {
  const [mode, setMode] = useState<DrawMode>('draw');
  const { setTool, selectedColor, brushSize, setColor, setBrushSize } = useEditorStore();

  const handleDrawMode = (drawMode: DrawMode) => {
    setMode(drawMode);
    if (drawMode === 'draw') {
      setTool('draw');
    } else if (drawMode === 'erase') {
      setTool('erase');
    } else if (drawMode === 'text') {
      setTool('text');
    }
  };

  useEffect(() => {
    // Set initial tool when panel opens
    setTool('draw');
  }, [setTool]);

  return (
    <div className="w-full h-full flex flex-col gap-4 py-4">
      {/* Mode selector */}
      <div className="flex items-center gap-3 px-6">
        <button
          onClick={() => handleDrawMode('draw')}
          className={cn(
            "flex flex-col items-center gap-2 px-6 py-3 rounded-2xl glass-panel border transition-all",
            mode === 'draw' ? "border-primary bg-primary/10" : "border-border/30 hover:border-primary/50"
          )}
        >
          <Pen className="w-6 h-6 text-primary" />
          <span className="text-xs font-medium">Draw</span>
        </button>

        <button
          onClick={() => handleDrawMode('erase')}
          className={cn(
            "flex flex-col items-center gap-2 px-6 py-3 rounded-2xl glass-panel border transition-all",
            mode === 'erase' ? "border-primary bg-primary/10" : "border-border/30 hover:border-primary/50"
          )}
        >
          <Eraser className="w-6 h-6 text-primary" />
          <span className="text-xs font-medium">Erase</span>
        </button>

        <button
          onClick={() => handleDrawMode('text')}
          className={cn(
            "flex flex-col items-center gap-2 px-6 py-3 rounded-2xl glass-panel border transition-all",
            mode === 'text' ? "border-primary bg-primary/10" : "border-border/30 hover:border-primary/50"
          )}
        >
          <Type className="w-6 h-6 text-primary" />
          <span className="text-xs font-medium">Text</span>
        </button>
      </div>

      {/* Brush size slider */}
      {mode !== 'text' && (
        <div className="px-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Brush Size</span>
            <span className="text-xs font-medium text-primary">{brushSize}px</span>
          </div>
          <Slider
            value={[brushSize]}
            onValueChange={(v) => setBrushSize(v[0])}
            min={1}
            max={50}
            step={1}
            className="w-full"
          />
        </div>
      )}

      {/* Color picker */}
      {mode === 'draw' && (
        <div className="px-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Color
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase text-muted-foreground font-mono">{selectedColor}</span>
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/30 shadow-sm hover:scale-110 transition-transform">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 p-0 border-0 cursor-pointer"
                  title="Custom Color"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['#ffffff', '#000000', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#06b6d4', '#f97316'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "w-8 h-8 rounded-full border transition-all hover:scale-110 flex-shrink-0",
                  selectedColor === c ? "border-white scale-110 shadow-md" : "border-transparent bg-muted"
                )}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}