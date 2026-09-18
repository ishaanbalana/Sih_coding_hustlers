"""
CRAFTORA Smart Pricing Calculation Engine.
Calculates transparent cost itemization (Materials + Artisan Labour + Packaging)
and produces AI Indicative Recommended Selling Prices with margin breakdowns.
Artisans retain full manual override control over their final prices.
"""

from typing import Dict, Any

class PricingService:
    @staticmethod
    def calculate_pricing(
        material_cost: float,
        labour_cost: float,
        production_days: int = 1,
        packaging_cost: float = 0.0,
        market_demand: str = "medium"
    ) -> Dict[str, Any]:
        """
        Calculates total production cost and AI indicative selling range.
        Formula:
        Total Cost = Material + Labour + Packaging
        Multiplier based on market demand (low: 1.25x, medium: 1.45x, high: 1.55x).
        """
        mat = max(0.0, float(material_cost))
        lab = max(0.0, float(labour_cost))
        pack = max(0.0, float(packaging_cost))
        days = max(1, int(production_days))
        total_cost = round(mat + lab + pack, 2)

        demand_lower = market_demand.lower().strip()
        multipliers = {
            "low": {"base": 1.25, "min": 1.15, "max": 1.35},
            "medium": {"base": 1.45, "min": 1.30, "max": 1.60},
            "high": {"base": 1.55, "min": 1.40, "max": 1.75}
        }
        cfg = multipliers.get(demand_lower, multipliers["medium"])

        suggested_min = round(total_cost * cfg["min"], 2)
        suggested_max = round(total_cost * cfg["max"], 2)
        recommended = round(total_cost * cfg["base"], 2)

        # Round to friendly numbers (e.g. multiples of 10) if total_cost > 50
        if recommended > 50:
            recommended = round(recommended / 10.0) * 10.0

        estimated_profit = round(recommended - total_cost, 2)
        profit_margin = round((estimated_profit / total_cost) * 100.0, 1) if total_cost > 0 else 0.0

        return {
            "material_cost": mat,
            "labour_cost": lab,
            "production_days": days,
            "packaging_cost": pack,
            "total_cost": total_cost,
            "suggested_min_price": suggested_min,
            "suggested_max_price": suggested_max,
            "recommended_price": recommended,
            "estimated_profit": estimated_profit,
            "profit_margin": profit_margin,
            "market_demand": demand_lower.capitalize(),
            "label": "AI Indicative Price Recommendation",
            "disclaimer": "Transparent cost-based recommendation. Artisan holds final pricing authority."
        }
