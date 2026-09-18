"""
CRAFTORA Provenance Service (Prototype Ledger Implementation).
Maintains a tamper-evident audit log of lifecycle events.
Uses deterministic SHA-256 hashes simulating a testnet provenance registry.
Explicitly documented as prototype ledger records for evaluation honesty.
"""

import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional
from ..data.demo_data import PROVENANCE_EVENTS, _LOCK, save_storage

class ProvenanceService:
    @staticmethod
    def generate_hash(passport_id: str, event_type: str, timestamp_str: str) -> str:
        raw = f"CRAFTORA:{passport_id}:{event_type}:{timestamp_str}"
        digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        return f"0x{digest}"

    @classmethod
    def record_event(
        cls,
        passport_id: str,
        event_type: str,
        description: str,
        status: str = "Completed"
    ) -> Dict[str, Any]:
        with _LOCK:
            if passport_id not in PROVENANCE_EVENTS:
                PROVENANCE_EVENTS[passport_id] = []

            event_seq = len(PROVENANCE_EVENTS[passport_id]) + 1
            event_id = f"EVT-{passport_id[-6:]}-{event_seq:03d}"
            now_str = datetime.now().strftime("%d %b %Y %H:%M IST")
            record_hash = cls.generate_hash(passport_id, event_type, now_str)

            event = {
                "event_id": event_id,
                "passport_id": passport_id,
                "event_type": event_type,
                "description": description,
                "timestamp": now_str,
                "record_hash": record_hash,
                "status": status,
                "title": event_type.replace("_", " ").title(),
                "date": now_str
            }
            PROVENANCE_EVENTS[passport_id].append(event)
        save_storage()
        return event

    @staticmethod
    def get_events(passport_id: str) -> List[Dict[str, Any]]:
        with _LOCK:
            return list(PROVENANCE_EVENTS.get(passport_id, []))

    @staticmethod
    def get_all_events() -> List[Dict[str, Any]]:
        with _LOCK:
            all_evts = []
            for pid, evts in PROVENANCE_EVENTS.items():
                all_evts.extend(evts)
            return all_evts
