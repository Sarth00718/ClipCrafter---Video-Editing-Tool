"""
Test routes for debugging API integrations.
"""

from fastapi import APIRouter, HTTPException
from app.core.config import settings
from app.core.logger import get_logger
import httpx

logger = get_logger(__name__)
router = APIRouter(tags=["Testing & Debug"])


@router.get("/test/murf-api")
async def test_murf_api(language: str = "English"):
    """
    Test Murf AI API connectivity and authentication with language support.
    Returns API status and configuration info.
    
    Query params:
        language: Language to test (default: English)
    """
    api_key = settings.murf_api_key
    
    if not api_key or api_key == "your_murf_api_key_here":
        return {
            "status": "error",
            "message": "MURF_API_KEY is not configured",
            "configured": False
        }
    
    # Import here to avoid circular dependency
    from app.video.asset_generators import AudioGenerationService
    
    # Get voice for language
    voice = AudioGenerationService.get_voice_for_language(language)
    
    # Test with a simple API call
    url = settings.murf_api_url
    
    headers = {
        "api-key": api_key,
        "Content-Type": "application/json"
    }
    
    payload = {
        "voiceId": voice,
        "style": "Conversational",
        "text": "This is a test.",
        "rate": 0,
        "pitch": 0,
        "sampleRate": 24000,
        "format": "MP3",
        "channelType": "STEREO",
        "pronunciationDictionary": {},
        "encodeAsBase64": False
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            
            return {
                "status": "success" if response.status_code == 200 else "error",
                "status_code": response.status_code,
                "configured": True,
                "api_key_prefix": api_key[:10] + "...",
                "language": language,
                "voice_used": voice,
                "response_headers": dict(response.headers),
                "response_body": response.text[:500] if response.status_code != 200 else "Audio generated successfully"
            }
    except Exception as e:
        logger.error(f"Murf API test failed: {e}", exc_info=True)
        return {
            "status": "error",
            "message": str(e),
            "configured": True,
            "api_key_prefix": api_key[:10] + "...",
            "language": language,
            "voice_used": voice
        }


@router.get("/test/config")
async def test_config():
    """
    Check all API key configurations.
    """
    return {
        "groq_api_key": "configured" if settings.groq_api_key else "missing",
        "murf_api_key": "configured" if settings.murf_api_key and settings.murf_api_key != "your_murf_api_key_here" else "missing",
        "stability_api_key": "configured" if settings.stability_api_key and settings.stability_api_key != "your_stability_api_key_here" else "missing",
        "gemini_api_key": "configured" if settings.gemini_api_key else "missing",
        "embedding_model": settings.embedding_model_name,
        "groq_model": settings.groq_model_name
    }
