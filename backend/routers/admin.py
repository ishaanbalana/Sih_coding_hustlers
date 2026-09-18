from typing import List, Optional
from fastapi import APIRouter, HTTPException, Body, status
from pydantic import BaseModel
from ..models.artisan import ArtisanResponse
from ..models.product import ProductResponse
from ..models.passport import ProvenanceEvent
from ..data.demo_data import ARTISANS, PRODUCTS, INQUIRIES, PASSPORTS, PROVENANCE_EVENTS, _LOCK
from ..services.passport_service import PassportService
from ..services.provenance_service import ProvenanceService

router = APIRouter(prefix="/api/admin", tags=["Admin Portal & Compliance"])

class ReviewActionRequest(BaseModel):
    review_note: Optional[str] = "Approved by Administrator"

class RequestChangesRequest(BaseModel):
    review_note: str

@router.get("/dashboard", summary="Admin Verification & Governance Dashboard")
def get_admin_dashboard():
    with _LOCK:
        total_arts = len(ARTISANS)
        verified_arts = sum(1 for a in ARTISANS.values() if a.get("verification_status") == "VERIFIED")
        pending_arts = sum(1 for a in ARTISANS.values() if a.get("verification_status") == "PENDING")

        total_prods = len(PRODUCTS)
        verified_prods = sum(1 for p in PRODUCTS.values() if p.get("status") in ["VERIFIED", "verified"])
        pending_prods = sum(1 for p in PRODUCTS.values() if p.get("status") in ["PENDING_VERIFICATION", "pending", "DRAFT"])

        total_inqs = len(INQUIRIES)
        prov_count = sum(len(evts) for evts in PROVENANCE_EVENTS.values())

        return {
            "total_artisans": total_arts,
            "verified_artisans": verified_arts,
            "pending_artisan_verification": pending_arts,
            "total_products": total_prods,
            "verified_products": verified_prods,
            "pending_products": pending_prods,
            "total_inquiries": total_inqs,
            "provenance_records": prov_count,
            "admin_id": "ADMIN-IND-902",
            "compliance_status": "All Systems Operational"
        }

@router.get("/artisans/pending", response_model=List[ArtisanResponse], summary="Queue of Artisans Awaiting Verification")
def get_pending_artisans():
    with _LOCK:
        return [ArtisanResponse(**a) for a in ARTISANS.values() if a.get("verification_status") == "PENDING"]

@router.get("/artisans/{artisan_id}", response_model=ArtisanResponse, summary="Get Artisan for Admin Review")
def get_artisan_for_review(artisan_id: str):
    with _LOCK:
        a = ARTISANS.get(artisan_id)
        if not a:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Artisan '{artisan_id}' not found.")
        return ArtisanResponse(**a)

@router.post("/artisans/{artisan_id}/approve", response_model=ArtisanResponse, summary="Approve Artisan Verification")
def approve_artisan(artisan_id: str, req: Optional[ReviewActionRequest] = None):
    with _LOCK:
        a = ARTISANS.get(artisan_id)
        if not a:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Artisan '{artisan_id}' not found.")
        a["verification_status"] = "VERIFIED"
        return ArtisanResponse(**a)

@router.post("/artisans/{artisan_id}/request-changes", response_model=ArtisanResponse, summary="Request Artisan Profile Changes")
def request_artisan_changes(artisan_id: str, req: RequestChangesRequest):
    with _LOCK:
        a = ARTISANS.get(artisan_id)
        if not a:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Artisan '{artisan_id}' not found.")
        a["verification_status"] = "CHANGES_REQUESTED"
        a["review_note"] = req.review_note
        return ArtisanResponse(**a)

@router.get("/products/pending", response_model=List[ProductResponse], summary="Queue of Products Awaiting Verification")
def get_pending_products():
    from .products import _hydrate_product_response
    with _LOCK:
        results = []
        for p in PRODUCTS.values():
            if p.get("status") in ["PENDING_VERIFICATION", "pending", "DRAFT"]:
                results.append(_hydrate_product_response(p))
        return results

@router.get("/products/{product_id}", response_model=ProductResponse, summary="Get Product for Admin Audit")
def get_product_for_audit(product_id: str):
    from .products import _hydrate_product_response
    with _LOCK:
        p = PRODUCTS.get(product_id)
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product '{product_id}' not found.")
        return _hydrate_product_response(p)

@router.post("/products/{product_id}/approve", response_model=ProductResponse, summary="Approve Product & Issue Verified Passport")
def approve_product(product_id: str, req: Optional[ReviewActionRequest] = None):
    from .products import _hydrate_product_response
    with _LOCK:
        p = PRODUCTS.get(product_id)
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product '{product_id}' not found.")
        
        p["status"] = "VERIFIED"
        p["review_note"] = req.review_note if req else "Approved by Administrator"

    # Ensure passport is marked verified and provenance event logged
    passport = PassportService.get_by_product_id(product_id)
    if passport:
        PassportService.update_status(
            passport_id=passport["passport_id"],
            new_status="VERIFIED",
            note=req.review_note if req else "Approved by Administrator"
        )
    else:
        PassportService.create_passport_for_product(
            product_id=product_id,
            verification_status="VERIFIED"
        )

    with _LOCK:
        return _hydrate_product_response(PRODUCTS[product_id])

@router.post("/products/{product_id}/request-changes", response_model=ProductResponse, summary="Request Product Revision")
def request_product_changes(product_id: str, req: RequestChangesRequest):
    from .products import _hydrate_product_response
    with _LOCK:
        p = PRODUCTS.get(product_id)
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product '{product_id}' not found.")
        
        p["status"] = "CHANGES_REQUESTED"
        p["review_note"] = req.review_note

    passport = PassportService.get_by_product_id(product_id)
    if passport:
        PassportService.update_status(
            passport_id=passport["passport_id"],
            new_status="CHANGES_REQUESTED",
            note=req.review_note
        )

    with _LOCK:
        return _hydrate_product_response(PRODUCTS[product_id])

@router.get("/provenance", response_model=List[ProvenanceEvent], summary="Platform-wide Provenance Audit Log")
def get_all_provenance_logs():
    events = ProvenanceService.get_all_events()
    return [ProvenanceEvent(**e) for e in events]
