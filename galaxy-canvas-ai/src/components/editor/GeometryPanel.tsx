import { Crop, RotateCw, Maximize2, FlipHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editorStore';

interface GeometryPanelProps {
  onClose: () => void;
}

export function GeometryPanel({ onClose }: GeometryPanelProps) {
  const { rotation, setRotation, flipH, setFlipH, setTool } = useEditorStore();

  const handleRotate = () => {
    setRotation(rotation + 90);
  };

  const handleCrop = () => {
    setTool('crop');
    onClose();
  };

  return (
    <div className="w-full h-full flex items-center justify-center py-4">
      {/* Toolbar - centered */}
      <div className="flex items-center gap-6 px-6">
        <button
          onClick={handleCrop}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
            "bg-yellow-500 text-black hover:bg-yellow-400"
          )}
        >
          <Crop className="w-6 h-6" />
        </button>

        <button
          onClick={handleRotate}
          className="w-12 h-12 rounded-full bg-card/50 border border-border/30 flex items-center justify-center hover:bg-card transition-all"
        >
          <RotateCw className="w-6 h-6" />
        </button>

        <button
          className="w-12 h-12 rounded-full bg-card/50 border border-border/30 flex items-center justify-center hover:bg-card transition-all"
        >
          <Maximize2 className="w-6 h-6" />
        </button>

        <button
          onClick={() => setFlipH(!flipH)}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
            flipH ? "bg-primary text-primary-foreground" : "bg-card/50 border border-border/30 hover:bg-card"
          )}
        >
          <FlipHorizontal className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}