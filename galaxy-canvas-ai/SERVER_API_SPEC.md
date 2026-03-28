# Server API Specification

**Endpoint**: `POST /api/workflow`
**Content-Type**: `application/json`

The server must accept a JSON body matching the `WorkflowRequest` interface and return a `WorkflowResponse`.

## Request Structure

```json
{
  "workflow": "SUPIR_UPSCALE" | "SINGLE_EDIT" | "RELIGHT" | "COMPOSITION" | "MAGIC_QUILL",
  "inputs": { ... }, // Varies by workflow
  "options": {
    "stripMetadata": boolean, // Optional
    "c2pa": boolean           // Optional
  }
}
```

## Response Structure

**Success**:
```json
{
  "success": true,
  "data": {
    "image": "data:image/png;base64,..." // Base64 encoded image string
  }
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Workflow Inputs

### 1. SUPIR_UPSCALE
```json
{
  "workflow": "SUPIR_UPSCALE",
  "inputs": {
    "image": "base64_string",
    "positivePrompt": "string",
    "negativePrompt": "string",
    "seed": number,
    "scaleBy": number
  }
}
```

### 2. SINGLE_EDIT
```json
{
  "workflow": "SINGLE_EDIT",
  "inputs": {
    "image": "base64_string",
    "prompt": "string",
    "seed": number,
    "steps": number
  }
}
```

### 3. RELIGHT
```json
{
  "workflow": "RELIGHT",
  "inputs": {
    "image": "base64_string",
    "prompt": "string",
    "seed": number
  }
}
```

### 4. COMPOSITION
```json
{
  "workflow": "COMPOSITION",
  "inputs": {
    "targetImage": "base64_string", // Background
    "referenceImage": "base64_string", // Subject
    "prompt": "string",
    "seed": number
  }
}
```

### 5. MAGIC_QUILL
```json
{
  "workflow": "MAGIC_QUILL",
  "inputs": {
    "originalImage": "base64_string",
    "mask": "base64_string",
    "colorStrokes": "base64_string", // Optional
    "addEdgeStrokes": "base64_string", // Optional
    "removeEdgeStrokes": "base64_string", // Optional
    "prompt": "string",
    "seed": number,
    "strength": number
  }
}
```
