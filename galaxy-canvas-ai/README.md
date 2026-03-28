# NebulaEdit - AI-Powered Image Editor 🌌

An image editing platform that combines traditional editing tools with state-of-the-art AI capabilities. Built with React, TypeScript, and powered by ComfyUI's graph-based inference engine for efficient AI model execution.

## 🎯 Overview

NebulaEdit is a web-based image editor that leverages ComfyUI as its AI backend to provide powerful image manipulation features. The application uses the **Qwen-Image-Edit-2509** model for single-image prompt-based editing and supports multiple advanced AI workflows including image fusion, relighting, upscaling, and brush-based AI editing (MagicQuill).

## 🤖 AI Features & Implementation

All AI features are implemented through **ComfyUI workflows**, providing a robust and efficient inference pipeline:

### Single Image Edit (Qwen-Image-Edit-2509)
- **Model**: Qwen-Image-Edit-2509 for natural language prompt-based image manipulation
- **Capabilities**: Transform images using descriptive text prompts (e.g., "make the sky sunset orange", "add snow to the scene")
- **Implementation**: Custom ComfyUI workflow that processes the image through the Qwen model with prompt conditioning

### Multi-Image Fusion
- Combines multiple input images with AI-guided composition
- Uses blending algorithms and neural networks to create seamless composites
- Supports style transfer and content preservation from multiple sources

### MagicQuill
- Brush-based AI editing interface where users paint regions and describe desired changes
- Real-time mask generation combined with prompt-conditioned inpainting
- Allows for precise, localized AI-powered modifications

### Relighting
- AI-powered scene relighting and lighting adjustments
- Manipulates light direction, intensity, and color temperature intelligently
- Preserves scene geometry while recalculating illumination

### Upscaling
- Enhances image resolution up to 8x using diffusion-based super-resolution
- Maintains and enhances details rather than simple interpolation
- Supports various upscaling models optimized for different content types

## 🔧 Why ComfyUI?

ComfyUI isn't just another Stable Diffusion interface—it's a **graph execution engine** designed from the ground up for efficient, flexible AI model orchestration. Here's what makes it uniquely powerful:

### Graph-Based Execution Engine
ComfyUI operates on a **Directed Acyclic Graph (DAG)** rather than linear scripts:
- **Topological Sort**: The engine flattens node graphs into optimized execution lists using algorithms similar to Kahn's algorithm, ensuring nodes execute only when all dependencies are satisfied
- **Dirty Signal Propagation**: Each node output gets a unique hash. On execution, only nodes with changed parameters or inputs are re-executed—unchanged nodes use cached results, dramatically improving performance
- **Lazy Evaluation**: Resources (like multi-gigabyte model weights) are loaded into VRAM only when downstream nodes explicitly require them

### Intelligent Memory Management
ComfyUI can run 24GB models on 8GB VRAM through sophisticated memory strategies:
- **Block-Level Offloading**: Models are split into individual blocks (input_blocks, middle_block, output_blocks). The engine tracks VRAM cost per block and evicts least-recently-used blocks to system RAM when needed
- **Pinned Memory**: Uses page-locked (non-pageable) system RAM, allowing GPU DMA to transfer weights at maximum PCIe bandwidth without CPU bottlenecks
- **Weight Streaming**: In extreme low-VRAM scenarios, streams weights layer-by-layer: load → compute → evict → repeat

### Non-Destructive Model Patching
The `ModelPatcher` system is ComfyUI's secret weapon for handling LoRAs and model modifications:
- **Zero-Copy LoRA Application**: LoRAs are never merged into base weights in memory. Instead, the patcher stores deltas and calculates `w_final = w_base + (lora_up @ lora_down * alpha)` on-the-fly during inference
- **Chain Multiple Modifications**: Apply 50+ LoRAs without duplicating the base model in VRAM
- **Format Compatibility**: Internal key-mapping translates between checkpoint formats (Diffusers, Original LDM, etc.) without physical conversion

### Performance Optimizations
- **fp8 Quantization**: Native support for 8-bit floating-point formats (e4m3fn/e5m2), cutting VRAM usage by ~50% with minimal precision loss
- **Dynamic Attention Selection**: Auto-detects hardware and selects optimal attention mechanism (xformers, PyTorch 2.0 SDPA, or split attention)
- **Latent Space Operations**: Most operations (resize, mask, composite) happen in compressed latent space (4×H/8×W/8) rather than pixel space (3×H×W), providing 64× less data to process

