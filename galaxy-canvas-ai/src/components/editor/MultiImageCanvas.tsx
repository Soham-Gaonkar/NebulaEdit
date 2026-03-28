import { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, X, Move } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { fileToBase64 } from '@/lib/api';
import { cn } from '@/lib/utils';

export function MultiImageCanvas() {
  const { canvasImages, addCanvasImage, removeCanvasImage, updateCanvasImage, selectCanvasImage } = useEditorStore();
  const [isDragging, setIsDragging] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

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

    if (canvasImages.length >= 2) return; // Max 2 images

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const base64 = await fileToBase64(file);
      addCanvasImage(base64);
    }
  }, [addCanvasImage, canvasImages.length]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canvasImages.length < 2) {
      const base64 = await fileToBase64(file);
      addCanvasImage(base64);
    }
  }, [addCanvasImage, canvasImages.length]);

  const handleImageMouseDown = (e: React.MouseEvent, imageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const image = canvasImages.find(img => img.id === imageId);
    if (!image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    selectCanvasImage(imageId);
    setDraggedImageId(imageId);
    setDragOffset({
      x: e.clientX - rect.left - image.x,
      y: e.clientY - rect.top - image.y,
    });
  };

  useEffect(() => {
    if (!draggedImageId) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const image = canvasImages.find(img => img.id === draggedImageId);
      if (!image) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - image.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - image.height));

      updateCanvasImage(draggedImageId, { x, y });
    };

    const handleMouseUp = () => {
      setDraggedImageId(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedImageId, dragOffset, canvasImages, updateCanvasImage]);

  if (canvasImages.length === 0) {
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
              or click to browse • Max 2 images
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

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Deselect all if clicking on canvas background
    if (e.target === canvasRef.current) {
      canvasImages.forEach(img => {
        if (img.selected) {
          updateCanvasImage(img.id, { selected: false });
        }
      });
    }
  };

  return (
    <div
      ref={canvasRef}
      className="w-full h-full relative overflow-hidden rounded-3xl bg-card/10 backdrop-blur-sm border border-border/30"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
    >
      {/* Canvas Images */}
      {canvasImages.map((image) => (
        <div
          key={image.id}
          className={cn(
            'absolute rounded-2xl overflow-hidden transition-shadow duration-200',
            image.selected && 'ring-2 ring-primary shadow-[0_0_30px_rgba(139,92,246,0.4)]',
            draggedImageId === image.id ? 'cursor-move' : 'cursor-move'
          )}
          style={{
            left: image.x,
            top: image.y,
            width: image.width,
            height: image.height,
            userSelect: 'none',
          }}
          onMouseDown={(e) => handleImageMouseDown(e, image.id)}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={image.src}
            alt="Canvas image"
            className="w-full h-full object-cover pointer-events-none select-none"
            draggable={false}
          />
          
          {/* Controls when selected */}
          {image.selected && (
            <>
              {/* Move indicator */}
              <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 pointer-events-none">
                <Move className="w-3 h-3" />
                <span>Drag to move</span>
              </div>
              
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeCanvasImage(image.id);
                }}
                className="absolute top-2 right-2 bg-destructive/90 hover:bg-destructive text-destructive-foreground w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ))}

      {/* Drop overlay */}
      {isDragging && canvasImages.length < 2 && (
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="text-lg font-medium text-foreground">Drop to add image ({canvasImages.length}/2)</div>
        </div>
      )}
    </div>
  );
}
