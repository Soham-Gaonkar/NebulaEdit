from enum import Enum
from typing import Optional, Union, Literal
from pydantic import BaseModel, Field, AliasChoices

# --- Input Models ---

class SupirUpscaleInputs(BaseModel):
    image: str = Field(..., description="Base64 encoded image string")
    positivePrompt: Optional[str] = None
    negativePrompt: Optional[str] = None
    seed: Optional[int] = None
    scaleBy: Optional[float] = None

class SingleEditInputs(BaseModel):
    image: str = Field(..., description="Base64 encoded image string")
    prompt: Optional[str] = None
    seed: Optional[int] = None
    steps: Optional[int] = None

class RelightInputs(BaseModel):
    image: str = Field(..., description="Base64 encoded image string")
    prompt: Optional[str] = None
    seed: Optional[int] = None

class CompositionInputs(BaseModel):
    targetImage: str = Field(..., description="Base64 encoded background image")
    referenceImage: str = Field(..., description="Base64 encoded subject image")
    prompt: Optional[str] = None
    seed: Optional[int] = None

class MagicQuillInputs(BaseModel):
    originalImage: str = Field(..., description="Base64 encoded original image or local file path")
    maskImage: Optional[str] = Field(
        None,
        description="Base64 encoded mask or scribble image",
        alias=AliasChoices("maskImage", "mask")
    )
    addColorImage: Optional[str] = Field(
        None,
        description="Base64 encoded color strokes (RGB)",
        alias=AliasChoices("addColorImage", "colorStrokes")
    )
    addEdgeImage: Optional[str] = Field(
        None,
        description="Base64 encoded add-edge strokes",
        alias=AliasChoices("addEdgeImage", "addEdgeStrokes")
    )
    removeEdgeImage: Optional[str] = Field(
        None,
        description="Base64 encoded remove-edge strokes",
        alias=AliasChoices("removeEdgeImage", "removeEdgeStrokes")
    )
    positivePrompt: Optional[str] = Field(
        None,
        description="Positive text prompt",
        alias=AliasChoices("positivePrompt", "prompt")
    )
    negativePrompt: Optional[str] = None
    seed: Optional[int] = None
    steps: Optional[int] = None
    cfg: Optional[float] = None
    edgeStrength: Optional[float] = None
    colorStrength: Optional[float] = None
    inpaintStrength: Optional[float] = Field(
        None,
        description="Override for MagicQuill inpaint strength",
        alias=AliasChoices("inpaintStrength", "strength")
    )

    class Config:
        populate_by_name = True

# --- Request Models ---

class SupirUpscaleRequest(BaseModel):
    workflow: Literal["SUPIR_UPSCALE"]
    inputs: SupirUpscaleInputs
    options: Optional[dict] = None

class SingleEditRequest(BaseModel):
    workflow: Literal["SINGLE_EDIT"]
    inputs: SingleEditInputs
    options: Optional[dict] = None

class RelightRequest(BaseModel):
    workflow: Literal["RELIGHT"]
    inputs: RelightInputs
    options: Optional[dict] = None

class CompositionRequest(BaseModel):
    workflow: Literal["COMPOSITION"]
    inputs: CompositionInputs
    options: Optional[dict] = None

class MagicQuillRequest(BaseModel):
    workflow: Literal["MAGIC_QUILL"]
    inputs: MagicQuillInputs
    options: Optional[dict] = None

WorkflowRequest = Union[
    SupirUpscaleRequest,
    SingleEditRequest,
    RelightRequest,
    CompositionRequest,
    MagicQuillRequest
]

# --- Response Models ---

class WorkflowResponseData(BaseModel):
    image: str = Field(..., description="Base64 encoded result image")

class WorkflowResponse(BaseModel):
    success: bool
    data: Optional[WorkflowResponseData] = None
    error: Optional[str] = None