This architecture makes ComfyUI ideal for production web applications where efficiency, flexibility, and multi-model support are critical.

## �️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom galaxy theme
- **UI Components**: Radix UI primitives + shadcn/ui
- **State Management**: Zustand
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query (React Query)

### AI Backend
- **Inference Engine**: ComfyUI (graph-based execution)
- **Primary Model**: Qwen-Image-Edit-2509 for prompt-based editing
- **Additional Models**: Various diffusion models for fusion, relighting, and upscaling
- **Communication**: REST API + WebSocket for workflow execution

## �🚀 Getting Started

### Prerequisites
- **Node.js** 18+ or **Bun** (frontend)
- **ComfyUI** server with required models installed (AI features)
- Modern web browser with ES6+ support

### Frontend Setup

```sh
# Clone the repository
git clone https://github.com/Soham-Gaonkar/galaxy-canvas-ai.git
cd galaxy-canvas-ai

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:5173`

### ComfyUI Backend Setup

1. **Install ComfyUI**: Follow the [official installation guide](https://github.com/comfyanonymous/ComfyUI)

2. **Install Required Models**:
   - Qwen-Image-Edit-2509 checkpoint
   - VAE encoder/decoder
   - Additional models for fusion, relighting, upscaling as needed

3. **Start ComfyUI Server**:
   ```sh
   python main.py --listen 0.0.0.0 --port 8188
   ```

4. **Configure API Endpoint**:
   Create a `.env` file in the project root:
   ```env
   VITE_API_BASE=http://localhost:8188
   ```
   
   Or configure via the Settings page in the app UI.

### Workflow Installation

Place custom ComfyUI workflow JSON files in your ComfyUI workflows directory. The app will communicate with ComfyUI's API to execute these workflows programmatically.

## � Project Structure

```
src/
├── components/
│   ├── editor/          # Core editor UI (canvas, toolbars, panels)
│   ├── ai/              # AI feature forms and interfaces
│   ├── landing/         # Marketing/landing page sections
│   ├── layout/          # Navigation and layout components
│   └── ui/              # Reusable UI primitives (shadcn/ui)
├── pages/               # Route-level page components
├── store/               # Zustand state management
│   └── editorStore.ts   # Editor state, history, layers
├── lib/
│   ├── api.ts           # ComfyUI API client
│   └── utils.ts         # Helper functions
└── types/               # TypeScript definitions
    ├── editor.ts        # Editor-related types
    └── workflow.ts      # ComfyUI workflow types
```

## 🎨 Features

### Classic Editing Tools
- **Geometry**: Crop, rotate, flip, scale with real-time preview
- **Filters**: 10+ preset filters (Vibrant, Noir, Cinematic, Vintage, etc.)
- **Adjustments**: Exposure, brightness, contrast, saturation, temperature, sharpness
- **Drawing**: Brush, eraser, text overlay, shapes
- **History**: Undo/redo with 50-state memory
- **Export**: Multiple formats (PNG, JPG, WebP) with quality control

### User Interface
- **Responsive Design**: Mobile-first, adapts to tablet and desktop
- **Dark Galaxy Theme**: Futuristic cosmic aesthetic with nebula gradients
- **Glass Morphism**: Modern backdrop-blur UI panels
- **Touch Optimized**: Gesture controls for mobile devices

## 📝 API Reference

### ComfyUI Integration

The app communicates with ComfyUI via HTTP and WebSocket:

- **POST `/prompt`**: Submit workflow for execution
- **GET `/history/{prompt_id}`**: Retrieve execution results
- **WebSocket `/ws`**: Real-time execution progress updates
- **GET `/view`**: Fetch generated images

See `src/lib/api.ts` for implementation details.

## 🚧 Development

### Build for Production

```sh
npm run build
# or
bun run build
```

Output will be in the `dist/` directory.

### Type Checking

```sh
npm run type-check
# or
bun run type-check
```

### Linting

```sh
npm run lint
# or
bun run lint
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or feedback, please open an issue on GitHub.


