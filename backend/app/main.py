"""FastAPI application for AI MLOps Copilot backend."""

import os

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.auth import router as auth_router
from .api.projects import router as projects_router
from .api.dockerfiles import router as dockerfiles_router
from .api.cicd import router as cicd_router

app = FastAPI(
    title="AI MLOps Copilot API",
    description="Backend API for AI MLOps Copilot platform",
    version="0.1.0",
)

# CORS configuration
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(dockerfiles_router)
app.include_router(cicd_router)


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}
