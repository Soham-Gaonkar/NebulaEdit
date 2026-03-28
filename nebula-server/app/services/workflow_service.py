from app.models import WorkflowRequest, WorkflowResponse, WorkflowResponseData
from app.config import settings
import uuid
import logging
from pathlib import Path
import base64
import binascii
import io
from PIL import Image, UnidentifiedImageError, ImageOps

logger = logging.getLogger(__name__)

# Base directory of the server project (folder that contains the "workflows" directory)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKFLOWS_DIR = BASE_DIR / "workflows"

class WorkflowService:
    async def process_workflow(self, request: WorkflowRequest) -> WorkflowResponse:
        """
        Processes the incoming workflow request.
        """
        logger.info("Processing workflow '%s'", request.workflow)
        logger.debug("Inputs payload: %s", request.inputs)

        # Determine backend URL
        if request.workflow == "MAGIC_QUILL":
            backend_url = settings.BACKEND_URL_MAGIC_QUILL
        else:
            backend_url = settings.BACKEND_URL_MAIN
        
        logger.info("Routing workflow '%s' to backend %s", request.workflow, backend_url)

        if request.workflow == "SUPIR_UPSCALE":
            return await self.handle_supir_upscale(request, backend_url)
        elif request.workflow == "SINGLE_EDIT":
            return await self.handle_single_edit(request, backend_url)
        elif request.workflow == "COMPOSITION":
            return await self.handle_composition(request, backend_url)
        elif request.workflow == "MAGIC_QUILL":
            return await self.handle_magic_quill(request, backend_url)
        else:
            logger.warning("Unhandled workflow '%s' – echoing input payload", request.workflow)
            result_image = ""
            if hasattr(request.inputs, 'image'):
                result_image = request.inputs.image
            elif hasattr(request.inputs, 'targetImage'):
                result_image = request.inputs.targetImage
            elif hasattr(request.inputs, 'originalImage'):
                result_image = request.inputs.originalImage

            return WorkflowResponse(
                success=True,
                data=WorkflowResponseData(image=result_image)
            )

    def _decode_image(self, image_str: str) -> bytes:
        """Decodes an image provided either as base64 data URI/base64 string or as a filesystem path."""
        if not image_str:
            raise ValueError("Image input is empty")

        # print(image_str[:30])  # Debug print to check the beginning of the string

        # Handle explicit file scheme first
        if image_str.startswith("file://"):
            file_path = Path(image_str[7:])
            logger.debug("Decoding image from file URI %s", file_path)
            return self._read_local_image(file_path)

        candidate_path = Path(image_str).expanduser()
        if candidate_path.exists():
            logger.debug("Decoding image from filesystem path %s", candidate_path)
            return self._read_local_image(candidate_path)

        encoded = image_str
        if "," in image_str:
            _, encoded = image_str.split(",", 1)

        try:
            image_bytes = base64.b64decode(encoded, validate=True)
        except binascii.Error as exc:
            logger.error("Image input is neither base64 nor a valid path")
            raise ValueError("Image must be a valid base64 string or accessible file path") from exc

        self._validate_image_bytes(image_bytes)
        return image_bytes

    def _read_local_image(self, path: Path) -> bytes:
        try:
            data = path.read_bytes()
        except OSError as exc:
            raise ValueError(f"Failed to read image file '{path}'") from exc

        self._validate_image_bytes(data)
        return data

    def _validate_image_bytes(self, data: bytes) -> None:
        try:
            with Image.open(io.BytesIO(data)) as img:
                img.verify()
        except UnidentifiedImageError as exc:
            raise ValueError("Provided image data is not a recognizable image") from exc

    async def handle_supir_upscale(self, request: WorkflowRequest, backend_url: str) -> WorkflowResponse:
        import json
        import base64
        from app.services.comfy_client import ComfyUIClient
        
        client = ComfyUIClient(backend_url)
        
        # 1. Decode input image
        try:
            image_data = self._decode_image(request.inputs.image)
        except Exception as e:
            logger.exception("Failed to decode input image for SUPIR_UPSCALE")
            return WorkflowResponse(success=False, error=f"Invalid image data: {str(e)}")

        # 2. Upload image
        try:
            upload_resp = client.upload_image(image_data, filename=f"supir_input_{uuid.uuid4()}.png")
            filename = upload_resp["name"]
        except Exception as e:
            logger.exception("Failed to upload image to ComfyUI backend")
            return WorkflowResponse(success=False, error=f"Failed to upload image: {str(e)}")

        # 3. Load and modify workflow JSON
        workflow_path = WORKFLOWS_DIR / "SUPIR-upscale-next-diffusion.json"
        
        try:
            with open(workflow_path, "r", encoding="utf-8") as f:
                workflow = json.load(f)
            logger.info("Loaded SUPIR workflow template with %d nodes", len(workflow))
        except Exception as e:
            logger.exception("Failed to load SUPIR workflow template")
            return WorkflowResponse(success=False, error=f"Failed to load workflow template: {str(e)}")

        # Modify inputs
        # Node 2: Load Image
        workflow["2"]["inputs"]["image"] = filename
        logger.debug("Node 2 image set to uploaded filename %s", filename)
        
        # Node 9: Prompts
        if request.inputs.positivePrompt is not None:
            workflow["9"]["inputs"]["positive_prompt"] = request.inputs.positivePrompt
            logger.debug("Updated positive prompt override")
        if request.inputs.negativePrompt is not None:
            workflow["9"]["inputs"]["negative_prompt"] = request.inputs.negativePrompt
            logger.debug("Updated negative prompt override")
            
        # Node 7: Seed
        if request.inputs.seed is not None:
            workflow["7"]["inputs"]["seed"] = request.inputs.seed
            logger.debug("Seed set to %s", request.inputs.seed)
            
        # Node 105: Scale By
        if request.inputs.scaleBy is not None:
            workflow["105"]["inputs"]["scale_by"] = request.inputs.scaleBy
            logger.debug("Scale-by set to %s", request.inputs.scaleBy)

        # Add SaveImage node to capture output from Node 14 (Color Match)
        # We'll use ID "999" to avoid conflicts
        workflow["999"] = {
            "inputs": {
                "filename_prefix": "SUPIR_output",
                "images": ["14", 0]
            },
            "class_type": "SaveImage",
            "_meta": {
                "title": "Save Image"
            }
        }
        logger.debug("Injected SaveImage node 999 targeting node 14 output")

        # 4. Execute workflow via WebSocket
        try:
            logger.info("Executing SUPIR workflow via ComfyUI (output node 999)")
            images = await client.execute_workflow(workflow, "999")
            if not images:
                logger.warning("ComfyUI returned zero images for SUPIR workflow")
                return WorkflowResponse(success=False, error="No output images generated")
            
            output_image_data = images[0]
            logger.info("Received %d image(s) from ComfyUI for SUPIR workflow", len(images))
            
            # 5. Encode response
            b64_image = base64.b64encode(output_image_data).decode("utf-8")
            return WorkflowResponse(
                success=True,
                data=WorkflowResponseData(image=f"data:image/png;base64,{b64_image}")
            )
            
        except Exception as e:
            logger.exception("Error executing SUPIR workflow against ComfyUI")
            return WorkflowResponse(success=False, error=f"Error executing workflow: {str(e)}")

    async def handle_single_edit(self, request: WorkflowRequest, backend_url: str) -> WorkflowResponse:
        import json
        import base64
        from app.services.comfy_client import ComfyUIClient
        
        client = ComfyUIClient(backend_url)
        
        # 1. Decode input image
        try:
            image_data = self._decode_image(request.inputs.image)
        except Exception as e:
            return WorkflowResponse(success=False, error=f"Invalid image data: {str(e)}")

        # 2. Upload image
        try:
            upload_resp = client.upload_image(image_data, filename=f"single_edit_input_{uuid.uuid4()}.png")
            filename = upload_resp["name"]
        except Exception as e:
            return WorkflowResponse(success=False, error=f"Failed to upload image: {str(e)}")

        # 3. Load and modify workflow JSON
        workflow_path = WORKFLOWS_DIR / "Single-image.json"
        try:
            with open(workflow_path, "r", encoding="utf-8") as f:
                workflow = json.load(f)
        except Exception as e:
             return WorkflowResponse(success=False, error=f"Failed to load workflow template: {str(e)}")

        # Modify inputs
        # Node 78: Load Image
        workflow["78"]["inputs"]["image"] = filename
        
        # Node 76: Prompt
        if request.inputs.prompt is not None:
            workflow["76"]["inputs"]["prompt"] = request.inputs.prompt
            
        # Node 3: Seed and Steps
        if request.inputs.seed is not None:
            workflow["3"]["inputs"]["seed"] = request.inputs.seed
        if request.inputs.steps is not None:
            workflow["3"]["inputs"]["steps"] = request.inputs.steps

        # Node 60 is the SaveImage node. We can use it directly or add our own to be safe/consistent.
        # The user said "Result Node: 60 (SaveImage)".
        # Let's use our own "999" connected to the same input as Node 60 to ensure we capture it correctly
        # Node 60 inputs: images: ["8", 0]
        workflow["999"] = {
            "inputs": {
                "filename_prefix": "SingleEdit_output",
                "images": ["8", 0]
            },
            "class_type": "SaveImage",
            "_meta": {
                "title": "Save Image"
            }
        }

        # 4. Execute workflow via WebSocket
        try:
            images = await client.execute_workflow(workflow, "999")
            if not images:
                return WorkflowResponse(success=False, error="No output images generated")
            
            output_image_data = images[0]
            
            # 5. Encode response
            b64_image = base64.b64encode(output_image_data).decode("utf-8")
            return WorkflowResponse(
                success=True,
                data=WorkflowResponseData(image=f"data:image/png;base64,{b64_image}")
            )
            
        except Exception as e:
            return WorkflowResponse(success=False, error=f"Error executing workflow: {str(e)}")

    async def handle_composition(self, request: WorkflowRequest, backend_url: str) -> WorkflowResponse:
        import json
        import base64
        from app.services.comfy_client import ComfyUIClient
        
        client = ComfyUIClient(backend_url)
        
        # 1. Decode input images
        try:
            target_image_data = self._decode_image(request.inputs.targetImage)
            reference_image_data = self._decode_image(request.inputs.referenceImage)
        except Exception as e:
            return WorkflowResponse(success=False, error=f"Invalid image data: {str(e)}")

        # 2. Upload images
        try:
            target_resp = client.upload_image(target_image_data, filename=f"comp_target_{uuid.uuid4()}.png")
            target_filename = target_resp["name"]
            
            ref_resp = client.upload_image(reference_image_data, filename=f"comp_ref_{uuid.uuid4()}.png")
            ref_filename = ref_resp["name"]
        except Exception as e:
            return WorkflowResponse(success=False, error=f"Failed to upload images: {str(e)}")

        # 3. Load and modify workflow JSON
        workflow_path = WORKFLOWS_DIR / "Multi-image.json"
        try:
            with open(workflow_path, "r", encoding="utf-8") as f:
                workflow = json.load(f)
        except Exception as e:
             return WorkflowResponse(success=False, error=f"Failed to load workflow template: {str(e)}")

        # Modify inputs
        # Node 103: Load Image (Target/Background)
        workflow["103"]["inputs"]["image"] = target_filename
        
        # Node 109: Load Image (Reference/Subject)
        workflow["109"]["inputs"]["image"] = ref_filename
        
        # Node 104: Prompt
        if request.inputs.prompt is not None:
            workflow["104"]["inputs"]["prompt"] = request.inputs.prompt
            
        # Node 3: Seed
        if request.inputs.seed is not None:
            workflow["3"]["inputs"]["seed"] = request.inputs.seed

        # Node 60 is SaveImage, taking input from Node 8 (VAE Decode)
        # We'll add our own Node 999
        workflow["999"] = {
            "inputs": {
                "filename_prefix": "Composition_output",
                "images": ["8", 0]
            },
            "class_type": "SaveImage",
            "_meta": {
                "title": "Save Image"
            }
        }

        # 4. Execute workflow via WebSocket
        try:
            images = await client.execute_workflow(workflow, "999")
            if not images:
                return WorkflowResponse(success=False, error="No output images generated")
            
            output_image_data = images[0]
            
            # 5. Encode response
            b64_image = base64.b64encode(output_image_data).decode("utf-8")
            return WorkflowResponse(
                success=True,
                data=WorkflowResponseData(image=f"data:image/png;base64,{b64_image}")
            )
            
        except Exception as e:
            return WorkflowResponse(success=False, error=f"Error executing workflow: {str(e)}")

    
    def _read_local_image(self, path: Path) -> bytes:
        try:
            data = path.read_bytes()
        except OSError as exc:
            raise ValueError(f"Failed to read image file '{path}'") from exc
        self._validate_image_bytes(data)
        return data

    def _validate_image_bytes(self, data: bytes) -> None:
        try:
            with Image.open(io.BytesIO(data)) as img:
                img.verify()
        except UnidentifiedImageError as exc:
            raise ValueError("Provided image data is not a recognizable image") from exc

    # --- Helper Functions for Magic Quill Image Processing ---

    def _bytes_to_pil(self, data: bytes) -> Image.Image:
        """Converts raw bytes to a PIL Image."""
        return Image.open(io.BytesIO(data)).convert("RGB")

    def _pil_to_bytes(self, img: Image.Image) -> bytes:
        """Converts PIL Image to bytes (PNG format)."""
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    def _resize_to_match(self, img: Image.Image, target_size: tuple) -> Image.Image:
        """Resizes image to match the target (width, height)."""
        if img is None:
            return None
        return img.resize(target_size, Image.BILINEAR)

    def _make_alpha_mask_from_scribble(self, scribble: Image.Image, base_size: tuple, threshold=10) -> Image.Image:
        """
        Converts a scribble image into an RGBA mask. 
        Non-dark pixels become opaque; dark pixels become transparent.
        """
        if scribble is None:
            return None

        # Resize to match original
        scribble = self._resize_to_match(scribble.convert("RGBA"), base_size)

        # Create mask from grayscale intensity
        rgb = scribble.convert("RGB")
        gray = ImageOps.grayscale(rgb)
        # Anything brighter than threshold is considered "stroke" (255)
        mask = gray.point(lambda v: 255 if v > threshold else 0).convert("L")

        # Create new RGBA image
        rgba = Image.new("RGBA", base_size, (0, 0, 0, 0))
        rgba.putalpha(mask)
        return rgba


    async def handle_magic_quill(self, request: WorkflowRequest, backend_url: str) -> WorkflowResponse:
        import json
        from app.services.comfy_client import ComfyUIClient

        client = ComfyUIClient(backend_url)
        inputs = request.inputs

        # 1. Process original image
        try:
            if not inputs.originalImage:
                return WorkflowResponse(success=False, error="originalImage is required for Magic Quill")

            original_bytes = self._decode_image(inputs.originalImage)
            original_pil = self._bytes_to_pil(original_bytes)
            base_size = original_pil.size

            orig_resp = client.upload_image(original_bytes, filename=f"mq_orig_{uuid.uuid4()}.png")
            original_name = orig_resp["name"]
        except Exception as exc:
            logger.exception("Failed to process MagicQuill original image")
            return WorkflowResponse(success=False, error=f"Original image error: {str(exc)}")

        # 2. Process mask image (MagicQuill node input "image")
        try:
            if inputs.maskImage:
                mask_bytes = self._decode_image(inputs.maskImage)
                mask_scribble = self._bytes_to_pil(mask_bytes)
                mask_pil = self._make_alpha_mask_from_scribble(mask_scribble, base_size)
            else:
                mask_pil = Image.new("RGBA", base_size, (255, 255, 255, 255))

            mask_upload = client.upload_image(
                self._pil_to_bytes(mask_pil),
                filename=f"mq_mask_{uuid.uuid4()}.png"
            )
            mask_name = mask_upload["name"]
        except Exception as exc:
            logger.exception("Failed to process MagicQuill mask image")
            return WorkflowResponse(success=False, error=f"Mask image processing error: {str(exc)}")

        # 3. Process optional add-edge/remove-edge/color scribbles
        add_edge_name = None
        remove_edge_name = None
        add_color_name = None

        if inputs.addEdgeImage:
            try:
                edge_bytes = self._decode_image(inputs.addEdgeImage)
                edge_scribble = self._bytes_to_pil(edge_bytes)
                edge_mask = self._make_alpha_mask_from_scribble(edge_scribble, base_size)
                edge_upload = client.upload_image(
                    self._pil_to_bytes(edge_mask),
                    filename=f"mq_add_edge_{uuid.uuid4()}.png"
                )
                add_edge_name = edge_upload["name"]
            except Exception as exc:
                logger.warning("Failed to process addEdgeImage for MagicQuill: %s", exc)

        if inputs.removeEdgeImage:
            try:
                rem_bytes = self._decode_image(inputs.removeEdgeImage)
                rem_scribble = self._bytes_to_pil(rem_bytes)
                rem_mask = self._make_alpha_mask_from_scribble(rem_scribble, base_size)
                rem_upload = client.upload_image(
                    self._pil_to_bytes(rem_mask),
                    filename=f"mq_remove_edge_{uuid.uuid4()}.png"
                )
                remove_edge_name = rem_upload["name"]
            except Exception as exc:
                logger.warning("Failed to process removeEdgeImage for MagicQuill: %s", exc)

        if inputs.addColorImage:
            try:
                color_bytes = self._decode_image(inputs.addColorImage)
                color_img = self._bytes_to_pil(color_bytes)
                color_resized = self._resize_to_match(color_img, base_size)
                color_upload = client.upload_image(
                    self._pil_to_bytes(color_resized),
                    filename=f"mq_add_color_{uuid.uuid4()}.png"
                )
                add_color_name = color_upload["name"]
            except Exception as exc:
                logger.warning("Failed to process addColorImage for MagicQuill: %s", exc)

        # 4. Load workflow template (matches shared MagicQuill configuration exactly)
        workflow_path = Path(__file__).resolve().parent.parent.parent / "workflows" / "MagicQuill.json"
        try:
            with open(workflow_path, "r", encoding="utf-8") as f:
                workflow = json.load(f)
        except Exception as exc:
            logger.exception("Failed to load MagicQuill workflow template")
            return WorkflowResponse(success=False, error=f"Failed to load MagicQuill workflow template: {str(exc)}")

        try:
            mq_inputs = workflow["2"]["inputs"]
        except KeyError as exc:
            logger.exception("MagicQuill workflow template missing node 2 inputs")
            return WorkflowResponse(success=False, error="MagicQuill workflow template is invalid")

        mq_inputs["original_image"] = original_name
        mq_inputs["image"] = mask_name
        mq_inputs["add_color_image"] = add_color_name if add_color_name else original_name
        mq_inputs["add_edge_image"] = add_edge_name if add_edge_name else ""
        mq_inputs["remove_edge_image"] = remove_edge_name if remove_edge_name else ""

        if inputs.positivePrompt is not None:
            mq_inputs["positive_prompt"] = inputs.positivePrompt
        if inputs.negativePrompt is not None:
            mq_inputs["negative_prompt"] = inputs.negativePrompt
        if inputs.seed is not None:
            mq_inputs["seed"] = int(inputs.seed)
        if inputs.steps is not None:
            mq_inputs["steps"] = int(inputs.steps)
        if inputs.cfg is not None:
            mq_inputs["cfg"] = float(inputs.cfg)
        if inputs.edgeStrength is not None:
            mq_inputs["edge_strength"] = float(inputs.edgeStrength)
        if inputs.colorStrength is not None:
            mq_inputs["color_strength"] = float(inputs.colorStrength)
        if inputs.inpaintStrength is not None:
            mq_inputs["inpaint_strength"] = float(inputs.inpaintStrength)

        # 5. Execute workflow (SaveImage node id 4 per template)
        try:
            logger.info("Executing MagicQuill workflow")
            images = await client.execute_workflow(workflow, "4")

            if not images:
                return WorkflowResponse(success=False, error="No output images generated from MagicQuill")

            output_image_data = images[0]
            b64_image = base64.b64encode(output_image_data).decode("utf-8")
            return WorkflowResponse(
                success=True,
                data=WorkflowResponseData(image=f"data:image/png;base64,{b64_image}")
            )
        except Exception as exc:
            logger.exception("Error executing MagicQuill workflow")
            return WorkflowResponse(success=False, error=f"Workflow execution failed: {str(exc)}")
workflow_service = WorkflowService()