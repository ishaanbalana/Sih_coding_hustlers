from enum import Enum
from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel, Field

class VerificationStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"

class ProductStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    VERIFIED = "VERIFIED"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"
    PUBLISHED = "PUBLISHED"

class InquiryType(str, Enum):
    RETAIL_PURCHASE = "RETAIL_PURCHASE"
    CUSTOM_ORDER = "CUSTOM_ORDER"
    BULK_WHOLESALE = "BULK_WHOLESALE"

class InquiryStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"

class MarketDemand(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Language(str, Enum):
    EN = "EN"
    HI = "HI"

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: Optional[str] = None
    data: Optional[T] = None
