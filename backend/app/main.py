"""FastAPI app entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import api_router

app = FastAPI(title="viament", version="0.1.0")

# Configure CORS
import os

# Get allowed origins from environment or use defaults
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://frontend:3000",  # Docker network
    "https://viament.alwood.dev",  # Production domain
]

# Allow custom origins from environment
custom_origin = os.getenv("CORS_ORIGIN")
if custom_origin:
    allowed_origins.append(custom_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/", summary="Root endpoint")
def read_root() -> dict[str, str]:
    """Simple welcome endpoint."""
    return {"message": "Welcome to the viament API"}
