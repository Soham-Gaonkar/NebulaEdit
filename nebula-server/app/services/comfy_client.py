import io
import uuid
import json
import asyncio
import websockets
import requests
from requests.adapters import HTTPAdapter
from requests.exceptions import ConnectionError as RequestsConnectionError, RequestException
from urllib3.util.retry import Retry
from PIL import Image
import logging
from websockets.exceptions import ConnectionClosedError

logger = logging.getLogger(__name__)

class ComfyUIClient:
    def __init__(self, server_url):
        self.server_url = server_url.rstrip("/")
        # Convert http(s) to ws(s)
        if server_url.startswith("https"):
            self.ws_url = self.server_url.replace("https", "wss")
        else:
            self.ws_url = self.server_url.replace("http", "ws")

        self.http = requests.Session()
        retry_cfg = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[502, 503, 504],
            allowed_methods=["GET", "POST"],
        )
        adapter = HTTPAdapter(max_retries=retry_cfg)
        self.http.mount("http://", adapter)
        self.http.mount("https://", adapter)

    def upload_image(self, image_data: bytes, filename="image.png", subfolder="", folder_type="input"):
        """
        Uploads an image to ComfyUI.
        """
        files = {
            "image": (filename, image_data, "image/png"),
        }
        data = {
            "subfolder": subfolder,
            "type": folder_type,
        }
        
        try:
            logger.info("Uploading image to %s", self.server_url)
            resp = self.http.post(
                f"{self.server_url}/upload/image",
                files=files,
                data=data,
                timeout=20,
            )
            resp.raise_for_status()
            payload = resp.json()
            logger.debug("Upload response: %s", payload)
            return payload
        except RequestsConnectionError as exc:
            logger.error("Cannot reach ComfyUI backend %s: %s", self.server_url, exc)
            raise RuntimeError(
                f"Cannot reach ComfyUI backend at {self.server_url}. "
                "Ensure the ComfyUI server is running and accessible."
            ) from exc
        except RequestException as exc:
            logger.exception("HTTP error while uploading image to ComfyUI")
            raise RuntimeError("HTTP error while uploading image to ComfyUI") from exc

    def get_history(self, prompt_id):
        """
        Gets history for a prompt_id.
        """
        try:
            logger.info("Fetching history for prompt %s", prompt_id)
            resp = self.http.get(f"{self.server_url}/history/{prompt_id}", timeout=20)
            resp.raise_for_status()
            return resp.json().get(prompt_id, {})
        except Exception as e:
            logger.exception("Error getting history from ComfyUI")
            raise

    def download_image(self, filename, subfolder="", folder_type="output"):
        """
        Downloads an image from ComfyUI.
        """
        params = {
            "filename": filename,
            "subfolder": subfolder,
            "type": folder_type,
        }
        try:
            logger.info("Downloading image %s from ComfyUI", filename)
            resp = self.http.get(f"{self.server_url}/view", params=params, timeout=20)
            resp.raise_for_status()
            return resp.content
        except Exception as e:
            logger.exception("Error downloading image from ComfyUI")
            raise

    async def execute_workflow(self, workflow_json, output_node_id):
        """
        Executes a workflow using WebSockets and waits for the result.
        """
        client_id = str(uuid.uuid4())
        ws_url = f"{self.ws_url}/ws?clientId={client_id}"
        
        prompt_id = None
        ws_closed_early = False
        try:
            logger.info("Connecting to ComfyUI websocket %s", ws_url)
            async with websockets.connect(ws_url, ping_interval=20, ping_timeout=20, close_timeout=5, max_size=None) as websocket:
                # Queue the prompt
                payload = {"prompt": workflow_json, "client_id": client_id}
                logger.info("Submitting workflow prompt to %s", self.server_url)
                resp = self.http.post(f"{self.server_url}/prompt", json=payload, timeout=20)
                resp.raise_for_status()
                prompt_id = resp.json()["prompt_id"]
                logger.info("ComfyUI accepted prompt %s", prompt_id)

                # Listen for completion
                while True:
                    try:
                        out = await websocket.recv()
                    except ConnectionClosedError as exc:
                        ws_closed_early = True
                        logger.warning(
                            "ComfyUI websocket closed before completion for prompt %s: %s",
                            prompt_id,
                            exc,
                        )
                        break

                    if isinstance(out, str):
                        message = json.loads(out)
                        logger.debug("Websocket message: %s", message)
                        if message['type'] == 'executing':
                            data = message['data']
                            if data['node'] is None and data['prompt_id'] == prompt_id:
                                # Execution finished
                                logger.info("Prompt %s finished executing", prompt_id)
                                break
                        # You can handle other messages like 'progress' here if needed
        except ConnectionClosedError as exc:
            ws_closed_early = True
            logger.warning("Websocket connection closed unexpectedly before prompt submission: %s", exc)
        except Exception as e:
            logger.exception("ComfyUI websocket error")
            raise

        if prompt_id is None:
            raise RuntimeError("Failed to submit prompt to ComfyUI; no prompt_id was returned")

        # Fetch results from history
        history = self.get_history(prompt_id)
        logger.debug("History keys: %s", history.keys())
        outputs = history.get("outputs", {})
        logger.debug("Output nodes available: %s", outputs.keys())

        if ws_closed_early and not outputs:
            raise RuntimeError(
                "Lost websocket connection to ComfyUI before outputs were produced. "
                "Check the backend server logs or network connectivity."
            )
        
        if output_node_id in outputs:
            node_output = outputs[output_node_id]
            images_meta = node_output.get("images", [])
            logger.info("Node %s produced %d images", output_node_id, len(images_meta))
            
            result_images = []
            for meta in images_meta:
                logger.debug("Downloading image meta: %s", meta)
                img_data = self.download_image(
                    meta["filename"],
                    meta.get("subfolder", ""),
                    meta.get("type", "output")
                )
                result_images.append(img_data)
            
            return result_images
        
        logger.warning("No outputs found for node %s (prompt %s)", output_node_id, prompt_id)
        return []
