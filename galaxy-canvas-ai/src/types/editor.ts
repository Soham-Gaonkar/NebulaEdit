// Editor state and types

export interface Layer {
  id: string;
  name: string;
  type: 'image' | 'text' | 'shape' | 'drawing';
  visible: boolean;
  locked: boolean;
  opacity: number;
  data: any;
}

export interface HistoryState {
  id: string;
  timestamp: number;
  action: string;
  layers: Layer[];
  adjustments: ImageAdjustments;
  image: string | null;
  // optional secondary image used for isolated AI merge workflows
  secondImage?: string | null;
  canvasImages?: CanvasImage[];
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  zoom: number;
}

export interface ImageAdjustments {
  exposure: number;
  brightness: number;
  contrast: number;
  saturation: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  sharpness: number;
}

export interface CanvasImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
}

export interface EditorState {
  currentImage: string | null;
  // isolated secondary image (not part of layers/canvas), used only for AI merge previews
  secondImage?: string | null;
  canvasImages: CanvasImage[];
  layers: Layer[];
  adjustments: ImageAdjustments;
  selectedTool: EditorTool;
  history: HistoryState[];
  historyIndex: number;
  zoom: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

export type EditorTool =
  | 'select'
  | 'crop'
  | 'rotate'
  | 'brush'
  | 'eraser'
  | 'draw'
  | 'erase'
  | 'text'
  | 'shape'
  | 'move'
  | 'zoom'
  | 'geometry'
  | 'filters'
  | 'adjustments'
  | 'ai';

export interface Filter {
  id: string;
  name: string;
  thumbnail: string;
  adjustments: Partial<ImageAdjustments>;
}

export interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  endpoint: string;
}

export interface ExportOptions {
  format: 'png' | 'jpg' | 'webp';
  quality: number;
  width?: number;
  height?: number;
}
