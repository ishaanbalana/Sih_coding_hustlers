"""
CRAFTORA Rule-Based Buyer Matching Engine.
Matches artisan crafts with commercial and retail buyer profiles.
Clearly labeled as demo rule-based matching.
"""

from typing import List, Dict, Any, Optional
from ..data.demo_data import BUYERS

class MatchingService:
    @staticmethod
    def match_buyers(
        product_id: Optional[str] = None,
        craft_type: Optional[str] = None,
        category: Optional[str] = None,
        price: float = 0.0,
        intended_use: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Rule-based matching algorithm evaluating:
        1. Category & interest overlap (up to 50 points)
        2. Intended use alignment (up to 30 points)
        3. Commercial price fit (up to 20 points)
        """
        cat_lower = (category or "").lower()
        type_lower = (craft_type or "").lower()
        use_lower = (intended_use or "").lower()

        matches = []

        # Iterate over registered buyer profiles
        for buyer_id, buyer in BUYERS.items():
            score = 60  # Base compatibility baseline
            reasons = []

            # 1. Craft interest match
            buyer_interests = [i.lower() for i in buyer.get("interests", [])]
            matched_interest = False
            for bi in buyer_interests:
                if bi in cat_lower or bi in type_lower or cat_lower in bi:
                    score += 24
                    reasons.append(f"Direct match with buyer's sourcing interest in {buyer['interests'][0]}")
                    matched_interest = True
                    break
            
            if not matched_interest:
                # General handicraft fallback interest
                score += 8
                reasons.append(f"Compatible with {buyer.get('buyer_type', 'retailer')} craft sourcing portfolio")

            # 2. Intended use match
            buyer_use = buyer.get("intended_use", "").lower()
            if any(k in buyer_use for k in ["decor", "hospitality", "interior", "boutique"]) and any(k in use_lower or k in cat_lower for k in ["decor", "bamboo", "lamp", "pottery"]):
                score += 12
                reasons.append("High alignment with interior and hospitality project requirements")
            elif "gift" in buyer_use and ("painting" in cat_lower or "madhubani" in cat_lower or price < 1500):
                score += 14
                reasons.append("Optimal price point and format for corporate/executive gifting hampers")

            # 3. Price band fit
            if price > 0:
                if price <= 1000 and buyer.get("buyer_type") in ["Retail Store", "Corporate Gifting Company"]:
                    score += 6
                    reasons.append("High margin resale potential under ₹1,000 retail wholesale threshold")
                elif price > 1000 and buyer.get("buyer_type") in ["Interior Designer", "Art Gallery & Decor", "Boutique"]:
                    score += 6
                    reasons.append("Premium craftsmanship value matches boutique collection tier")

            # Cap score at 98% (no fake 100% certainty)
            final_score = min(96, max(65, score))

            matches.append({
                "id": f"MATCH-{buyer_id}",
                "buyer_id": buyer_id,
                "buyer_name": buyer.get("name", "Verified Buyer"),
                "buyer_type": buyer.get("buyer_type", "Commercial Buyer"),
                "buyer_category": buyer.get("buyer_type", "Handicraft Buyer"),
                "match_percentage": final_score,
                "match_score": final_score,
                "looking_for": ", ".join(buyer.get("interests", ["Handicrafts"])),
                "requirement": buyer.get("intended_use", "Sourcing authentic Indian handicrafts"),
                "reason": "; ".join(reasons)
            })

        # Sort descending by match score
        matches.sort(key=lambda m: m["match_score"], reverse=True)

        return {
            "matches": matches,
            "mode": "demo rule-based matching",
            "disclaimer": "Rule-based algorithmic matching based on buyer profiles and craft criteria. Not machine-learning inference."
        }
