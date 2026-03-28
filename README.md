# Team 58 - Adobe

**Task:** Adobe TechMeet - AI Image Editing & Generation

This repository contains our submission for the Adobe TechMeet challenge. We've built a dual-component system to bring professional-grade AI editing tools to the web.

## Task 1: Wireframe and Design Rationale

We chose a decoupled architecture to keep the UI snappy while the backend handles heavy inference. The goal was to hide the complexity of ComfyUI nodes behind a familiar, layer-based editing interface.

* [**View Wireframes**](./Wireframes-UI/)
* [**Design Rationale**](./Design-Rationale.pdf)

## Task 2: Market Research

Existing tools often sacrifice control for ease of use. Our solution targets creators who need specific, localized edits (like relighting a subject or fusing elements) rather than just random image generation.

* [**View Market Research**](./Market-Research.pdf)

## Task 3 : Implementation

* [**View Demo Video**](./Demo.mp4)

## Components

* [**`galaxy-canvas-ai/`**](./galaxy-canvas-ai/)
  The frontend interface built with React and Vite. It provides the canvas, toolbars, and interaction logic for features like MagicQuill and Image Fusion.

* [**`nebula-server/`**](./nebula-server/)
  The Python/FastAPI backend. It acts as a bridge to ComfyUI, managing the complex node workflows required for our AI features (Qwen-Image-Edit, Relighting, etc.).

* [**`setup.sh`**](./setup.sh)
  Deployment script for the server. It automates the installation of ComfyUI, Python venv, and fetches all required model weights from Hugging Face.

  Check `setup_instructions.md` for detailed setup steps.