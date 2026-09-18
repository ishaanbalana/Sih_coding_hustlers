from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from ..models.inquiry import InquiryCreate, InquiryUpdate, InquiryResponse
from ..models.common import InquiryStatus
from ..data.demo_data import INQUIRIES, BUYERS, ARTISANS, PRODUCTS, _LOCK

router = APIRouter(prefix="/api/inquiries", tags=["Buyer Inquiries & Direct Connect"])

def _hydrate_inquiry(inq: dict) -> InquiryResponse:
    enriched = dict(inq)
    buyer = BUYERS.get(inq.get("buyer_id", ""), {})
    artisan = ARTISANS.get(inq.get("artisan_id", ""), {})
    product = PRODUCTS.get(inq.get("product_id", ""), {})

    enriched["buyer_name"] = inq.get("buyer_name") or buyer.get("name", "Direct Buyer")
    enriched["artisan_name"] = inq.get("artisan_name") or artisan.get("name", "Master Artisan")
    enriched["product_title"] = inq.get("product_title") or product.get("name", "Craft Product")
    return InquiryResponse(**enriched)

@router.post("", response_model=InquiryResponse, status_code=status.HTTP_201_CREATED, summary="Submit Buyer Inquiry / Order Request")
def create_inquiry(inq_in: InquiryCreate):
    with _LOCK:
        # Validate references
        if inq_in.buyer_id not in BUYERS:
            # Auto-register guest buyer if needed for smooth UX
            BUYERS[inq_in.buyer_id] = {
                "buyer_id": inq_in.buyer_id,
                "name": inq_in.buyer_name or "Guest Buyer",
                "buyer_type": "Individual Buyer",
                "location": "India",
                "interests": [],
                "intended_use": "Direct purchase",
                "created_at": datetime.now().strftime("%d %b %Y")
            }

        if inq_in.artisan_id not in ARTISANS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Artisan '{inq_in.artisan_id}' does not exist."
            )

        if inq_in.product_id not in PRODUCTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{inq_in.product_id}' does not exist."
            )

        seq = len(INQUIRIES) + 1
        inquiry_id = inq_in.inquiry_id or f"REQ-{seq:03d}"
        now_str = datetime.now().strftime("%d %b %Y")

        inq_dict = inq_in.model_dump()
        inq_dict["inquiry_id"] = inquiry_id
        inq_dict["status"] = InquiryStatus.PENDING.value
        inq_dict["created_at"] = now_str
        inq_dict["updated_at"] = now_str

        # Cache reference names
        inq_dict["buyer_name"] = inq_in.buyer_name or BUYERS[inq_in.buyer_id].get("name")
        inq_dict["artisan_name"] = inq_in.artisan_name or ARTISANS[inq_in.artisan_id].get("name")
        inq_dict["product_title"] = inq_in.product_title or PRODUCTS[inq_in.product_id].get("name")

        INQUIRIES[inquiry_id] = inq_dict
        return _hydrate_inquiry(inq_dict)

@router.get("", response_model=List[InquiryResponse], summary="List Inquiries")
def list_inquiries(
    artisan_id: Optional[str] = None,
    buyer_id: Optional[str] = None,
    product_id: Optional[str] = None,
    status_filter: Optional[InquiryStatus] = None
):
    with _LOCK:
        results = []
        for inq in INQUIRIES.values():
            if artisan_id and inq.get("artisan_id") != artisan_id:
                continue
            if buyer_id and inq.get("buyer_id") != buyer_id:
                continue
            if product_id and inq.get("product_id") != product_id:
                continue
            if status_filter and inq.get("status") != status_filter.value:
                continue
            results.append(_hydrate_inquiry(inq))
        return results

@router.get("/{inquiry_id}", response_model=InquiryResponse, summary="Get Inquiry Details")
def get_inquiry(inquiry_id: str):
    with _LOCK:
        inq = INQUIRIES.get(inquiry_id)
        if not inq:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Inquiry '{inquiry_id}' not found.")
        return _hydrate_inquiry(inq)

@router.patch("/{inquiry_id}", response_model=InquiryResponse, summary="Update Inquiry Status")
def update_inquiry(inquiry_id: str, inq_update: InquiryUpdate):
    with _LOCK:
        inq = INQUIRIES.get(inquiry_id)
        if not inq:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Inquiry '{inquiry_id}' not found.")
        
        updates = inq_update.model_dump(exclude_unset=True)
        for key, val in updates.items():
            if val is not None:
                if key == "status" and isinstance(val, InquiryStatus):
                    inq[key] = val.value
                else:
                    inq[key] = val

        inq["updated_at"] = datetime.now().strftime("%d %b %Y")
        return _hydrate_inquiry(inq)
