/* ==========================================================================
   CRAFTORA - Frontend API Client Service
   Communicates with FastAPI backend on http://localhost:8000/api
   Provides automatic fallback if the backend server is temporarily unreachable.
   ========================================================================== */

const API_BASE = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE;
    this.isBackendAvailable = false;
    this.checkHealth();
  }

  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        this.isBackendAvailable = true;
        console.log('⚡ CRAFTORA Backend API connected:', this.baseUrl);
        return true;
      }
    } catch (e) {
      this.isBackendAvailable = false;
      console.warn('ℹ CRAFTORA Backend not reachable at', this.baseUrl, '- operating in offline demo mode.');
    }
    return false;
  }

  // ── Products ──────────────────────────────────────────────────────────
  async getProducts() {
    try {
      const res = await fetch(`${this.baseUrl}/products`);
      if (!res.ok) throw new Error('Failed to fetch products');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async getProduct(productId) {
    try {
      const res = await fetch(`${this.baseUrl}/products/${productId}`);
      if (!res.ok) throw new Error('Product not found');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async createProduct(productData) {
    try {
      const res = await fetch(`${this.baseUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (!res.ok) throw new Error('Failed to create product');
      return await res.json();
    } catch (e) {
      console.warn('Backend product creation error:', e);
      return null;
    }
  }

  async updateProduct(productId, productData) {
    try {
      const res = await fetch(`${this.baseUrl}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (!res.ok) throw new Error('Failed to update product');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // ── Artisans ─────────────────────────────────────────────────────────
  async getArtisans() {
    try {
      const res = await fetch(`${this.baseUrl}/artisans`);
      if (!res.ok) throw new Error('Failed to fetch artisans');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async createArtisan(artisanData) {
    try {
      const res = await fetch(`${this.baseUrl}/artisans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(artisanData)
      });
      if (!res.ok) throw new Error('Failed to create artisan');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async getArtisanDashboard(artisanId) {
    try {
      const res = await fetch(`${this.baseUrl}/artisans/${artisanId}/dashboard`);
      if (!res.ok) throw new Error('Failed to fetch artisan dashboard');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // ── AI Services ──────────────────────────────────────────────────────
  async analyzeProductImage(filename, artisanId, language = 'EN') {
    try {
      const formData = new FormData();
      if (filename) formData.append('filename', filename);
      if (artisanId) formData.append('artisan_id', artisanId);
      formData.append('language', language);

      const res = await fetch(`${this.baseUrl}/ai/analyze-product`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('AI analysis failed');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async voiceToProduct(transcript, language = 'EN', artisanId = null) {
    try {
      const res = await fetch(`${this.baseUrl}/ai/voice-to-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, language, artisan_id: artisanId })
      });
      if (!res.ok) throw new Error('Voice extraction failed');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async enhanceImage(filename) {
    try {
      const res = await fetch(`${this.baseUrl}/ai/enhance-image`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Enhancement failed');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // ── Smart Pricing ────────────────────────────────────────────────────
  async calculatePricing(pricingData) {
    try {
      const res = await fetch(`${this.baseUrl}/pricing/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingData)
      });
      if (!res.ok) throw new Error('Pricing calculation failed');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // ── Buyer Matching ───────────────────────────────────────────────────
  async matchBuyers(matchCriteria) {
    try {
      const res = await fetch(`${this.baseUrl}/buyers/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchCriteria)
      });
      if (!res.ok) throw new Error('Buyer matching failed');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // ── Inquiries ────────────────────────────────────────────────────────
  async createInquiry(inquiryData) {
    try {
      const res = await fetch(`${this.baseUrl}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryData)
      });
      if (!res.ok) throw new Error('Inquiry creation failed');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async getInquiries(filter = {}) {
    try {
      const query = new URLSearchParams(filter).toString();
      const res = await fetch(`${this.baseUrl}/inquiries${query ? '?' + query : ''}`);
      if (!res.ok) throw new Error('Failed to fetch inquiries');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // ── Digital Product Passport & Provenance ───────────────────────────
  async getProductPassport(productId) {
    try {
      const res = await fetch(`${this.baseUrl}/products/${productId}/passport`);
      if (!res.ok) throw new Error('Passport not found');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async verifyPassport(passportOrProductId) {
    try {
      const res = await fetch(`${this.baseUrl}/verify/${passportOrProductId}`);
      if (!res.ok) throw new Error('Verification failed');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // ── Admin Governance ─────────────────────────────────────────────────
  async getAdminDashboard() {
    try {
      const res = await fetch(`${this.baseUrl}/admin/dashboard`);
      if (!res.ok) throw new Error('Admin dashboard failed');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async adminApproveProduct(productId, reviewNote = 'Approved by Administrator') {
    try {
      const res = await fetch(`${this.baseUrl}/admin/products/${productId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_note: reviewNote })
      });
      if (!res.ok) throw new Error('Approval failed');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async adminRequestChanges(productId, reviewNote) {
    try {
      const res = await fetch(`${this.baseUrl}/admin/products/${productId}/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_note: reviewNote })
      });
      if (!res.ok) throw new Error('Request changes failed');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async getAdminProvenance() {
    try {
      const res = await fetch(`${this.baseUrl}/admin/provenance`);
      if (!res.ok) throw new Error('Failed to fetch provenance');
      return await res.json();
    } catch (e) {
      return null;
    }
  }
}

export const apiService = new ApiService();
