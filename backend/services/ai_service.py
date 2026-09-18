"""
CRAFTORA AI Service (Demo Mode / Prototype Implementation).
Provides image classification heuristics, multilingual transcript extraction,
and image enhancement simulation.
All responses are explicitly tagged with ai_mode: "demo".
Easy to plug in Google Gemini Vision or OpenAI multimodal API.
"""

import re
from typing import Optional, Dict, Any, List

CRAFT_KNOWLEDGE_BASE = {
    "bamboo": {
        "category": "Bamboo Craft",
        "craft_type": "Assamese Split Bamboo Weaving",
        "default_title": "Handcrafted Bamboo Woven Craft",
        "description": "Eco-friendly, lightweight handcrafted bamboo piece woven with traditional split-cane techniques.",
        "materials": ["Natural Bamboo", "Cane Binding"],
        "tags": ["Handmade", "Eco-friendly", "Traditional", "Bamboo", "Sustainable"],
        "production_time": "2-3 Days",
        "confidence": 0.94
    },
    "pottery": {
        "category": "Blue Pottery",
        "craft_type": "Glazed Quartz Ceramic Artwork",
        "default_title": "Jaipur Blue Glazed Decorative Pottery",
        "description": "Handcrafted quartz-based blue pottery with cobalt and copper oxide floral motifs.",
        "materials": ["Quartz Powder", "Natural Glaze", "Fuller's Earth"],
        "tags": ["Pottery", "Ceramic", "Jaipur", "Blue Glaze", "Home Decor"],
        "production_time": "4 Days",
        "confidence": 0.92
    },
    "madhubani": {
        "category": "Madhubani Painting",
        "craft_type": "Mithila Folk Painting on Handmade Paper",
        "default_title": "Traditional Madhubani Folk Art",
        "description": "Authentic Mithila folk painting created using natural mineral dyes, twigs, and fine line techniques.",
        "materials": ["Handmade Paper", "Natural Mineral Dyes", "Soot Pigment"],
        "tags": ["Folk Art", "Painting", "Madhubani", "Heritage", "Natural Dyes"],
        "production_time": "5 Days",
        "confidence": 0.96
    },
    "textile": {
        "category": "Handloom Weaving",
        "craft_type": "Heritage Handloom Loom Work",
        "default_title": "Authentic Handloom Heritage Textile",
        "description": "Handwoven heritage fabric with artisanal border patterns and natural thread dyes.",
        "materials": ["Pure Cotton", "Silk Thread", "Natural Vegetable Dyes"],
        "tags": ["Handloom", "Textile", "Heritage", "Sustainable"],
        "production_time": "6 Days",
        "confidence": 0.91
    },
    "terracotta": {
        "category": "Terracotta Clay Work",
        "craft_type": "Kiln-Fired Clay Sculpture",
        "default_title": "Hand-Moulded Terracotta Sculpture",
        "description": "Hand-moulded natural clay craft kiln-fired for authentic earthy warmth and texture.",
        "materials": ["Riverbed Clay", "Natural Earth Pigments"],
        "tags": ["Terracotta", "Clay", "Handmade", "Earthy"],
        "production_time": "3 Days",
        "confidence": 0.89
    }
}

