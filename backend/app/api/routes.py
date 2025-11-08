"""Route definitions for the backend APIs."""

from datetime import datetime
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

health_router = APIRouter()
vibe_router = APIRouter()
chat_router = APIRouter()


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
    response = generate_mentor_response(request.userProfile, user_message, user_data_store[user_id])

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
    profile: UserProfile, message: str, user_data: dict
) -> str:
    """Generate a contextual response based on user profile and history."""
    experience = profile.experience.lower()
    conversation_count = user_data["conversation_count"]

    # Personalized responses based on experience level
    if "pomoc" in message or "pytanie" in message or "?" in message:
        if experience == "beginner":
            return (
                "Oczywiście! Jako początkujący programista, nie bój się zadawać pytań. "
                "Każdy ekspert kiedyś zaczynał od podstaw. Opowiedz mi więcej o tym, "
                "z czym masz problem, a postaram się wytłumaczyć to w prosty sposób."
            )
        elif experience == "intermediate":
            return (
                "Świetnie, że pytasz! Z twoim poziomem doświadczenia możemy zgłębić "
                "temat bardziej szczegółowo. Co dokładnie chciałbyś zrozumieć lepiej?"
            )
        else:
            return (
                "Interesujące pytanie! Jako zaawansowany programista pewnie szukasz "
                "głębszego zrozumienia. Omówmy to od strony technicznej i best practices."
            )

    if "dziękuję" in message or "dzięki" in message:
        return (
            "Nie ma za co! Cieszę się, że mogę pomóc. Pamiętaj, że jestem tu zawsze, "
            "gdy potrzebujesz wsparcia w nauce programowania. Powodzenia!"
        )

    if conversation_count == 1:
        return (
            f"Widzę, że jesteś na poziomie {profile.experience} i pracujesz z intensywnością "
            f"{profile.intensity}. To świetnie! Jestem tu, aby pomóc ci w nauce programowania. "
            "Możesz zadawać mi pytania o konkretne technologie, prosić o wyjaśnienia koncepcji, "
            "albo po prostu porozmawiać o swoich celach programistycznych. Czym mogę ci pomóc?"
        )

    # Default response
    return (
        "Rozumiem. Jako twój mentor programowania, mogę pomóc ci z różnymi aspektami nauki. "
        "Czy mógłbyś rozwinąć swoją myśl? Chętnie pomogę ci znaleźć najlepsze rozwiązanie "
        "lub wyjaśnię trudniejsze koncepcje."
    )
