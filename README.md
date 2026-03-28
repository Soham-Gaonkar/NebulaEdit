
# NebulaEdit

**Adobe TechMeet Submission – AI Image Editing & Generation**

This repository contains our solution for the Adobe TechMeet challenge: a dual-component system delivering professional-grade AI image editing and generation tools on the web.

---

## Table of Contents

- [NebulaEdit](#nebulaedit)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Wireframes \& Design Rationale](#wireframes--design-rationale)
  - [Market Research](#market-research)
  - [Demo Video](#demo-video)
  - [Execution Overview](#execution-overview)
  - [Components](#components)
  - [Setup Instructions](#setup-instructions)

---

## Overview
NebulaEdit is designed with a decoupled architecture: a fast, interactive frontend and a robust backend for heavy AI inference. The system hides the complexity of ComfyUI nodes behind a familiar, layer-based editing interface.

---

## Wireframes & Design Rationale
- [**View Wireframes**](./Wireframes-UI/)
- [**Design Rationale**](./Design-Rationale.pdf)

## Market Research
Our research highlights that most existing tools trade off control for simplicity. NebulaEdit targets creators who need precise, localized edits (e.g., relighting, element fusion) rather than generic image generation.
- [**Market Research Report**](./Market-Research.pdf)
- [**Demo Video: Market Research & Features**](./Demo.mp4)

## Demo Video
- [**Watch the Demo**](./Demo.mp4)

## Execution Overview
For a detailed look at the system architecture and execution pipeline, see:
- [**Execution Overview & Pipeline**](./Execution-overview.md)

---

## Components

- [**`galaxy-canvas-ai/`**](./galaxy-canvas-ai/): React + Vite frontend. Provides the canvas, toolbars, and interaction logic for features like MagicQuill and Image Fusion.
- [**`nebula-server/`**](./nebula-server/): Python/FastAPI backend. Bridges to ComfyUI, managing complex node workflows for AI features (Qwen-Image-Edit, Relighting, etc.).
- [**`setup.sh`**](./setup.sh): Deployment script for the server. Installs ComfyUI, Python venv, and fetches all required model weights from Hugging Face.

---

## Setup Instructions
See [setup_instructions.md](./setup_instructions.md) for detailed setup and deployment steps.