from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from ..models.buyer import BuyerCreate, BuyerUpdate, BuyerResponse
from ..models.inquiry import InquiryResponse
from ..data.demo_data import BUYERS, INQUIRIES, _LOCK
from ..services.matching_service import MatchingService

router = APIRouter(prefix="/api/buyers", tags=["Buyers & Market Matching"])

class BuyerMatchRequest(BaseModel):
    product_id: Optional[str] = None
    craft_type: Optional[str] = None
    category: Optional[str] = None
    price: float = Field(0.0, ge=0.0)
    intended_use: Optional[str] = None

@router.post("", response_model=BuyerResponse, status_code=status.HTTP_201_CREATED, summary="Register New Buyer")
def create_buyer(buyer_in: BuyerCreate):
    with _LOCK:
        buyer_id = buyer_in.buyer_id
        if not buyer_id:
            seq = len(BUYERS) + 1
            buyer_id = f"BUY-{seq:03d}"

        if buyer_id in BUYERS:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Buyer ID '{buyer_id}' already exists.")

        now_str = datetime.now().strftime("%d %b %Y")
        buyer_dict = buyer_in.model_dump()
        buyer_dict["buyer_id"] = buyer_id
        buyer_dict["created_at"] = now_str
        BUYERS[buyer_id] = buyer_dict
        return BuyerResponse(**buyer_dict)

@router.get("", response_model=List[BuyerResponse], summary="List All Registered Buyers")
def list_buyers():
    with _LOCK:
        return [BuyerResponse(**b) for b in BUYERS.values()]

@router.get("/{buyer_id}", response_model=BuyerResponse, summary="Get Buyer Profile")
def get_buyer(buyer_id: str):
    with _LOCK:
        b = BUYERS.get(buyer_id)
        if not b:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Buyer '{buyer_id}' not found.")
        return BuyerResponse(**b)

@router.get("/{buyer_id}/inquiries", response_model=List[InquiryResponse], summary="Get Inquiries Placed by Buyer")
def get_buyer_inquiries(buyer_id: str):
    with _LOCK:
        if buyer_id not in BUYERS:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Buyer '{buyer_id}' not found.")
        return [InquiryResponse(**i) for i in INQUIRIES.values() if i.get("buyer_id") == buyer_id]

@router.post("/match", summary="Match Craft with Potential Commercial Buyers")
def match_buyers(req: BuyerMatchRequest):
    """
    Rule-based buyer matching evaluating category, price band, and intended use.
    """
    return MatchingService.match_buyers(
        product_id=req.product_id,
        craft_type=req.craft_type,
        category=req.category,
        price=req.price,
        intended_use=req.intended_use
    )
