from typing import Optional
from pydantic import BaseModel, Field
from .common import InquiryType, InquiryStatus

class InquiryBase(BaseModel):
    buyer_id: str = Field(..., description="ID of the buyer placing the inquiry")
    artisan_id: str = Field(..., description="ID of the target artisan")
    product_id: str = Field(..., description="ID of the target product")
    type: InquiryType = Field(InquiryType.RETAIL_PURCHASE, description="Type of inquiry")
    message: str = Field(..., min_length=5, max_length=1000, description="Inquiry note or requirement")
    quantity: int = Field(1, ge=1, le=100000, description="Requested units")

class InquiryCreate(InquiryBase):
    inquiry_id: Optional[str] = None
    buyer_name: Optional[str] = None
    product_title: Optional[str] = None
    artisan_name: Optional[str] = None

class InquiryUpdate(BaseModel):
    status: Optional[InquiryStatus] = None
    message: Optional[str] = None
    quantity: Optional[int] = None

class InquiryResponse(InquiryBase):
    inquiry_id: str
    status: InquiryStatus = InquiryStatus.PENDING
    created_at: str
    updated_at: str
    buyer_name: Optional[str] = None
    artisan_name: Optional[str] = None
    product_title: Optional[str] = None

    # Frontend compatibility
    id: Optional[str] = None
    buyerName: Optional[str] = None
    productTitle: Optional[str] = None
    artisanName: Optional[str] = None
    interestType: Optional[str] = None

    def model_post_init(self, __context):
        if not self.id:
            self.id = self.inquiry_id
        if not self.buyerName:
            self.buyerName = self.buyer_name
        if not self.productTitle:
            self.productTitle = self.product_title
        if not self.artisanName:
            self.artisanName = self.artisan_name
        if not self.interestType:
            type_map = {
                InquiryType.RETAIL_PURCHASE: "Direct Purchase Inquiry",
                InquiryType.CUSTOM_ORDER: "Custom Made-to-Order Request",
                InquiryType.BULK_WHOLESALE: "Bulk / Wholesale Order"
            }
            self.interestType = type_map.get(self.type, str(self.type.value))
