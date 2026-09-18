from fastapi import APIRouter, HTTPException, status
from ..models.passport import PassportCreate, PassportResponse
from ..services.passport_service import PassportService
from ..data.demo_data import PRODUCTS, PASSPORTS, _LOCK

router = APIRouter(prefix="/api/passports", tags=["Digital Product Passports"])

@router.post("", response_model=PassportResponse, status_code=status.HTTP_201_CREATED, summary="Issue New Digital Product Passport")
def create_passport(passport_in: PassportCreate):
    with _LOCK:
        if passport_in.product_id not in PRODUCTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{passport_in.product_id}' not found."
            )

    try:
        passport = PassportService.create_passport_for_product(
            product_id=passport_in.product_id,
            verification_status=passport_in.verification_status.value
        )
        full_passport = PassportService.get_passport(passport["passport_id"])
        return PassportResponse(**full_passport)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{passport_id}", response_model=PassportResponse, summary="Get Digital Product Passport by ID")
def get_passport(passport_id: str):
    passport = PassportService.get_passport(passport_id)
    if not passport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Passport '{passport_id}' not found."
        )
    return PassportResponse(**passport)
