from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models import WorkflowRequest, WorkflowResponse
from app.services.workflow_service import workflow_service
from app.services.llm_service import llm_service
from app.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class PromptImproveRequest(BaseModel):
    prompt: str

class PromptImproveResponse(BaseModel):
    original: str
    improved: str

@router.post("/api/workflow", response_model=WorkflowResponse)
async def run_workflow(request: WorkflowRequest):
    try:
        # Extract prompt from the request based on workflow type
        prompt_to_check = None
        
        if hasattr(request.inputs, 'prompt') and request.inputs.prompt:
            prompt_to_check = request.inputs.prompt
        elif hasattr(request.inputs, 'positivePrompt') and request.inputs.positivePrompt:
            prompt_to_check = request.inputs.positivePrompt
        
        # Perform safety check if enabled and prompt exists
        if settings.ENABLE_SAFETY_CHECK and prompt_to_check:
            logger.info(f"Checking safety for prompt: {prompt_to_check[:50]}...")
            is_safe, reason, category = llm_service.check_safety(prompt_to_check)
            
            if not is_safe:
                logger.warning(f"Unsafe prompt detected: {reason}")
                return WorkflowResponse(
                    success=False, 
                    error=f"Content safety check failed: {reason}. Please modify your prompt."
                )
            
            logger.info(f"Safety check passed: {reason}")
        
        # Process the workflow
        return await workflow_service.process_workflow(request)
    except Exception as e:
        # Log the error
        logger.error(f"Error processing workflow: {e}")
        return WorkflowResponse(success=False, error=str(e))

@router.post("/api/improve-prompt", response_model=PromptImproveResponse)
async def improve_prompt(request: PromptImproveRequest):
    """Improve a user's prompt using the LLM."""
    try:
        logger.info(f"Improving prompt: {request.prompt[:50]}...")
        improved = llm_service.improve_prompt(request.prompt)
        logger.info(f"Improved prompt: {improved[:50]}...")
        
        return PromptImproveResponse(
            original=request.prompt,
            improved=improved
        )
    except Exception as e:
        logger.error(f"Error improving prompt: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to improve prompt: {str(e)}")
