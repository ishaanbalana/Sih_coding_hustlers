"""
CRAFTORA Digital Product Passport (DPP) Service.
Manages creation, verification linking, and query operations for craft passports.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from ..data.demo_data import PASSPORTS, PRODUCTS, ARTISANS, _LOCK
from .provenance_service import ProvenanceService

class PassportService:
    @classmethod
    def create_passport_for_product(
        cls,
        product_id: str,
        verification_status: str = "PENDING"
    ) -> Dict[str, Any]:
        with _LOCK:
            product = PRODUCTS.get(product_id)
            if not product:
                raise ValueError(f"Product {product_id} not found")

            artisan = ARTISANS.get(product.get("artisan_id", ""))
            artisan_name = artisan.get("name", "Unknown Artisan") if artisan else "Artisan"
            artisan_location = artisan.get("location", "India") if artisan else "India"

            # Check if passport already exists
            for pid, passport in PASSPORTS.items():
                if passport.get("product_id") == product_id:
                    passport["verification_status"] = verification_status
                    return passport

            clean_id = product_id.replace("CRF-", "").replace("PROD-", "")
            passport_id = f"CRF-PAS-{clean_id}"
            reg_date = datetime.now().strftime("%d %b %Y")

            passport = {
                "passport_id": passport_id,
                "product_id": product_id,
                "artisan_id": product.get("artisan_id"),
                "product_name": product.get("name"),
                "craft": product.get("category"),
                "craft_type": product.get("craft_type", product.get("category")),
                "origin": artisan_location,
                "materials": product.get("materials", []),
                "production_time": product.get("production_time", f"{product.get('production_days', 2)} Days"),
                "registration_date": reg_date,
                "verification_status": verification_status,
                "verification_url": f"http://localhost:8000/api/verify/{passport_id}"
            }
            PASSPORTS[passport_id] = passport

        # Record initial provenance events outside the dict lock
        ProvenanceService.record_event(
            passport_id=passport_id,
            event_type="PRODUCT_REGISTERED",
            description=f"Digital passport created for {product.get('name')} by {artisan_name}"
        )
        ProvenanceService.record_event(
            passport_id=passport_id,
            event_type="ARTISAN_LINKED",
            description=f"Authentic origin recorded at {artisan_location}"
        )

        if verification_status == "VERIFIED":
            ProvenanceService.record_event(
                passport_id=passport_id,
                event_type="ADMIN_VERIFIED",
                description="Digital Product Passport approved by CRAFTORA Administrator"
            )

        return passport

    @classmethod
    def get_passport(cls, passport_id: str) -> Optional[Dict[str, Any]]:
        with _LOCK:
            passport = PASSPORTS.get(passport_id)
            if not passport:
                return None
            res = dict(passport)
        res["provenance"] = ProvenanceService.get_events(passport_id)
        return res

    @classmethod
    def get_by_product_id(cls, product_id: str) -> Optional[Dict[str, Any]]:
        with _LOCK:
            target_pid = None
            for pid, p in PASSPORTS.items():
                if p.get("product_id") == product_id:
                    target_pid = pid
                    break
        if target_pid:
            return cls.get_passport(target_pid)
        return None

    @classmethod
    def update_status(cls, passport_id: str, new_status: str, note: Optional[str] = None):
        with _LOCK:
            passport = PASSPORTS.get(passport_id)
            if not passport:
                return None
            passport["verification_status"] = new_status
        
        ProvenanceService.record_event(
            passport_id=passport_id,
            event_type="STATUS_UPDATED",
            description=f"Status updated to {new_status}. {note or ''}".strip()
        )
        return passport
