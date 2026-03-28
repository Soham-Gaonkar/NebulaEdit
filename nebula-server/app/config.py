import os

class Settings:
    BACKEND_URL_MAIN = os.getenv("BACKEND_URL_MAIN", "http://69.19.137.247:8188")
    BACKEND_URL_MAGIC_QUILL = os.getenv("BACKEND_URL_MAGIC_QUILL", "http://69.19.136.174:8188")
    
    # LLM Settings for safety checks and prompt improvement
    LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "microsoft/Phi-3-mini-4k-instruct")
    ENABLE_SAFETY_CHECK = os.getenv("ENABLE_SAFETY_CHECK", "true").lower() == "false"

settings = Settings()