class AIService:
    @staticmethod
    def analyze_product_image(
        filename: Optional[str] = None,
        artisan_id: Optional[str] = None,
        artisan_craft: Optional[str] = None,
        language: str = "EN"
    ) -> Dict[str, Any]:
        """
        Demo AI vision analyzer.
        Inspects filename hints and artisan context to produce realistic catalogue data.
        """
        name_lower = (filename or "").lower()
        craft_lower = (artisan_craft or "").lower()
        combined = f"{name_lower} {craft_lower}"

        selected_key = "bamboo"
        for key in CRAFT_KNOWLEDGE_BASE:
            if key in combined:
                selected_key = key
                break
        
        info = CRAFT_KNOWLEDGE_BASE[selected_key]

        if language.upper() == "HI":
            descriptions = {
                "bamboo": "पारंपरिक असमी बुनाई तकनीक से बना हस्तनिर्मित पर्यावरण-अनुकूल बाँस का उत्पाद।",
                "pottery": "पारंपरिक जयपुरी नीली मिट्टी के बर्तन, प्राकृतिक रंगों और हाथ की नक्काशी के साथ।",
                "madhubani": "प्राकृतिक रंगों और हस्तनिर्मित कागज पर बनी पारंपरिक मधुबनी/मिथिला लोक कला।",
                "textile": "प्राकृतिक धागों और पारंपरिक करघे से बुना गया प्रामाणिक हथकरघा वस्त्र।",
                "terracotta": "प्राकृतिक मिट्टी से हाथ से गढ़ी गई सुंदर टेराकोटा कलाकृति।"
            }
            desc = descriptions.get(selected_key, info["description"])
        else:
            desc = info["description"]

        return {
            "ai_generated": True,
            "ai_mode": "demo",
            "ai_model_label": "CRAFTORA Vision Demo Engine (Rule-based Multimodal Mock)",
            "product_name": info["default_title"],
            "category": info["category"],
            "craft_type": info["craft_type"],
            "description": desc,
            "materials": info["materials"],
            "tags": info["tags"],
            "production_time": info["production_time"],
            "confidence": info["confidence"],
            "disclaimer": "AI Generated / Demo AI. Artisan can edit and override all generated attributes."
        }

    @staticmethod
    def voice_to_product(transcript: str, language: str = "EN", artisan_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Parses spoken artisan description (Hindi or English) into structured catalog fields.
        """
        t = transcript.strip()
        t_lower = t.lower()

        # Detect craft keyword
        detected_category = "Bamboo Craft"
        craft_type = "Handwoven Bamboo Work"
        materials = ["Natural Bamboo"]

        if any(w in t_lower for w in ["pottery", "ceramic", "मिट्टी", "बर्तन", "घड़ा"]):
            detected_category = "Blue Pottery"
            craft_type = "Glazed Quartz Ceramic"
            materials = ["Quartz Powder", "Glaze"]
        elif any(w in t_lower for w in ["madhubani", "mithila", "painting", "चित्र", "पेंटिंग"]):
            detected_category = "Madhubani Painting"
            craft_type = "Mithila Folk Painting"
            materials = ["Handmade Paper", "Natural Dyes"]
        elif any(w in t_lower for w in ["saree", "shawl", "cloth", "textile", "कपड़ा", "साड़ी"]):
            detected_category = "Handloom Weaving"
            craft_type = "Traditional Loom Weave"
            materials = ["Pure Cotton", "Silk"]
        elif any(w in t_lower for w in ["terracotta", "clay", "टेराकोटा"]):
            detected_category = "Terracotta Clay Work"
            craft_type = "Kiln-Fired Clay"
            materials = ["Riverbed Clay"]

        # Extract title from first sentence
        first_sentence = re.split(r"[.।\n]", t)[0].strip()
        product_name = first_sentence if (5 < len(first_sentence) < 60) else f"Handcrafted {detected_category}"

        # Location heuristic
        location = "Assam, India"
        loc_match = re.search(r"(?:from|in|live in|रहता हूँ|रहती हूँ|से हूँ)\s+([a-zA-Z\u0900-\u097f ,]+)", t, re.IGNORECASE)
        if loc_match:
            location = loc_match.group(1).strip()

        return {
            "ai_generated": True,
            "ai_mode": "demo",
            "product_name": product_name,
            "category": detected_category,
            "craft_type": craft_type,
            "description": t if len(t) > 10 else f"Authentic handcrafted {detected_category}.",
            "materials": materials,
            "production_time": "2-3 Days",
            "location": location,
            "confidence": 0.91,
            "disclaimer": "AI Generated / Demo AI. Review and edit before saving."
        }

    @staticmethod
    def enhance_image(image_bytes: Optional[bytes] = None, filename: str = "craft.png") -> Dict[str, Any]:
        """
        Demo image enhancement simulation.
        Clearly states that this is prototype contrast & lighting normalization.
        """
        return {
            "success": True,
            "mode": "demo",
            "message": "Demo image enhancement completed (simulated white balance & background illumination)",
            "image_url": f"assets/{filename}",
            "original_filename": filename,
            "filters_applied": [
                "Auto-Exposure Correction (Simulated)",
                "Warm Heritage Colour Temperature Balancing",
                "Studio Lighting Shadow Reduction"
            ]
        }
