from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from typing import Optional
from ..services.pricing_service import PricingService

router = APIRouter(prefix="/api/pricing", tags=["Smart Pricing"])

class PricingCalculationRequest(BaseModel):
    material_cost: float = Field(..., ge=0.0, description="Raw material costs in INR")
    labour_cost: float = Field(..., ge=0.0, description="Artisan wages in INR")
    production_days: int = Field(1, ge=1, le=365, description="Days to produce this craft")
    packaging_cost: float = Field(0.0, ge=0.0, description="Packaging materials cost in INR")
    market_demand: Optional[str] = Field("medium", description="'low', 'medium', or 'high'")

@router.post("/calculate", summary="Calculate Fair Cost Itemization & Indicative Selling Price")
def calculate_pricing(request: PricingCalculationRequest):
    """
    Computes total cost itemization and produces an AI Indicative Recommended Selling Price.
    Transparent formula ensuring fair artisan margins with manual override authority.
    """
    return PricingService.calculate_pricing(
        material_cost=request.material_cost,
        labour_cost=request.labour_cost,
        production_days=request.production_days,
        packaging_cost=request.packaging_cost,
        market_demand=request.market_demand or "medium"
    )
