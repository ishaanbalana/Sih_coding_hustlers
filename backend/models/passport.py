from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from .common import VerificationStatus

class ProvenanceEvent(BaseModel):
    event_id: str
    passport_id: str
    event_type: str
    description: str
    timestamp: str
    record_hash: str
    status: str = "Completed"

    # Frontend display helpers
    title: Optional[str] = None
    date: Optional[str] = None

    def model_post_init(self, __context):
        if not self.title:
            self.title = self.event_type.replace("_", " ").title()
        if not self.date:
            self.date = self.timestamp

class ProvenanceEventCreate(BaseModel):
    passport_id: str
    event_type: str
    description: str
    status: str = "Completed"

class PassportBase(BaseModel):
    product_id: str
    artisan_id: str
    product_name: str
    craft: str
    craft_type: Optional[str] = None
    origin: str
    materials: List[str] = Field(default_factory=list)
    production_time: str = "2 Days"
    verification_status: VerificationStatus = VerificationStatus.PENDING

class PassportCreate(PassportBase):
    passport_id: Optional[str] = None

class PassportResponse(PassportBase):
    passport_id: str
    registration_date: str
    verification_url: str
    provenance: List[ProvenanceEvent] = Field(default_factory=list)
    record_type: str = "Prototype Provenance Record"
    network: str = "Polygon Testnet Demo"
    is_demo: bool = True

class VerificationResponse(BaseModel):
    verified: bool
    passport_id: str
    product_id: str
    product: Dict[str, Any]
    artisan: Dict[str, Any]
    origin: str
    verification_status: str
    provenance: List[Dict[str, Any]]
    verification_message: str
    disclaimer: str = (
        "CRAFTORA verifies the registered digital provenance record. "
        "Blockchain simulation provides a tamper-evident log of platform events; "
        "it does not independently certify physical authenticity."
    )
