from fastapi import APIRouter, UploadFile, File, HTTPException

from services import groq_service as ai
from services.groq_service import GroqNotConfiguredError

router = APIRouter(prefix="/api/speech", tags=["speech"])


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """Fallback speech-to-text for browsers without native Speech Recognition
    (e.g. Firefox, some mobile browsers). Uses Groq's Whisper endpoint."""
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="No audio received.")
    try:
        text = ai.transcribe_audio(audio_bytes, file.filename or "audio.webm")
    except GroqNotConfiguredError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech recognition failed. Please try again or type your answer. ({e})")
    return {"text": text}
