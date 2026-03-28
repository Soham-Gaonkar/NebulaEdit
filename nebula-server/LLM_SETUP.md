# LLM Integration Setup Guide

This guide explains how to set up and use the Phi-3-mini LLM integration for safety checks and prompt improvement.

## Features

1. **Safety Check**: Automatically checks all prompts for explicit, nudity, or inappropriate content before processing workflows
2. **Prompt Improvement**: Allows users to enhance their prompts with AI assistance via a button click

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
pip install -r requirements.txt
```

This will install:
- `torch` - PyTorch for running the model
- `transformers` - Hugging Face transformers library
- `accelerate` - For faster model loading
- `sentencepiece` - Required for tokenization

### 2. Download Model (First Run)

The model will be automatically downloaded on first use from Hugging Face:
- Model: `microsoft/Phi-3-mini-4k-instruct`
- Size: ~7.6 GB
- Location: `~/.cache/huggingface/hub/`

**Note**: The first request will take a few minutes while the model downloads. Subsequent requests will be much faster.

### 3. Configuration

Edit `app/config.py` or set environment variables:

```bash
# Optional: Use a different model
export LLM_MODEL_NAME="microsoft/Phi-3-mini-4k-instruct"

# Optional: Disable safety checks (not recommended)
export ENABLE_SAFETY_CHECK="false"
```

### 4. Hardware Requirements

**Recommended**:
- GPU with 8GB+ VRAM (CUDA support)
- 16GB+ RAM

**Minimum**:
- CPU-only mode (slower)
- 12GB+ RAM

The service automatically detects if CUDA is available and uses GPU if present.

## Usage

### Safety Checks (Automatic)

Safety checks run automatically for all workflows that include prompts:
- `SINGLE_EDIT` - checks the `prompt` field
- `COMPOSITION` - checks the `prompt` field
- `SUPIR_UPSCALE` - checks the `positivePrompt` field
- `MAGIC_QUILL` - checks the `positivePrompt` field

If unsafe content is detected:
```json
{
  "success": false,
  "error": "Content safety check failed: Prompt contains explicit content. Please modify your prompt."
}
```

### Prompt Improvement (Manual)

The prompt improvement feature refines user prompts by fixing grammar, improving clarity, and using better vocabulary - **without adding hallucinated details**.

#### Frontend Usage

In the UI forms (PromptEditForm and ImageFusionForm), users can click the "Improve" button next to the prompt field to enhance their prompt.

#### Examples

| Original | Improved |
|----------|----------|
| "make sky more blue" | "Make the sky more blue" |
| "add cat to image sitting" | "Add a cat sitting in the image" |
| "change lighting to warm and make it sunset vibes" | "Change the lighting to warm tones with a sunset atmosphere" |
| "remove background and put subject on white" | "Remove the background and place the subject on a white background" |
| "make her dress red color and add flowers" | "Change her dress to red and add flowers" |

**Note**: The improvement focuses on proper grammar, structure, and clarity - it does NOT add new visual elements or details that weren't in the original prompt.

#### API Endpoint

```bash
POST /api/improve-prompt
Content-Type: application/json

{
  "prompt": "make the sky nicer"
}
```

Response:
```json
{
  "original": "make the sky nicer",
  "improved": "Make the sky look nicer"
}
```

## Performance Notes

### First Request
- **CPU**: 30-60 seconds (model loading + inference)
- **GPU**: 10-20 seconds (model loading + inference)

### Subsequent Requests
- **CPU**: 5-10 seconds per prompt
- **GPU**: 1-2 seconds per prompt

### Memory Usage
- Model loaded in memory: ~7.6 GB (GPU) or ~14 GB (CPU)
- Model stays loaded for the lifetime of the server process

## Troubleshooting

### Issue: Model download fails
**Solution**: Check internet connection and disk space (~8GB needed)

### Issue: Out of memory errors
**Solution**: 
- Close other applications
- Use CPU mode if GPU memory is insufficient
- Reduce `max_new_tokens` in `llm_service.py`

### Issue: Slow inference
**Solution**:
- Ensure CUDA is properly installed for GPU support
- Check if GPU is being used: Look for "LLM Service will use device: cuda" in logs
- Consider using a smaller model for faster inference

### Issue: Import errors
**Solution**:
```bash
pip install --upgrade transformers torch accelerate
```

## Customization

### Adjust Safety Prompts

Edit `llm_service.py` in the `check_safety()` method to customize safety detection behavior.

### Change Improvement Style

Edit `llm_service.py` in the `improve_prompt()` method to change how prompts are enhanced.

Current behavior: Improves grammar, clarity, and structure without adding new details.

To make it add creative details instead, modify the system prompt in the method to request additional visual descriptions.

### Use Different Model

Set the environment variable:
```bash
export LLM_MODEL_NAME="microsoft/Phi-3-small-8k-instruct"
```

Or edit `app/config.py` directly.

## API Documentation

### POST /api/workflow
Existing endpoint now includes automatic safety checks.

### POST /api/improve-prompt
New endpoint for prompt improvement.

**Request Body**:
```typescript
{
  prompt: string
}
```

**Response**:
```typescript
{
  original: string,
  improved: string
}
```

**Status Codes**:
- `200` - Success
- `500` - Server error (check logs)
