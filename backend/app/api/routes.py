"""Route definitions for the backend APIs."""

from datetime import datetime
from typing import Literal

from fastapi import APIRouter

health_router = APIRouter()
vibe_router = APIRouter()


@health_router.get("/", summary="Service health status")
def get_health_status() -> dict[str, str | float]:
    """Trivial liveness endpoint for uptime checks."""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@vibe_router.get("/", summary="Retrieve current hackathon vibe")
def get_vibe() -> dict[str, Literal["chill", "focused", "crunch"] | str]:
    """Demo endpoint returning canned data for the frontend to consume."""
    return {
        "team": "Coderzy",
        "vibe": "focused",
        "message": "Keep shipping thoughtfully polished features!",
    }
