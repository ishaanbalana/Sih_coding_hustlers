from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from ..models.artisan import ArtisanCreate, ArtisanUpdate, ArtisanResponse, ArtisanDashboardStats
from ..models.common import VerificationStatus
from ..data.demo_data import ARTISANS, PRODUCTS, INQUIRIES, _LOCK

router = APIRouter(prefix="/api/artisans", tags=["Artisans"])

@router.post("", response_model=ArtisanResponse, status_code=status.HTTP_201_CREATED, summary="Create New Artisan")
def create_artisan(artisan_in: ArtisanCreate):
    with _LOCK:
        artisan_id = artisan_in.artisan_id
        if not artisan_id:
            seq = len(ARTISANS) + 1
            artisan_id = f"CRF-ART-{seq:06d}"

        if artisan_id in ARTISANS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Artisan with ID '{artisan_id}' already exists."
            )

        now_str = datetime.now().strftime("%d %b %Y")
        artisan_dict = artisan_in.model_dump()
        artisan_dict["artisan_id"] = artisan_id
        artisan_dict["verification_status"] = VerificationStatus.PENDING.value
        artisan_dict["created_at"] = now_str
        artisan_dict["productCount"] = 0
        artisan_dict["passportCount"] = 0

        ARTISANS[artisan_id] = artisan_dict
        return ArtisanResponse(**artisan_dict)

@router.get("", response_model=List[ArtisanResponse], summary="List All Artisans")
def list_artisans(
    status_filter: Optional[VerificationStatus] = None,
    craft: Optional[str] = None
):
    with _LOCK:
        results = []
        for art in ARTISANS.values():
            if status_filter and art.get("verification_status") != status_filter.value:
                continue
            if craft and craft.lower() not in art.get("craft", "").lower():
                continue
            # calculate dynamic product count
            p_count = sum(1 for p in PRODUCTS.values() if p.get("artisan_id") == art["artisan_id"])
            art["productCount"] = p_count
            results.append(ArtisanResponse(**art))
        return results

@router.get("/{artisan_id}", response_model=ArtisanResponse, summary="Get Artisan Details")
def get_artisan(artisan_id: str):
    with _LOCK:
        art = ARTISANS.get(artisan_id)
        if not art:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Artisan '{artisan_id}' not found.")
        p_count = sum(1 for p in PRODUCTS.values() if p.get("artisan_id") == artisan_id)
        art["productCount"] = p_count
        return ArtisanResponse(**art)

@router.put("/{artisan_id}", response_model=ArtisanResponse, summary="Update Artisan Profile")
def update_artisan(artisan_id: str, artisan_in: ArtisanUpdate):
    with _LOCK:
        art = ARTISANS.get(artisan_id)
        if not art:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Artisan '{artisan_id}' not found.")
        
        updates = artisan_in.model_dump(exclude_unset=True)
        for key, val in updates.items():
            if val is not None:
                if key == "verification_status" and isinstance(val, VerificationStatus):
                    art[key] = val.value
                else:
                    art[key] = val
        
        return ArtisanResponse(**art)

@router.delete("/{artisan_id}", status_code=status.HTTP_200_OK, summary="Delete Artisan")
def delete_artisan(artisan_id: str):
    with _LOCK:
        if artisan_id not in ARTISANS:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Artisan '{artisan_id}' not found.")
        del ARTISANS[artisan_id]
        return {"success": True, "message": f"Artisan '{artisan_id}' deleted successfully."}

@router.get("/{artisan_id}/dashboard", response_model=ArtisanDashboardStats, summary="Artisan Dashboard Overview")
def get_artisan_dashboard(artisan_id: str):
    with _LOCK:
        art = ARTISANS.get(artisan_id)
        if not art:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Artisan '{artisan_id}' not found.")
        
        artisan_products = [p for p in PRODUCTS.values() if p.get("artisan_id") == artisan_id]
        total_products = len(artisan_products)
        verified_products = sum(1 for p in artisan_products if p.get("status") in ["VERIFIED", "verified"])
        pending_products = sum(1 for p in artisan_products if p.get("status") in ["PENDING_VERIFICATION", "pending", "DRAFT"])
        
        total_val = sum(float(p.get("price", 0)) for p in artisan_products)

        artisan_inquiries = [i for i in INQUIRIES.values() if i.get("artisan_id") == artisan_id]
        total_inquiries = len(artisan_inquiries)
        pending_inquiries = sum(1 for i in artisan_inquiries if i.get("status") == "PENDING")

        buyer_matches_count = sum(len(p.get("buyer_matches", [])) for p in artisan_products)

        return ArtisanDashboardStats(
            artisan_id=artisan_id,
            artisan_name=art.get("name", "Artisan"),
            total_products=total_products,
            verified_products=verified_products,
            pending_products=pending_products,
            total_inquiries=total_inquiries,
            pending_inquiries=pending_inquiries,
            buyer_matches=buyer_matches_count,
            estimated_total_product_value=round(total_val, 2)
        )
