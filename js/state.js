/* ==========================================================================
   CRAFTORA - Global Reactive State Management & Persistence Store
   ========================================================================== */

import { INITIAL_ARTISANS, INITIAL_PRODUCTS, INITIAL_BUYER_REQUESTS, INITIAL_ADMIN_STATS } from './data/mockData.js';

const STORAGE_KEY = 'CRAFTORA_STATE_V1';

class AppStateStore {
  constructor() {
    this.listeners = [];
    this.loadState();
  }

  loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved CRAFTORA state, resetting...', e);
        this.initDefaultState();
      }
    } else {
      this.initDefaultState();
    }
  }

  initDefaultState() {
    this.data = {
      // Role & Navigation State
      currentRole: 'artisan', // 'artisan' | 'buyer' | 'admin'
      language: 'EN', // 'EN' | 'HI'
      activeArtisanScreen: 'dashboard', // 'landing', 'onboarding', 'profile_step1', 'welcome', 'add_product', 'ai_analysis', 'review_product', 'smart_pricing', 'market_matches', 'passport', 'provenance', 'verify_qr', 'dashboard', 'my_crafts', 'product_detail', 'edit_product'
      activeBuyerScreen: 'explore', // 'welcome', 'register', 'explore', 'product_detail', 'artisan_story', 'passport', 'scan_qr', 'connect', 'connect_success', 'profile'
      activeAdminScreen: 'dashboard', // 'login', 'dashboard', 'artisan_list', 'product_list', 'provenance_logs', 'review_detail'

      // Authentication & Onboarding State
      artisanAuth: {
        isRegistered: true, // true = returning artisan (lands on dashboard), false = new artisan (onboarding)
        artisanProfile: INITIAL_ARTISANS[0]
      },
      buyerAuth: {
        isRegistered: false, // false = new or guest buyer, true = registered buyer
        isGuest: true,
        buyerName: 'Arjun Sharma',
        mobileNumber: '+91 9876543210'
      },
      adminAuth: {
        isLoggedIn: true,
        adminId: 'ADMIN-IND-902'
      },

      // Core Data Collections
      artisans: INITIAL_ARTISANS,
      products: INITIAL_PRODUCTS,
      buyerRequests: INITIAL_BUYER_REQUESTS,
      adminStats: INITIAL_ADMIN_STATS,

      // Active Selection & Temporary States
      selectedProductId: 'CRF-BAM-001284',
      selectedArtisanId: 'CRF-ART-001284',
      productCreationDraft: null,
      adminReviewingTarget: null, // { type: 'product'|'artisan', item: Object }
      isVoiceModalOpen: false,
      voiceTranscript: '',
      isQRScannerOpen: false,
      scannedQRProduct: null
    };
    this.saveState();
  }

  saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.saveState();
    this.listeners.forEach(listener => listener(this.data));
  }

  // State Mutators
  setRole(role) {
    this.data.currentRole = role;
    this.notify();
  }

  setLanguage(lang) {
    this.data.language = lang;
    this.notify();
  }

  setArtisanScreen(screen, params = {}) {
    this.data.activeArtisanScreen = screen;
    if (params.productId) this.data.selectedProductId = params.productId;
    if (params.artisanId) this.data.selectedArtisanId = params.artisanId;
    this.notify();
  }

  setBuyerScreen(screen, params = {}) {
    this.data.activeBuyerScreen = screen;
    if (params.productId) this.data.selectedProductId = params.productId;
    if (params.artisanId) this.data.selectedArtisanId = params.artisanId;
    this.notify();
  }

  setAdminScreen(screen, params = {}) {
    this.data.activeAdminScreen = screen;
    if (params.target) this.data.adminReviewingTarget = params.target;
    this.notify();
  }

  toggleArtisanOnboardingState(isRegistered) {
    this.data.artisanAuth.isRegistered = isRegistered;
    if (isRegistered) {
      this.data.activeArtisanScreen = 'dashboard';
    } else {
      this.data.activeArtisanScreen = 'onboarding';
    }
    this.notify();
  }

  toggleBuyerAuthState(isRegistered, isGuest = false) {
    this.data.buyerAuth.isRegistered = isRegistered;
    this.data.buyerAuth.isGuest = isGuest;
    this.data.activeBuyerScreen = 'explore';
    this.notify();
  }

  addProduct(newProduct) {
    this.data.products.unshift(newProduct);
    this.data.selectedProductId = newProduct.id;
    this.data.adminStats.productVerificationPending += 1;
    this.data.adminStats.registeredProducts += 1;
    this.notify();
  }

  updateProduct(updatedProduct) {
    const index = this.data.products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      this.data.products[index] = { ...this.data.products[index], ...updatedProduct };
      this.notify();
    }
  }

  addBuyerRequest(request) {
    this.data.buyerRequests.unshift(request);
    this.notify();
  }

  adminDecision(productId, decision, reviewNote) {
    const product = this.data.products.find(p => p.id === productId);
    if (product) {
      if (decision === 'approve') {
        product.status = 'verified';
        product.passportAvailable = true;
        product.blockchainRecord.events.push({
          title: 'Verification Approved',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: 'Completed (Reviewed Registration Info)'
        });
        if (this.data.adminStats.productVerificationPending > 0) {
          this.data.adminStats.productVerificationPending -= 1;
        }
      } else if (decision === 'request_changes') {
        product.status = 'changes_requested';
        product.reviewNote = reviewNote;
      }
      this.notify();
    }
  }

  openVoiceModal(onSpeechExtracted) {
    this.data.isVoiceModalOpen = true;
    this.onSpeechExtracted = onSpeechExtracted;
    this.notify();
  }

  closeVoiceModal() {
    this.data.isVoiceModalOpen = false;
    this.notify();
  }

  triggerVoiceDemo() {
    this.data.voiceTranscript = "मेरा नाम रमेश है। मैं असम से हूँ। मैं बाँस की टोकरी बनाता हूँ।";
    const extracted = {
      name: "Ramesh Kumar",
      craft: "Bamboo Craft",
      location: "Assam, India",
      materials: "Natural Bamboo",
      description: "Handcrafted bamboo basket made with traditional techniques."
    };
    if (this.onSpeechExtracted) {
      this.onSpeechExtracted(extracted);
    }
    this.closeVoiceModal();
  }

  resetAllData() {
    localStorage.removeItem(STORAGE_KEY);
    this.initDefaultState();
    this.notify();
  }
}

export const appState = new AppStateStore();
