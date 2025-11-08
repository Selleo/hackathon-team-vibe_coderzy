"""API routers for the backend service."""

from fastapi import APIRouter

from .routes import chat_router, health_router, vibe_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="/health", tags=["health"])
api_router.include_router(vibe_router, prefix="/vibes", tags=["vibes"])
api_router.include_router(chat_router, prefix="/chat", tags=["chat"])

__all__ = ["api_router"]
