from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Body, status
from pydantic import BaseModel
from ..services.ai_service import AIService
from ..data.demo_data import ARTISANS, _LOCK

router = APIRouter(prefix="/api/ai", tags=["AI Cataloguing & Voice"])

class VoiceToProductRequest(BaseModel):
    transcript: str
    language: str = "EN"
    artisan_id: Optional[str] = None

@router.post("/analyze-product", summary="AI Product Cataloguing (Vision Analysis)")
async def analyze_product(
    image: Optional[UploadFile] = File(None),
    artisan_id: Optional[str] = Form(None),
    language: Optional[str] = Form("EN")
):
    """
    Analyzes uploaded product photograph and generates draft catalogue attributes.
    Clearly marked as 'ai_mode: demo' prototype multimodal AI.
    """
    filename = image.filename if image else "bamboo_basket.png"
    artisan_craft = None
    if artisan_id:
        with _LOCK:
            art = ARTISANS.get(artisan_id)
            if art:
                artisan_craft = art.get("craft")

    analysis = AIService.analyze_product_image(
        filename=filename,
        artisan_id=artisan_id,
        artisan_craft=artisan_craft,
        language=language or "EN"
    )
    return analysis

@router.post("/voice-to-product", summary="Voice Assistant Transcription to Product Fields")
async def voice_to_product(
    payload: Optional[VoiceToProductRequest] = Body(None),
    transcript: Optional[str] = Form(None),
    language: Optional[str] = Form("EN"),
    artisan_id: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None)
):
    """
    Accepts spoken audio or speech-to-text transcript (Hindi / English)
    and extracts structured craft details for the cataloguing wizard.
    """
    # Prefer structured JSON transcript, fallback to form fields
    text = ""
    lang = "EN"
    art_id = None

    if payload:
        text = payload.transcript
        lang = payload.language or "EN"
        art_id = payload.artisan_id
    elif transcript:
        text = transcript
        lang = language or "EN"
        art_id = artisan_id
    elif audio_file:
        # Honest fallback when direct audio binary is sent without an external STT key
        return {
            "ai_generated": True,
            "ai_mode": "demo",
            "message": "Audio received. Web Speech API transcript processing recommended for browser voice input.",
            "product_name": "Handcrafted Artisanal Product",
            "category": "Handicrafts",
            "craft_type": "Traditional Craft",
            "description": "Handcrafted artisanal product described via voice input.",
            "materials": ["Natural Materials"],
            "production_time": "2-3 Days",
            "location": "India",
            "confidence": None,
            "disclaimer": "AI Generated / Demo AI. Audio model simulated."
        }

    return AIService.voice_to_product(transcript=text, language=lang, artisan_id=art_id)

@router.post("/enhance-image", summary="AI Product Image Lighting Enhancement")
async def enhance_image(
    image: Optional[UploadFile] = File(None)
):
    """
    Simulates craft photo clarity enhancement and balanced background illumination.
    """
    filename = image.filename if image else "craft.png"
    return AIService.enhance_image(filename=filename)
