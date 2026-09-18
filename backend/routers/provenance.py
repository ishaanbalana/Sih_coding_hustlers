from typing import List
from fastapi import APIRouter, HTTPException, status
from ..models.passport import ProvenanceEvent, ProvenanceEventCreate
from ..services.provenance_service import ProvenanceService
from ..data.demo_data import PASSPORTS, _LOCK

router = APIRouter(prefix="/api/provenance", tags=["Provenance Ledger"])

@router.post("/events", response_model=ProvenanceEvent, status_code=status.HTTP_201_CREATED, summary="Record New Provenance Event")
def record_event(evt_in: ProvenanceEventCreate):
    with _LOCK:
        if evt_in.passport_id not in PASSPORTS:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Passport '{evt_in.passport_id}' not found."
            )

    event = ProvenanceService.record_event(
        passport_id=evt_in.passport_id,
        event_type=evt_in.event_type,
        description=evt_in.description,
        status=evt_in.status
    )
    return ProvenanceEvent(**event)

@router.get("/{passport_id}", response_model=List[ProvenanceEvent], summary="Get Provenance Event Log for Passport")
def get_provenance_events(passport_id: str):
    with _LOCK:
        if passport_id not in PASSPORTS:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Passport '{passport_id}' not found."
            )
    events = ProvenanceService.get_events(passport_id)
    return [ProvenanceEvent(**e) for e in events]
