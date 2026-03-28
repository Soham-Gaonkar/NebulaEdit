import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { getFilterStyle, fileToBase64 } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CropTool } from './CropTool';
import { DrawingCanvas } from './DrawingCanvas';

interface ImageCanvasProps {
  onCompare?: boolean;
}

export function ImageCanvas({ onCompare = false }: ImageCanvasProps) {
  const { currentImage, setImage, adjustments, rotation, flipH, flipV, zoom, selectedTool, setTool } = useEditorStore();
  const [isDragging, setIsDragging] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);
  const [showCropTool, setShowCropTool] = useState(false);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const base64 = await fileToBase64(file);
      setImage(base64, 'Image loaded');
    }
  }, [setImage]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setImage(base64, 'Image loaded');
    }
  }, [setImage]);

  // Handle crop tool activation
  const handleCropComplete = useCallback((croppedImage: string) => {
    setImage(croppedImage, 'Cropped image');
    setShowCropTool(false);
    setTool('select');
  }, [setImage, setTool]);

  useEffect(() => {
    const wrapper = imageWrapperRef.current;
    if (!wrapper || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setCanvasSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(wrapper);
    const rect = wrapper.getBoundingClientRect();
    setCanvasSize({ width: rect.width, height: rect.height });
    return () => observer.disconnect();
  }, [currentImage, zoom, rotation, flipH, flipV]);

  // Open crop tool when crop is selected
  if (selectedTool === 'crop' && currentImage && !showCropTool) {
    setShowCropTool(true);
  }

  const filterStyle = getFilterStyle(adjustments);
  const transformStyle = `
    rotate(${rotation}deg) 
    scaleX(${flipH ? -1 : 1}) 
    scaleY(${flipV ? -1 : 1})
    scale(${zoom})
  `;

  // Render crop tool
  if (showCropTool && currentImage) {
    return (
      <CropTool
        imageUrl={currentImage}
        onComplete={handleCropComplete}
        onCancel={() => {
          setShowCropTool(false);
          setTool('select');
        }}
      />
    );
  }

  if (!currentImage) {
    return (
      <div
        className={cn(
          'w-full h-full flex items-center justify-center rounded-3xl border-2 border-dashed transition-all duration-300 backdrop-blur-sm',
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border/30 hover:border-primary/30 bg-card/20'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label className="flex flex-col items-center gap-4 cursor-pointer p-12">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-nebula-pink/20 flex items-center justify-center backdrop-blur-xl border border-primary/30">
            <Upload className="w-12 h-12 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-xl font-display font-semibold text-foreground mb-2 gradient-text">
              Drop your image here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />
        </label>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full relative overflow-hidden rounded-3xl"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Canvas with adjustments */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="relative max-w-full max-h-full">
          {onCompare ? (
            // Before/After comparison slider
            <div className="relative overflow-hidden">
              {/* Before (Original) */}
              <img
                src={currentImage}
                alt="Original"
                className="max-w-full max-h-[60vh] object-contain"
                style={{ transform: transformStyle }}
              />

              {/* After (With adjustments) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${comparePosition}%` }}
              >
                <img
                  src={currentImage}
                  alt="Edited"
                  className="max-w-full max-h-[60vh] object-contain"
                  style={{
                    transform: transformStyle,
                    filter: filterStyle
                  }}
                />
              </div>

              {/* Slider handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-primary cursor-ew-resize"
                style={{ left: `${comparePosition}%` }}
                onMouseDown={(e) => {
                  const handleMove = (moveE: MouseEvent) => {
                    const rect = (e.target as HTMLElement).parentElement!.getBoundingClientRect();
                    const pos = ((moveE.clientX - rect.left) / rect.width) * 100;
                    setComparePosition(Math.max(0, Math.min(100, pos)));
                  };
                  const handleUp = () => {
                    document.removeEventListener('mousemove', handleMove);
                    document.removeEventListener('mouseup', handleUp);
                  };
                  document.addEventListener('mousemove', handleMove);
                  document.addEventListener('mouseup', handleUp);
                }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <ImageIcon className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            </div>
          ) : (
            // Normal view with adjustments
            <div
              ref={imageWrapperRef}
              className="relative inline-block"
              style={{ transform: transformStyle }}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                useEditorStore.getState().setZoom(zoom * delta);
              }}
            >
              <img
                src={currentImage}
                alt="Editing"
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-[0_20px_80px_rgba(139,92,246,0.3)] border border-primary/20"
                style={{
                  filter: filterStyle,
                  transition: 'filter 0.2s ease-out'
                }}
              />
              {(selectedTool === 'draw' || selectedTool === 'erase' || selectedTool === 'text') && canvasSize.width > 0 && canvasSize.height > 0 && (
                <div className="absolute inset-0 z-10">
                  <DrawingCanvas
                    imageUrl={currentImage}
                    width={canvasSize.width}
                    height={canvasSize.height}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isDragging && (
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center">
          <div className="text-lg font-medium text-foreground">Drop to replace image</div>
        </div>
      )}
    </div>
  );
}
