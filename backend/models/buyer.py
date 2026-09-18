from typing import Optional, List
from pydantic import BaseModel, Field

class BuyerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Buyer's name or business name")
    buyer_type: str = Field(..., description="e.g. Retail Store, Interior Designer, Boutique, Handicraft Exporter, Individual Buyer")
    location: str = Field(..., description="City and Country e.g. New Delhi, India")
    interests: List[str] = Field(default_factory=list, description="Craft interest categories")
    intended_use: Optional[str] = Field("Retail collection / Home decor", description="Primary use of sourced crafts")
    email: Optional[str] = None
    mobile_number: Optional[str] = None

class BuyerCreate(BuyerBase):
    buyer_id: Optional[str] = None

class BuyerUpdate(BaseModel):
    name: Optional[str] = None
    buyer_type: Optional[str] = None
    location: Optional[str] = None
    interests: Optional[List[str]] = None
    intended_use: Optional[str] = None
    email: Optional[str] = None
    mobile_number: Optional[str] = None

class BuyerResponse(BuyerBase):
    buyer_id: str
    created_at: str
    is_registered: bool = True
