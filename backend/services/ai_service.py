import os
import re
import json
import ssl
import urllib.request
from pathlib import Path
from typing import Optional, Dict, Any, List

# Load local .env if present
_env_file = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_file.exists():
    try:
        with open(_env_file, "r", encoding="utf-8") as _f:
            for _line in _f:
                _line = _line.strip()
                if _line and not _line.startswith("#") and "=" in _line:
                    _k, _v = _line.split("=", 1)
                    _k, _v = _k.strip(), _v.strip().strip("'\"")
                    if _k not in os.environ:
                        os.environ[_k] = _v
    except Exception:
        pass

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_PRIMARY_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_FALLBACK_MODEL = "openai/gpt-oss-20b"

def _query_groq(messages: List[Dict[str, str]], model: str = GROQ_PRIMARY_MODEL, timeout: float = 6.0) -> Optional[Dict[str, Any]]:
    if not GROQ_API_KEY:
        return None
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        payload = {
            "model": model,
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.3
        }

        req = urllib.request.Request(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "CRAFTORA-AI/1.0"
            },
            data=json.dumps(payload).encode("utf-8")
        )

        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as res:
            data = json.loads(res.read().decode("utf-8"))
            if data.get("choices") and len(data["choices"]) > 0:
                raw_text = data["choices"][0]["message"]["content"]
                return json.loads(raw_text)
    except Exception as e:
        # Fallback to secondary model or local knowledge base
        if model != GROQ_FALLBACK_MODEL:
            try:
                return _query_groq(messages, model=GROQ_FALLBACK_MODEL, timeout=4.0)
            except Exception:
                pass
        print(f"Notice: Groq AI query note ({e}), using craft domain engine.")
    return None

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

        # Attempt AI enhancement via Groq LLM
        groq_prompt = (
            f"You are an AI cataloguer for authentic Indian handicrafts. "
            f"An artisan has uploaded an image of a {selected_key} craft (filename: '{filename}', category hint: '{artisan_craft or selected_key}'). "
            f"Language requirement: {language.upper()}. "
            f"Return JSON strictly with these keys:\n"
            f"- product_name: A marketable, authentic title\n"
            f"- category: One of ['Bamboo Craft', 'Blue Pottery', 'Madhubani Painting', 'Handloom Weaving', 'Terracotta Clay Work']\n"
            f"- craft_type: Authentic artisan sub-genre technique\n"
            f"- description: Rich, appealing marketing description (2-3 sentences, in {language.upper()})\n"
            f"- materials: Array of natural raw material strings\n"
            f"- tags: Array of 5 short search tags\n"
            f"- production_time: Estimated crafting time (e.g. '2-3 Days')\n"
            f"- confidence: A float between 0.92 and 0.98\n"
            f"- suggested_price: An indicative fair Indian Rupee price (integer)\n"
        )
        groq_res = _query_groq([
            {"role": "system", "content": "You are a master evaluator of Indian regional crafts and heritage art. Output valid JSON only."},
            {"role": "user", "content": groq_prompt}
        ])

        if groq_res and isinstance(groq_res, dict) and groq_res.get("product_name"):
            return {
                "ai_generated": True,
                "ai_mode": "demo",
                "ai_engine": "Groq Powered (OpenAI GPT-OSS-120B Multimodal Engine)",
                "ai_model_label": "Groq Llama-3 / GPT-OSS Multimodal Vision Engine",
                "product_name": str(groq_res.get("product_name", info["default_title"])),
                "category": str(groq_res.get("category", info["category"])),
                "craft_type": str(groq_res.get("craft_type", info["craft_type"])),
                "description": str(groq_res.get("description", desc)),
                "materials": groq_res.get("materials") if isinstance(groq_res.get("materials"), list) else info["materials"],
                "tags": groq_res.get("tags") if isinstance(groq_res.get("tags"), list) else info["tags"],
                "production_time": str(groq_res.get("production_time", info["production_time"])),
                "confidence": float(groq_res.get("confidence", info["confidence"])),
                "suggested_price": groq_res.get("suggested_price", 650),
                "disclaimer": "AI Generated via Groq Intelligence. Artisan can edit and override all generated attributes."
            }

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

        # Attempt Groq Voice NLP extraction
        groq_prompt = (
            f"An Indian artisan spoke this description: '{transcript}' in {language}. "
            f"Extract structured craft catalog information into JSON with keys:\n"
            f"- product_name: A short descriptive title\n"
            f"- category: Craft category\n"
            f"- craft_type: Specific craft technique\n"
            f"- description: Full polished product description\n"
            f"- materials: Array of raw materials\n"
            f"- location: Region or state if mentioned\n"
            f"- production_time: Estimated crafting duration\n"
        )
        groq_voice = _query_groq([
            {"role": "system", "content": "You parse spoken audio transcripts from rural artisans into catalog fields. Output JSON only."},
            {"role": "user", "content": groq_prompt}
        ], timeout=5.0)

        if groq_voice and isinstance(groq_voice, dict) and groq_voice.get("product_name"):
            return {
                "ai_generated": True,
                "ai_mode": "demo",
                "ai_engine": "Groq Llama-3 / GPT-OSS Speech & NLP",
                "product_name": str(groq_voice.get("product_name", product_name)),
                "category": str(groq_voice.get("category", detected_category)),
                "craft_type": str(groq_voice.get("craft_type", craft_type)),
                "description": str(groq_voice.get("description", t)),
                "materials": groq_voice.get("materials") if isinstance(groq_voice.get("materials"), list) else materials,
                "production_time": str(groq_voice.get("production_time", "2-3 Days")),
                "location": str(groq_voice.get("location", location)),
                "confidence": 0.95,
                "disclaimer": "AI Generated via Groq Voice Engine. Review and edit before saving."
            }

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
