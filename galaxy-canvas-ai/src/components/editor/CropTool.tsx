import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';

interface CropToolProps {
  imageUrl: string;
  onComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function CropTool({ imageUrl, onComplete, onCancel }: CropToolProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const [cropArea, setCropArea] = useState<CropArea>({
    x: 50,
    y: 50,
    width: 300,
    height: 300,
  });

  const { saveToHistory } = useEditorStore();

  // ----------------------------
  // Pointer Down Handler
  // ----------------------------
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, type: 'move' | 'resize', handle?: string) => {
      e.preventDefault();
      e.stopPropagation();

      // Capture pointer for mobile continuous drag
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      if (type === 'move') {
        isDraggingRef.current = true;
      } else if (type === 'resize' && handle) {
        isResizingRef.current = handle;
      }

      dragStartRef.current = { x: e.clientX, y: e.clientY };
    },
    []
  );

  // ----------------------------
  // Global move/up listeners
  // ----------------------------
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current && !isResizingRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      if (isDraggingRef.current) {
        setCropArea(prev => {
          const containerWidth = containerRef.current?.clientWidth || 1000;
          const containerHeight = containerRef.current?.clientHeight || 1000;

          return {
            ...prev,
            x: Math.max(0, Math.min(prev.x + deltaX, containerWidth - prev.width)),
            y: Math.max(0, Math.min(prev.y + deltaY, containerHeight - prev.height)),
          };
        });

        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }

      else if (isResizingRef.current) {
        setCropArea(prev => {
          const newArea = { ...prev };
          const containerWidth = containerRef.current?.clientWidth || 1000;
          const containerHeight = containerRef.current?.clientHeight || 1000;

          switch (isResizingRef.current) {
            case 'nw':
              newArea.x += deltaX;
              newArea.y += deltaY;
              newArea.width -= deltaX;
              newArea.height -= deltaY;
              break;
            case 'ne':
              newArea.y += deltaY;
              newArea.width += deltaX;
              newArea.height -= deltaY;
              break;
            case 'sw':
              newArea.x += deltaX;
              newArea.width -= deltaX;
              newArea.height += deltaY;
              break;
            case 'se':
              newArea.width += deltaX;
              newArea.height += deltaY;
              break;
            case 'n':
              newArea.y += deltaY;
              newArea.height -= deltaY;
              break;
            case 's':
              newArea.height += deltaY;
              break;
            case 'w':
              newArea.x += deltaX;
              newArea.width -= deltaX;
              break;
            case 'e':
              newArea.width += deltaX;
              break;
          }

          // Constrain to bounds
          newArea.x = Math.max(0, newArea.x);
          newArea.y = Math.max(0, newArea.y);
          newArea.width = Math.max(50, Math.min(newArea.width, containerWidth - newArea.x));
          newArea.height = Math.max(50, Math.min(newArea.height, containerHeight - newArea.y));

          return newArea;
        });

        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  // ----------------------------
  // Apply Crop
  // ----------------------------
  const applyCrop = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      const container = containerRef.current;
      if (!container) return;

      const scaleX = img.width / container.clientWidth;
      const scaleY = img.height / container.clientHeight;

      const actualCrop = {
        x: cropArea.x * scaleX,
        y: cropArea.y * scaleY,
        width: cropArea.width * scaleX,
        height: cropArea.height * scaleY,
      };

      canvas.width = actualCrop.width;
      canvas.height = actualCrop.height;

      ctx.drawImage(
        img,
        actualCrop.x,
        actualCrop.y,
        actualCrop.width,
        actualCrop.height,
        0,
        0,
        actualCrop.width,
        actualCrop.height
      );

      const croppedImage = canvas.toDataURL('image/png');
      saveToHistory('Cropped image');
      onComplete(croppedImage);
    };
  }, [cropArea, imageUrl, onComplete, saveToHistory]);

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="font-display font-semibold text-foreground">Crop Image</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button variant="glow" size="sm" onClick={applyCrop}>
            <Check className="w-4 h-4 mr-2" />
            Apply
          </Button>
        </div>
      </div>

      {/* Crop Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div ref={containerRef} className="relative max-w-full max-h-full touch-none">
          <img
            src={imageUrl}
            alt="Crop preview"
            className="max-w-full max-h-[70vh] select-none"
            draggable={false}
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Crop rectangle */}
          <div
            className="absolute border-2 border-primary bg-transparent cursor-move"
            style={{
              left: cropArea.x,
              top: cropArea.y,
              width: cropArea.width,
              height: cropArea.height,
            }}
            onPointerDown={(e) => handlePointerDown(e, 'move')}
          >
            {/* Resize handles */}
            {['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].map((handle) => (
              <div
                key={handle}
                className={cn(
                  'absolute w-5 h-5 bg-primary rounded-full border-2 border-background',
                  handle === 'nw' && '-top-2.5 -left-2.5 cursor-nw-resize',
                  handle === 'ne' && '-top-2.5 -right-2.5 cursor-ne-resize',
                  handle === 'sw' && '-bottom-2.5 -left-2.5 cursor-sw-resize',
                  handle === 'se' && '-bottom-2.5 -right-2.5 cursor-se-resize',
                  handle === 'n' && '-top-2.5 left-1/2 -translate-x-1/2 cursor-n-resize',
                  handle === 's' && '-bottom-2.5 left-1/2 -translate-x-1/2 cursor-s-resize',
                  handle === 'w' && 'top-1/2 -translate-y-1/2 -left-2.5 cursor-w-resize',
                  handle === 'e' && 'top-1/2 -translate-y-1/2 -right-2.5 cursor-e-resize'
                )}
                onPointerDown={(e) => handlePointerDown(e, 'resize', handle)}
              />
            ))}

            {/* Grid */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-primary/30" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
