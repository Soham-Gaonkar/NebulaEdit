from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import workflow

app = FastAPI(title="AI Workflow Server")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflow.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
