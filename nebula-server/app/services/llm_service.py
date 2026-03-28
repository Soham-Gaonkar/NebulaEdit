import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from typing import Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self, model_name: str = "microsoft/Phi-3-mini-4k-instruct"):
        """Initialize the Phi-3-mini model for local inference."""
        self.model_name = model_name
        self.model = None
        self.tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"LLM Service will use device: {self.device}")
        
    def load_model(self):
        """Load the model and tokenizer lazily on first use."""
        if self.model is None:
            logger.info(f"Loading {self.model_name}...")
            try:
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.model_name,
                    trust_remote_code=True
                )
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_name,
                    torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                    device_map="auto" if self.device == "cuda" else None,
                    trust_remote_code=True
                )
                if self.device == "cpu":
                    self.model = self.model.to(self.device)
                self.model.eval()
                logger.info("Model loaded successfully!")
            except Exception as e:
                logger.error(f"Error loading model: {e}")
                raise
    
    def _generate_response(self, prompt: str, max_new_tokens: int = 256) -> str:
        """Generate a response from the model and return ONLY the new text.

        We decode only the tokens generated after the prompt to avoid
        echoing back the full instructions + examples.
        """
        self.load_model()

        messages = [
            {"role": "user", "content": prompt}
        ]

        try:
            # Format the prompt using the chat template
            formatted_prompt = self.tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )

            inputs = self.tokenizer(formatted_prompt, return_tensors="pt").to(self.device)

            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    do_sample=False,
                    pad_token_id=self.tokenizer.eos_token_id,
                    use_cache=False  # Disable cache to avoid DynamicCache issues
                )

            # Only keep newly generated tokens (after the input prompt)
            generated_tokens = outputs[0][inputs["input_ids"].shape[-1]:]
            response = self.tokenizer.decode(generated_tokens, skip_special_tokens=True)

            return response.strip()
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            raise
    
    def check_safety(self, prompt: str) -> Tuple[bool, str, str]:
        """
        Check if a prompt contains explicit or nudity content.
        
        Returns:
            Tuple[bool, str, str]: (is_safe, reason, category)
            - is_safe: True if prompt is safe, False if unsafe
            - reason: Explanation of the decision
            - category: "safe", "explicit", "nudity", or "inappropriate"
        """
        safety_prompt = f"""Analyze the following prompt for explicit content, nudity, or inappropriate sexual content.

Prompt: "{prompt}"

Answer ONLY with one of these exact responses:
- "SAFE" if the prompt is appropriate and contains no explicit/nudity content
- "UNSAFE: NUDITY" if it requests nude or sexual content
- "UNSAFE: EXPLICIT" if it contains explicit sexual language
- "UNSAFE: INAPPROPRIATE" if it's otherwise inappropriate

Your response (one line only):"""

        try:
            response = self._generate_response(safety_prompt, max_new_tokens=50)
            response_lower = response.lower()
            
            # Parse the response
            if "unsafe" in response_lower:
                if "nudity" in response_lower:
                    return False, "Prompt contains nudity-related content", "nudity"
                elif "explicit" in response_lower:
                    return False, "Prompt contains explicit content", "explicit"
                else:
                    return False, "Prompt contains inappropriate content", "inappropriate"
            else:
                return True, "Prompt is safe", "safe"
                
        except Exception as e:
            logger.error(f"Error in safety check: {e}")
            # Fail-safe: allow the prompt but log the error
            return True, f"Safety check failed, allowing by default: {str(e)}", "error"
    
    def improve_prompt(self, original_prompt: str) -> str:
        """
        Improve a prompt by refining the writing without adding hallucinated details.
        
        Args:
            original_prompt: The original user prompt
            
        Returns:
            str: An improved, better-written prompt
        """
        improvement_prompt = f"""You are a writing assistant. Improve image editing prompts to be clear, complete sentences with proper grammar. Keep the same meaning and visual elements.

Examples:
Input: "make sky more blue"
Output: Make the sky more vibrant and blue

Input: "pink shoes"
Output: Change the shoes to pink color

Input: "add cat to image sitting"
Output: Add a sitting cat to the image

Input: "change lighting to warm and make it sunset vibes"
Output: Change the lighting to warm tones with a sunset atmosphere

Input: "remove background put subject on white"
Output: Remove the background and place the subject on a white background

Input: "color of shoes to pink please"
Output: Change the color of the shoes to pink

Input: "darker contrast"
Output: Increase the contrast to make the image darker

Now improve this prompt following the same pattern. Make it a clear, grammatically correct sentence while keeping the exact same meaning:
Input: "{original_prompt}"
Output:"""

        try:
            logger.info(f"Improving prompt: '{original_prompt}'")
            improved = self._generate_response(improvement_prompt, max_new_tokens=150)
            logger.info(f"Raw improved response: '{improved}'")
            
            # Clean up the response - remove any meta-commentary
            improved = improved.strip()
            
            # Remove common prefixes
            prefixes_to_remove = [
                "improved prompt:",
                "here's an improved version:",
                "here is the improved prompt:",
                "improved version:",
                "output:",
            ]
            
            for prefix in prefixes_to_remove:
                if improved.lower().startswith(prefix):
                    improved = improved[len(prefix):].strip()
            
            # Remove quotes if present
            if improved.startswith('"') and improved.endswith('"'):
                improved = improved[1:-1]
            elif improved.startswith("'") and improved.endswith("'"):
                improved = improved[1:-1]
            
            # If the model just repeats the input, return original
            if improved.lower() == original_prompt.lower():
                logger.info("Model returned same text, keeping original")
                improved = original_prompt
            
            logger.info(f"Final improved prompt: '{improved}'")
            return improved if improved else original_prompt
            
        except Exception as e:
            logger.error(f"Error improving prompt: {e}", exc_info=True)
            return original_prompt  # Return original on error

# Global instance
llm_service = LLMService()
