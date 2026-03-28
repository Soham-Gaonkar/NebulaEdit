# Nebula Server

Nebula Server is a FastAPI-based backend service that powers the Galaxy Canvas AI application. It acts as an orchestration layer between the frontend and various AI services, including ComfyUI for image generation and local LLMs for prompt enhancement and safety checks.

## Features

- **Workflow Orchestration**: Manages complex AI workflows (Text-to-Image, Image-to-Image, Inpainting, etc.) by communicating with ComfyUI instances.
- **Prompt Engineering**: Uses a local LLM (Microsoft Phi-3) to improve user prompts for better generation results.
- **Safety Checks**: Implements content safety checks on prompts using a local LLM to ensure appropriate usage.
- **Multi-Backend Support**: Capable of routing requests to different ComfyUI backends based on the workflow type (e.g., dedicated backend for Magic Quill).
- **Real-time Communication**: Uses WebSockets to stream workflow progress and status updates back to the client.

## Prerequisites

- Python 3.10+
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) running and accessible.
- CUDA-capable GPU (recommended for local LLM inference).

## Installation

1. **Clone the repository** (if you haven't already):

    ```bash
    git clone <repository-url>
    cd nebula-server
    ```

2. **Create a virtual environment**:

    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # Linux/macOS
    source venv/bin/activate
    ```

3. **Install dependencies**:

    ```bash
    pip install -r requirements.txt
    ```

## Configuration

The server can be configured using environment variables. You can set these in your environment or create a `.env` file (if you add `python-dotenv` support, otherwise set them in your shell).

| Variable | Description | Default |
| :--- | :--- | :--- |
| `BACKEND_URL_MAIN` | URL of the main ComfyUI instance | `http://69.19.137.247:8188` |
| `BACKEND_URL_MAGIC_QUILL` | URL of the Magic Quill ComfyUI instance | `http://69.19.136.174:8188` |
| `LLM_MODEL_NAME` | HuggingFace model ID for the local LLM | `microsoft/Phi-3-mini-4k-instruct` |
| `ENABLE_SAFETY_CHECK` | Enable/Disable prompt safety checks | `true` |

## Running the Server

Start the server using `uvicorn`:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.

## API Endpoints

### Health Check

- **GET** `/health`
  - Returns the status of the server.

### Workflow

- **POST** `/api/workflow`
  - Executes a specific AI workflow.
  - **Body**: `WorkflowRequest` (contains workflow ID and inputs).

### Prompt Utilities

- **POST** `/api/improve-prompt`
  - Enhances a given prompt using the local LLM.
  - **Body**: `PromptImproveRequest` (contains the raw prompt).

## Project Structure

```text
nebula-server/
├── app/
│   ├── routers/        # API route definitions
│   ├── services/       # Business logic (ComfyUI client, LLM service)
│   ├── config.py       # Application configuration
│   ├── main.py         # Application entry point
│   └── models.py       # Pydantic data models
├── workflows/          # JSON definitions of ComfyUI workflows
├── requirements.txt    # Python dependencies
└── README.md           # Project documentation
```
