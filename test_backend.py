"""
Comprehensive Test Script for CRAFTORA FastAPI Backend.
Verifies all 15+ API endpoint groups, validation errors, and lifecycle linkages.
"""

import sys
import urllib.request
import urllib.error
import json

BASE_URL = "http://127.0.0.1:8000"

def request(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"} if data else {}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status_code = resp.status
            res_data = json.loads(resp.read().decode("utf-8"))
            return status_code, res_data
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except:
            return e.code, {"error": err_body}

def run_tests():
    passed = 0
    total = 0

    def assert_test(name, condition, msg=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  [PASS] {name}")
        else:
            print(f"  [FAIL] {name}: {msg}")
            sys.exit(1)

    print("\n--- 1. Testing Health Endpoint ---")
    code, data = request("/api/health")
    assert_test("Health Check", code == 200 and data.get("status") == "ok")

    print("\n--- 2. Testing Artisan Management ---")
    # Get initial artisan
    code, art = request("/api/artisans/CRF-ART-001284")
    assert_test("Get Existing Artisan", code == 200 and art.get("name") == "Ramesh Kumar")

    # Create new artisan
    new_art_payload = {
        "name": "Sunita Sharma",
        "craft": "Phulkari Embroidery",
        "craft_type": "Geometric Floral Needlework",
        "location": "Amritsar, Punjab",
        "state": "Punjab",
        "bio": "Specializes in traditional silk-thread embroidery on handspun khadi cotton.",
        "years_experience": 12,
        "languages": ["en", "hi", "pa"]
    }
    code, created_art = request("/api/artisans", method="POST", data=new_art_payload)
    assert_test("Create Artisan", code == 201 and "artisan_id" in created_art)
    new_art_id = created_art["artisan_id"]

    # Artisan dashboard
    code, dash = request(f"/api/artisans/{new_art_id}/dashboard")
    assert_test("Artisan Dashboard", code == 200 and "total_products" in dash)

    # Invalid artisan 404
    code, _ = request("/api/artisans/NON_EXISTENT")
    assert_test("Artisan 404 on Invalid ID", code == 404)

    print("\n--- 3. Testing Product Management ---")
    # Create product for new artisan
    new_prod_payload = {
        "artisan_id": new_art_id,
        "name": "Handmade Phulkari Dupatta",
        "category": "Phulkari Embroidery",
        "craft_type": "Pat Silk Embroidery",
        "description": "Exquisite bridal phulkari scarf crafted with vibrant silken geometric motifs.",
        "materials": ["Khadi Cotton", "Pat Silk Thread"],
        "tags": ["Phulkari", "Embroidery", "Punjab", "Dupatta"],
        "production_days": 7,
        "price": 2800.0,
        "cost_breakdown": {
            "material_cost": 750.0,
            "labour_cost": 1200.0,
            "production_days": 7,
            "packaging_cost": 100.0,
            "total_estimated_cost": 2050.0
        }
    }
    code, created_prod = request("/api/products", method="POST", data=new_prod_payload)
    assert_test("Create Product", code == 201 and "product_id" in created_prod)
    new_prod_id = created_prod["product_id"]

    # Get product
    code, prod_res = request(f"/api/products/{new_prod_id}")
    assert_test("Get Product Details", code == 200 and prod_res.get("price") == 2800.0)

    # Product with invalid artisan 400
    invalid_prod = dict(new_prod_payload)
    invalid_prod["artisan_id"] = "INVALID_ARTISAN_ID"
    code, _ = request("/api/products", method="POST", data=invalid_prod)
    assert_test("Product Rejects Non-Existent Artisan", code == 400)

    print("\n--- 4. Testing AI Services ---")
    # AI cataloguing
    code, ai_cat = request("/api/ai/analyze-product", method="POST")
    assert_test("AI Cataloguing Endpoint", code == 200 and ai_cat.get("ai_generated") is True and ai_cat.get("ai_mode") == "demo")

    # Voice to product
    voice_payload = {
        "transcript": "मेरा नाम रमेश है। मैं असम से हूँ और हस्तनिर्मित बाँस की टोकरी बनाता हूँ।",
        "language": "HI",
        "artisan_id": new_art_id
    }
    code, voice_res = request("/api/ai/voice-to-product", method="POST", data=voice_payload)
    assert_test("Voice to Product Processing", code == 200 and "category" in voice_res and voice_res.get("ai_mode") == "demo")

    # Image enhancement
    code, enh_res = request("/api/ai/enhance-image", method="POST")
    assert_test("AI Image Enhancement Demo", code == 200 and enh_res.get("success") is True and enh_res.get("mode") == "demo")

    print("\n--- 5. Testing Smart Pricing Engine ---")
    pricing_payload = {
        "material_cost": 450,
        "labour_cost": 600,
        "production_days": 3,
        "packaging_cost": 100,
        "market_demand": "medium"
    }
    code, price_res = request("/api/pricing/calculate", method="POST", data=pricing_payload)
    assert_test("Pricing Total Cost & Margin", code == 200 and price_res.get("total_cost") == 1150.0 and "recommended_price" in price_res)

    print("\n--- 6. Testing Buyer Management & Matching ---")
    # Matching
    match_payload = {
        "craft_type": "Phulkari Embroidery",
        "category": "Phulkari Embroidery",
        "price": 2800.0,
        "intended_use": "Boutique fashion and traditional bridal collection"
    }
    code, match_res = request("/api/buyers/match", method="POST", data=match_payload)
    assert_test("Buyer Matching", code == 200 and len(match_res.get("matches", [])) > 0 and match_res.get("mode") == "demo rule-based matching")

    # List buyers
    code, buyers_list = request("/api/buyers")
    assert_test("List Buyers", code == 200 and len(buyers_list) >= 3)

    print("\n--- 7. Testing Buyer Inquiries (Direct Connect) ---")
    inquiry_payload = {
        "buyer_id": "BUY-001",
        "artisan_id": new_art_id,
        "product_id": new_prod_id,
        "type": "CUSTOM_ORDER",
        "message": "We would like to order 10 custom Phulkari dupattas in maroon and gold.",
        "quantity": 10
    }
    code, inq_res = request("/api/inquiries", method="POST", data=inquiry_payload)
    assert_test("Create Buyer Inquiry", code == 201 and inq_res.get("status") == "PENDING")
    inq_id = inq_res["inquiry_id"]

    # Patch inquiry
    code, inq_patched = request(f"/api/inquiries/{inq_id}", method="PATCH", data={"status": "ACCEPTED"})
    assert_test("Update Inquiry Status to ACCEPTED", code == 200 and inq_patched.get("status") == "ACCEPTED")

    print("\n--- 8. Testing Digital Product Passports & Provenance ---")
    # Get passport by product
    code, pass_res = request(f"/api/products/{new_prod_id}/passport")
    assert_test("Get Product DPP", code == 200 and "passport_id" in pass_res)
    passport_id = pass_res["passport_id"]

    # Record provenance event
    evt_payload = {
        "passport_id": passport_id,
        "event_type": "QUALITY_INSPECTED",
        "description": "Weave tightness and natural dye fastness verified by Master Artisan Guild",
        "status": "Completed"
    }
    code, evt_res = request("/api/provenance/events", method="POST", data=evt_payload)
    assert_test("Record Provenance Event", code == 201 and evt_res.get("record_hash", "").startswith("0x"))

    print("\n--- 9. Testing Public QR Verification Endpoint ---")
    code, verify_res = request(f"/api/verify/{passport_id}")
    assert_test("QR Public Verification Endpoint", code == 200 and verify_res.get("passport_id") == passport_id)

    print("\n--- 10. Testing Admin Portal & Approvals ---")
    # Admin dashboard
    code, admin_dash = request("/api/admin/dashboard")
    assert_test("Admin Dashboard Metrics", code == 200 and "total_products" in admin_dash and "total_artisans" in admin_dash)

    # Approve product
    code, approved_prod = request(f"/api/admin/products/{new_prod_id}/approve", method="POST", data={"review_note": "Verified by Admin (Heritage Craft Board)"})
    assert_test("Admin Approves Product", code == 200 and approved_prod.get("status") == "VERIFIED")

    # Re-verify public endpoint now shows verified = True
    code, re_verify = request(f"/api/verify/{passport_id}")
    assert_test("Public Verification Reflects Admin Approval", code == 200 and re_verify.get("verified") is True)

    print(f"\n==========================================")
    print(f"ALL TESTS PASSED! ({passed}/{total})")
    print(f"==========================================\n")

if __name__ == "__main__":
    run_tests()
