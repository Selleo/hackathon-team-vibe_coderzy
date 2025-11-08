"""FastAPI app entrypoint."""

from fastapi import FastAPI

from .api import api_router

app = FastAPI(title="viament", version="0.1.0")
app.include_router(api_router, prefix="/api")


@app.get("/", summary="Root endpoint")
def read_root() -> dict[str, str]:
    """Simple welcome endpoint."""
    return {"message": "Welcome to the viament API"}
