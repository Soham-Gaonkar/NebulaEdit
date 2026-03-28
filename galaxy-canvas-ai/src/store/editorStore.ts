import { create } from 'zustand';
import type { EditorState, Layer, ImageAdjustments, EditorTool, HistoryState, CanvasImage } from '@/types/editor';

const defaultAdjustments: ImageAdjustments = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  sharpness: 0,
};

interface EditorStore extends EditorState {
  // Tool state
  selectedColor: string;
  brushSize: number;

  // Image actions
  setImage: (image: string | null, action?: string | null) => void;
  addCanvasImage: (image: string) => void;
  removeCanvasImage: (id: string) => void;
  updateCanvasImage: (id: string, updates: Partial<CanvasImage>) => void;
  selectCanvasImage: (id: string) => void;

  // Second image actions (isolated)
  setSecondImage: (image: string | null) => void;
  removeSecondImage: () => void;

  // Layer actions
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  reorderLayers: (layers: Layer[]) => void;

  // Adjustment actions
  setAdjustment: (key: keyof ImageAdjustments, value: number) => void;
  resetAdjustments: () => void;
  applyFilter: (adjustments: Partial<ImageAdjustments>) => void;

  // Tool actions
  setTool: (tool: EditorTool) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;

  // Transform actions
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
  setFlipH: (flip: boolean) => void;
  setFlipV: (flip: boolean) => void;

  // History actions
  saveToHistory: (action: string) => void;
  undo: () => void;
  redo: () => void;

  // Reset
  resetEditor: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useEditorStore = create<EditorStore>((set, get) => ({
  currentImage: null,
  secondImage: null,
  canvasImages: [],
  layers: [],
  adjustments: defaultAdjustments,
  selectedTool: 'select',
  selectedColor: '#ffffff',
  brushSize: 5,
  history: [],
  historyIndex: -1,
  zoom: 1,
  rotation: 0,
  flipH: false,
  flipV: false,

  setImage: (image, action) => {
    set({ currentImage: image });
    if (image && action !== null) {
      const label = action ?? 'Image updated';
      get().saveToHistory(label);
    }
  },

  addCanvasImage: (image: string) => {
    const currentCanvasImages = get().canvasImages;
    if (currentCanvasImages.length >= 2) return; // Max 2 images

    // Create image element to get natural dimensions
    const img = new Image();
    img.onload = () => {
      // Re-check the current state when image loads
      const { canvasImages } = get();
      if (canvasImages.length >= 2) return;

      const maxWidth = 400;
      const maxHeight = 400;
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      // Scale down if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      const newImage: CanvasImage = {
        id: generateId(),
        src: image,
        x: 50 + canvasImages.length * 60,
        y: 50 + canvasImages.length * 60,
        width: Math.round(width),
        height: Math.round(height),
        selected: true,
      };

      // Deselect other images and add the new one
      const updatedImages = canvasImages.map(img => ({ ...img, selected: false }));
      set({ canvasImages: [...updatedImages, newImage] });
      get().saveToHistory('Added image to canvas');
    };
    img.src = image;
  },

  removeCanvasImage: (id: string) => {
    set((state) => ({
      canvasImages: state.canvasImages.filter((img) => img.id !== id),
    }));
    get().saveToHistory('Removed image from canvas');
  },

  updateCanvasImage: (id: string, updates: Partial<CanvasImage>) => {
    set((state) => ({
      canvasImages: state.canvasImages.map((img) =>
        img.id === id ? { ...img, ...updates } : img
      ),
    }));
  },

  selectCanvasImage: (id: string) => {
    set((state) => ({
      canvasImages: state.canvasImages.map((img) => ({
        ...img,
        selected: img.id === id,
      })),
    }));
  },

  addLayer: (layer) => {
    set((state) => ({
      layers: [...state.layers, layer],
    }));
    get().saveToHistory(`Added layer: ${layer.name}`);
  },

  updateLayer: (id, updates) => {
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    }));
  },

  deleteLayer: (id) => {
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
    }));
    get().saveToHistory('Deleted layer');
  },

  reorderLayers: (layers) => {
    set({ layers });
  },

  setAdjustment: (key, value) => {
    set((state) => ({
      adjustments: { ...state.adjustments, [key]: value },
    }));
  },

  resetAdjustments: () => {
    set({ adjustments: defaultAdjustments });
    get().saveToHistory('Reset adjustments');
  },

  applyFilter: (filterAdjustments) => {
    set((state) => ({
      adjustments: { ...state.adjustments, ...filterAdjustments },
    }));
    get().saveToHistory('Applied filter');
  },

  setTool: (tool) => {
    set({ selectedTool: tool });
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.1, Math.min(5, zoom)) });
  },

  setRotation: (rotation) => {
    set({ rotation: rotation % 360 });
    get().saveToHistory('Rotated image');
  },

  setFlipH: (flip) => {
    set({ flipH: flip });
    get().saveToHistory('Flipped horizontal');
  },

  setFlipV: (flip) => {
    set({ flipV: flip });
    get().saveToHistory('Flipped vertical');
  },

  setColor: (color: string) => {
    set({ selectedColor: color });
  },

  setBrushSize: (size: number) => {
    set({ brushSize: size });
  },

  setSecondImage: (image: string | null) => {
    set({ secondImage: image });
    if (image) get().saveToHistory('Added secondary image');
  },

  removeSecondImage: () => {
    set({ secondImage: null });
    get().saveToHistory('Removed secondary image');
  },

  saveToHistory: (action) => {
    const { layers, adjustments, history, historyIndex, currentImage, secondImage, canvasImages, rotation, flipH, flipV, zoom } = get();
    const newState: HistoryState = {
      id: generateId(),
      timestamp: Date.now(),
      action,
      layers: JSON.parse(JSON.stringify(layers)),
      adjustments: { ...adjustments },
      image: currentImage,
      secondImage,
      canvasImages: JSON.parse(JSON.stringify(canvasImages)),
      rotation,
      flipH,
      flipV,
      zoom,
    };

    // Remove any future states if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);

    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      set({
        layers: JSON.parse(JSON.stringify(prevState.layers)),
        adjustments: { ...prevState.adjustments },
        currentImage: prevState.image,
        secondImage: prevState.secondImage || null,
        canvasImages: prevState.canvasImages ? JSON.parse(JSON.stringify(prevState.canvasImages)) : [],
        rotation: prevState.rotation,
        flipH: prevState.flipH,
        flipV: prevState.flipV,
        zoom: prevState.zoom,
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({
        layers: JSON.parse(JSON.stringify(nextState.layers)),
        adjustments: { ...nextState.adjustments },
        currentImage: nextState.image,
        secondImage: nextState.secondImage || null,
        canvasImages: nextState.canvasImages ? JSON.parse(JSON.stringify(nextState.canvasImages)) : [],
        rotation: nextState.rotation,
        flipH: nextState.flipH,
        flipV: nextState.flipV,
        zoom: nextState.zoom,
        historyIndex: historyIndex + 1,
      });
    }
  },

  resetEditor: () => {
    set({
      currentImage: null,
      secondImage: null,
      canvasImages: [],
      layers: [],
      adjustments: defaultAdjustments,
      selectedTool: 'select',
      history: [],
      historyIndex: -1,
      zoom: 1,
      rotation: 0,
      flipH: false,
      flipV: false,
    });
  },
}));
