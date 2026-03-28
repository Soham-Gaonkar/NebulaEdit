import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';

interface DrawingCanvasProps {
  imageUrl: string;
  width: number;
  height: number;
}

interface DrawingState {
  isDrawing: boolean;
  lastX: number;
  lastY: number;
}

export function DrawingCanvas({ imageUrl, width, height }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const hasStrokeRef = useRef(false);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    lastX: 0,
    lastY: 0,
  });
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const { selectedTool, setImage, selectedColor, brushSize } = useEditorStore();

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    // We no longer draw the background image here to avoid aspect ratio issues.
    // The canvas is now a transparent overlay.
    hasStrokeRef.current = false;
    clearCanvas();
  }, [clearCanvas, width, height]);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
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
    if (selectedTool !== 'draw' && selectedTool !== 'erase' && selectedTool !== 'brush' && selectedTool !== 'eraser' && selectedTool !== 'text') return;

    const point = getCanvasPoint(e);
    if (!point) return;

    setDrawingState({
      isDrawing: true,
      lastX: point.x,
      lastY: point.y,
    });
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingState.isDrawing) return;
    if (selectedTool !== 'draw' && selectedTool !== 'erase' && selectedTool !== 'brush' && selectedTool !== 'eraser' && selectedTool !== 'text') return;

    hasStrokeRef.current = true;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    ctx.beginPath();
    ctx.moveTo(drawingState.lastX, drawingState.lastY);
    ctx.lineTo(point.x, point.y);

    if (selectedTool === 'brush' || selectedTool === 'draw') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize;
    } else if (selectedTool === 'eraser' || selectedTool === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2; // Eraser is slightly larger
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    setDrawingState({
      isDrawing: true,
      lastX: point.x,
      lastY: point.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const point = getCanvasPoint(e);
    if (point) {
      setCursorPosition(point);
    }
    draw(e);
  };

  const saveDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokeRef.current) return;

    // Create a temporary canvas to merge the original image and the drawing
    const mergedCanvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      // Set canvas size to match the original image's natural size
      mergedCanvas.width = img.naturalWidth;
      mergedCanvas.height = img.naturalHeight;
      const ctx = mergedCanvas.getContext('2d');
      if (!ctx) return;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Draw the drawing canvas on top, scaled to fit
      ctx.drawImage(canvas, 0, 0, img.naturalWidth, img.naturalHeight);

      const mergedImage = mergedCanvas.toDataURL('image/png');
      const actionLabel = selectedTool === 'erase' || selectedTool === 'eraser'
        ? 'Erased stroke'
        : 'Brush stroke';

      setImage(mergedImage, actionLabel);
      clearCanvas();
      hasStrokeRef.current = false;
    };
  }, [clearCanvas, imageUrl, setImage, selectedTool]);

  const stopDrawing = () => {
    if (drawingState.isDrawing) {
      setDrawingState({ ...drawingState, isDrawing: false });
      saveDrawing();
    }
  };

  useEffect(() => {
    return () => {
      if (hasStrokeRef.current) {
        saveDrawing();
      }
    };
  }, [saveDrawing]);

  return (
    <div className="relative" style={{ width, height }}>
      {/* Background image canvas - REMOVED */}
      <canvas
        ref={imageCanvasRef}
        width={width}
        height={height}
        className="hidden" // Hide instead of remove to keep ref valid if needed, or just remove ref usage
      />

      {/* Drawing layer canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={cn(
          'absolute inset-0',
          (selectedTool === 'brush' || selectedTool === 'eraser' || selectedTool === 'draw' || selectedTool === 'erase') && 'cursor-none'
        )}
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent default drag behavior
          startDrawing(e);
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={() => {
          stopDrawing();
          setCursorPosition(null);
        }}
        onTouchStart={startDrawing}
        onTouchMove={handleMouseMove}
        onTouchEnd={stopDrawing}
      />

      {/* Brush Cursor */}
      {cursorPosition && (selectedTool === 'brush' || selectedTool === 'draw' || selectedTool === 'eraser' || selectedTool === 'erase') && (
        <div
          className="absolute pointer-events-none rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-50"
          style={{
            left: cursorPosition.x,
            top: cursorPosition.y,
            width: brushSize,
            height: brushSize,
            transform: 'translate(-50%, -50%)',
            borderColor: selectedTool === 'eraser' || selectedTool === 'erase' ? 'white' : selectedColor
          }}
        />
      )}
    </div>
  );
}
