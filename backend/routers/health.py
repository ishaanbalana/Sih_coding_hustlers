from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health", summary="Health Check")
def health_check():
    """Returns server operational status and version."""
    return {
        "status": "ok",
        "service": "CRAFTORA Backend",
        "version": "1.0.0"
    }
