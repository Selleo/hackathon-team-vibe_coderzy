"""Route definitions for the backend APIs."""

import os
from datetime import datetime
from functools import lru_cache
from typing import Literal

import httpx
import toml
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

health_router = APIRouter()
vibe_router = APIRouter()
chat_router = APIRouter()
dependencies_router = APIRouter()

GROK_MODEL_ENV = "GROK_MODEL"
DEFAULT_GROK_MODEL = "grok-4-fast"
MAX_HISTORY_MESSAGES = 6
GROK_API_URL = "https://api.x.ai/v1/chat/completions"
GROK_TIMEOUT_SECONDS = float(os.getenv("GROK_TIMEOUT", 45))


def get_pyproject_data():
    with open("pyproject.toml") as f:
        return toml.load(f)


@dependencies_router.get("/", summary="Get project dependencies")
def get_dependencies(pyproject_data: dict = Depends(get_pyproject_data)):
    return pyproject_data.get("project", {}).get("dependencies", [])



class Message(BaseModel):
    """Chat message model."""

    id: str
    role: str
    content: str
    timestamp: str


class UserProfile(BaseModel):
    """User profile model."""

    experience: str
    intensity: str


class ChatRequest(BaseModel):
    """Chat request model."""

    message: str
    userProfile: UserProfile
    conversationHistory: list[Message]


class ChatResponse(BaseModel):
    """Chat response model."""

    response: str
    userInfo: dict[str, str | list[str]] | None = None


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


# In-memory storage for user information (replace with database in production)
user_data_store: dict[str, dict] = {}


@chat_router.post("/", summary="Chat with AI Mentor")
def chat_with_mentor(request: ChatRequest) -> ChatResponse:
    """
    Handle chat messages with the AI mentor.
    Stores user information extracted from conversations.
    """
    user_message = request.message.lower()

    # Extract and store user information
    user_id = f"{request.userProfile.experience}_{request.userProfile.intensity}"

    if user_id not in user_data_store:
        user_data_store[user_id] = {
            "experience": request.userProfile.experience,
            "intensity": request.userProfile.intensity,
            "interests": [],
            "challenges": [],
            "goals": [],
            "conversation_count": 0,
        }

    user_data_store[user_id]["conversation_count"] += 1

    # Simple keyword-based information extraction
    if any(word in user_message for word in ["interesuję się", "lubię", "chcę nauczyć się"]):
        topics = extract_topics(user_message)
        user_data_store[user_id]["interests"].extend(topics)

    if any(word in user_message for word in ["problem", "trudność", "nie rozumiem", "ciężko"]):
        challenges = extract_topics(user_message)
        user_data_store[user_id]["challenges"].extend(challenges)

    if any(word in user_message for word in ["cel", "chcę", "planuję", "zamierzam"]):
        goals = extract_topics(user_message)
        user_data_store[user_id]["goals"].extend(goals)

    # Generate contextual response based on user profile and message
    response = generate_mentor_response(
        request.userProfile,
        request.message,
        user_data_store[user_id],
        request.conversationHistory,
    )

    return ChatResponse(response=response, userInfo=user_data_store[user_id])


def extract_topics(message: str) -> list[str]:
    """Extract relevant topics from user message."""
    # This is a simple implementation - in production, use NLP
    programming_keywords = [
        "python",
        "javascript",
        "java",
        "c++",
        "react",
        "vue",
        "angular",
        "django",
        "flask",
        "nodejs",
        "typescript",
        "algorytmy",
        "struktury danych",
        "bazy danych",
        "api",
        "frontend",
        "backend",
        "fullstack",
    ]

    return [keyword for keyword in programming_keywords if keyword in message.lower()]


def generate_mentor_response(
    profile: UserProfile,
    message: str,
    user_data: dict,
    conversation_history: list[Message],
) -> str:
    """Generate a contextual response powered by Grok."""

    user_context = (
        f"Doświadczenie: {profile.experience}\n"
        f"Intensywność: {profile.intensity}\n"
        f"Zainteresowania: {', '.join(user_data['interests']) or 'brak'}\n"
        f"Wyzwania: {', '.join(user_data['challenges']) or 'brak'}\n"
        f"Cele: {', '.join(user_data['goals']) or 'brak'}\n"
    )

    mentor_prompt = (
        "Twoim zadaniem jest wspierać polskojęzycznego adepta programowania. "
        "Buduj krótkie, konkretne odpowiedzi (3-5 zdań), proponuj kolejne kroki lub pytania "
        "pogłębiające temat i zachowaj przyjazny ton mentora. "
        "Jeśli proszą o kod, pokaż fragment i krótko objaśnij koncepcję."
    )

    latest_history = format_conversation_history(conversation_history)

    user_prompt = (
        f"Profil użytkownika:\n{user_context}\n"
        f"Historia ostatnich rozmów:\n{latest_history}\n\n"
        f"Aktualna wiadomość ucznia:\n{message}\n\n"
        "Udziel odpowiedzi w języku polskim, odwołując się do kontekstu "
        "i proponując kolejne działania lub pytania pomagające w nauce."
    )

    chat_messages = [
        {"role": "system", "content": mentor_prompt},
        *conversation_messages(conversation_history),
        {"role": "user", "content": user_prompt},
    ]

    return call_grok_api(chat_messages)


def conversation_messages(history: list[Message]) -> list[dict[str, str]]:
    """Transform stored Message objects into Grok chat messages."""
    trimmed = history[-MAX_HISTORY_MESSAGES:]
    messages: list[dict[str, str]] = []
    for item in trimmed:
        role = "assistant" if item.role in {"assistant", "model"} else "user"
        messages.append({"role": role, "content": item.content})

    return messages


def format_conversation_history(history: list[Message]) -> str:
    """Prepare a trimmed conversation history string for prompting."""
    if not history:
        return "Brak wcześniejszych wiadomości."

    trimmed = history[-MAX_HISTORY_MESSAGES:]
    lines = [f"{msg.role}: {msg.content}" for msg in trimmed]
    return "\n".join(lines)


@lru_cache(maxsize=1)
def get_http_client() -> httpx.Client:
    """Return a configured HTTP client for Grok requests."""
    return httpx.Client(timeout=GROK_TIMEOUT_SECONDS)


def call_grok_api(messages: list[dict[str, str]]) -> str:
    """Send a chat completion request to Grok and return the text reply."""
    api_key = os.getenv("GROK_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROK_API_KEY is not configured")

    model = os.getenv(GROK_MODEL_ENV, DEFAULT_GROK_MODEL) or DEFAULT_GROK_MODEL
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    client = get_http_client()
    try:
        response = client.post(GROK_API_URL, headers=headers, json=payload)
    except httpx.RequestError as exc:  # pragma: no cover - network call mocked in tests
        raise HTTPException(status_code=502, detail="Unable to reach Grok API") from exc

    try:
        data = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Invalid response from Grok API") from exc

    if response.status_code >= 400:
        detail = data.get("error", {}).get("message", "Grok request failed")
        raise HTTPException(status_code=502, detail=detail)
    choices = data.get("choices") or []
    if not choices:
        raise HTTPException(status_code=502, detail="Grok API returned no choices")

    message = choices[0].get("message", {})
    content = message.get("content")
    if isinstance(content, str) and content.strip():
        return content.strip()

    raise HTTPException(status_code=502, detail="Grok API returned empty content")
