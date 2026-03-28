export type WorkflowType =
    | 'SUPIR_UPSCALE'
    | 'SINGLE_EDIT'
    | 'RELIGHT'
    | 'COMPOSITION'
    | 'MAGIC_QUILL';

export interface WorkflowOptions {
    stripMetadata?: boolean;
    c2pa?: boolean;
}

// 1. SUPIR Upscale
export interface SupirUpscaleInputs {
    image: string; // Base64
    positivePrompt: string;
    negativePrompt: string;
    seed: number;
    scaleBy: number;
}

// 2. Single Image Edit
export interface SingleEditInputs {
    image: string; // Base64
    prompt: string;
    seed: number;
    steps: number;
}

// 3. Re-Light
export interface RelightInputs {
    image: string; // Base64
    prompt: string;
    seed: number;
}

// 4. Multi-Image Composition
export interface CompositionInputs {
    targetImage: string; // Base64 (Background)
    referenceImage: string; // Base64 (Subject)
    prompt: string;
    seed: number;
}

// 5. MagicQuill
export interface MagicQuillInputs {
    originalImage: string; // Base64
    mask: string; // Base64
    colorStrokes?: string; // Base64 (Optional)
    addEdgeStrokes?: string; // Base64 (Optional)
    removeEdgeStrokes?: string; // Base64 (Optional)
    prompt: string;
    seed: number;
    strength: number;
}

// Union type for all inputs
export type WorkflowInputs =
    | SupirUpscaleInputs
    | SingleEditInputs
    | RelightInputs
    | CompositionInputs
    | MagicQuillInputs;

// Main Request Interface
export interface WorkflowRequest<T extends WorkflowInputs = WorkflowInputs> {
    workflow: WorkflowType;
    inputs: T;
    options?: WorkflowOptions;
}

// Response Interface
export interface WorkflowResponse {
    success: boolean;
    data?: {
        image: string; // Base64
    };
    error?: string;
}
