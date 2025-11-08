"""API routers for the backend service."""

from fastapi import APIRouter

from .routes import health_router, vibe_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="/health", tags=["health"])
api_router.include_router(vibe_router, prefix="/vibes", tags=["vibes"])

__all__ = ["api_router"]
