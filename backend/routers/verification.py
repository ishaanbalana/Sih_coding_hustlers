from fastapi import APIRouter, HTTPException, status
from ..models.passport import VerificationResponse
from ..services.passport_service import PassportService
from ..services.provenance_service import ProvenanceService
from ..data.demo_data import PASSPORTS, PRODUCTS, ARTISANS, _LOCK

router = APIRouter(prefix="/api/verify", tags=["Public Verification"])

@router.get("/{passport_or_product_id}", response_model=VerificationResponse, summary="Public QR Provenance Verification")
def verify_passport(passport_or_product_id: str):
    """
    Public lookup endpoint referenced by QR codes.
    Inspects registered DPP credentials, origin verification, and provenance ledger.
    """
    target_passport = None
    target_id = passport_or_product_id.strip()

    with _LOCK:
        # Check direct passport ID
        if target_id in PASSPORTS:
            target_passport = PASSPORTS[target_id]
        else:
            # Check by product ID
            for p in PASSPORTS.values():
                if p.get("product_id") == target_id:
                    target_passport = p
                    break

        if not target_passport:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No registered Digital Product Passport found for '{target_id}'."
            )

        passport_id = target_passport["passport_id"]
        product_id = target_passport["product_id"]
        artisan_id = target_passport["artisan_id"]

        product = PRODUCTS.get(product_id, {})
        artisan = ARTISANS.get(artisan_id, {})

    events = ProvenanceService.get_events(passport_id)
    is_verified = (target_passport.get("verification_status") == "VERIFIED")

    msg = (
        "CRAFTORA Digital Product Passport verified. Registered craft provenance record confirmed."
        if is_verified else
        "CRAFTORA Digital Product Passport found — audit verification pending."
    )

    return VerificationResponse(
        verified=is_verified,
        passport_id=passport_id,
        product_id=product_id,
        product={
            "id": product_id,
            "title": product.get("name"),
            "category": product.get("category"),
            "price": product.get("price"),
            "image": product.get("image"),
            "materials": product.get("materials", [])
        },
        artisan={
            "id": artisan_id,
            "name": artisan.get("name"),
            "craft": artisan.get("craft"),
            "location": artisan.get("location"),
            "photo_url": artisan.get("photo_url")
        },
        origin=target_passport.get("origin", "India"),
        verification_status=target_passport.get("verification_status", "PENDING"),
        provenance=events,
        verification_message=msg,
        disclaimer=(
            "CRAFTORA verifies the registered digital provenance record. "
            "Approval confirms reviewed registration and artisan origin information. "
            "Blockchain prototype provides a tamper-evident record of platform events; "
            "it does not independently certify physical authenticity."
        )
    )
