from fastapi import APIRouter

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.get("/config")
async def voice_config() -> dict:
    """
    Placeholder for realtime voice session bootstrapping. The prototype
    frontend uses the browser's own SpeechRecognition/SpeechSynthesis and
    never calls this. Once swapping to OpenAI's Realtime API (or similar):
    this endpoint would mint an ephemeral session token server-side (so the
    real API key never reaches the browser) and return it here.
    """
    return {
        "provider": "browser-web-speech",
        "note": "Swap for a realtime-voice session token endpoint when ready.",
    }
