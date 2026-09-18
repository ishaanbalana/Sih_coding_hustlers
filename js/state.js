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
    if (typeof localStorage === 'undefined') {
      this.initDefaultState();
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        if (!this.data.navigationHistory) {
          this.data.navigationHistory = { artisan: [], buyer: [], admin: [] };
        }
        if (!Array.isArray(this.data.navigationHistory.artisan)) this.data.navigationHistory.artisan = [];
        if (!Array.isArray(this.data.navigationHistory.buyer)) this.data.navigationHistory.buyer = [];
        if (!Array.isArray(this.data.navigationHistory.admin)) this.data.navigationHistory.admin = [];
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
      // Role & Navigation State — Default Screen 1 Role Selection Entry Point
      currentRole: 'landing', // 'landing' | 'artisan' | 'buyer' | 'admin'
      language: 'EN', // 'EN' | 'HI'
      activeArtisanScreen: 'onboarding', // 'onboarding', 'onboarding_otp', 'profile_step1', 'artisan_id_card', 'welcome', 'add_product', 'ai_analysis', 'review_product', 'smart_pricing', 'market_matches', 'passport', 'provenance', 'dashboard', 'my_crafts', 'product_detail', 'edit_product'
      activeBuyerScreen: 'welcome', // 'welcome', 'buyer_mobile', 'buyer_otp', 'register', 'buyer_signin', 'explore', 'product_detail', 'artisan_story', 'passport', 'scan_qr', 'connect', 'connect_success', 'profile'
      activeAdminScreen: 'login', // 'login', 'dashboard', 'artisan_list', 'product_list', 'provenance_logs', 'review_detail'

      // Authentication & Onboarding State
      artisanAuth: {
        isRegistered: false, // false = new artisan starts empty registration; true = returning artisan
        artisanProfile: null
      },
      buyerAuth: {
        isRegistered: false, // false = new or guest buyer, true = registered buyer
        isGuest: false,
        buyerProfile: null,
        buyerName: '',
        mobileNumber: '',
        city: ''
      },
      adminAuth: {
        isLoggedIn: false, // Default unauthenticated; demo login requires admin / admin123
        adminId: 'admin'
      },

      // New Artisan registration draft — ALWAYS starts completely empty
      onboardingDraft: {
        mobileNumber: '',
        otp: '',
        name: '',
        craftCategory: '',
        location: '',
        artisanId: '',
        voiceTranscript: '',
        isVoiceExtracted: false
      },

      // Buyer registration draft
      buyerDraft: {
        mobileNumber: '',
        otp: '',
        name: '',
        city: '',
        buyerId: ''
      },

      // Saved returning profiles for persistence (Separate from new registrations)
      savedArtisans: [
        {
          id: 'CRF-ART-001284',
          name: 'Ramesh Kumar',
          craftCategory: 'Bamboo Craft',
          location: 'Assam, India',
          mobileNumber: '9876543210',
          rating: 4.8,
          ratingCount: 24,
          productsSold: 18,
          totalEarnings: 18650,
          ordersCompleted: 14
        },
        {
          id: 'CRF-ART-001285',
          name: 'Meera Devi',
          craftCategory: 'Madhubani Painting',
          location: 'Bihar, India',
          mobileNumber: '9876543211',
          rating: 4.6,
          ratingCount: 18
        },
        {
          id: 'CRF-ART-001286',
          name: 'Harpreet Singh',
          craftCategory: 'Phulkari Embroidery',
          location: 'Punjab, India',
          mobileNumber: '9876543212',
          rating: 4.7,
          ratingCount: 15
        }
      ],
      savedBuyers: [
        {
          id: 'CRF-BUY-001001',
          name: 'Arjun Sharma',
          mobileNumber: '9876543210',
          city: 'New Delhi'
        }
      ],

      // Core Data Collections
      artisans: JSON.parse(JSON.stringify(INITIAL_ARTISANS)),
      products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
      buyerRequests: JSON.parse(JSON.stringify(INITIAL_BUYER_REQUESTS)),
      adminStats: JSON.parse(JSON.stringify(INITIAL_ADMIN_STATS)),

      // Active Selection & Temporary States
      selectedProductId: 'CRF-BAM-001284',
      selectedArtisanId: 'CRF-ART-001284',
      productCreationDraft: null,
      adminReviewingTarget: null, // { type: 'product'|'artisan', item: Object }
      isVoiceModalOpen: false,
      voiceTranscript: '',
      isQRScannerOpen: false,
      scannedQRProduct: null,
      buyerSearchQuery: '',
      buyerSelectedCategory: 'all',

      // Navigation History Stack
      navigationHistory: {
        artisan: [],
        buyer: [],
        admin: []
      }
    };
    this.saveState();
  }

  saveState() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
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
    if (role === 'admin') {
      if (!this.data.adminAuth?.isLoggedIn) {
        this.data.activeAdminScreen = 'login';
      }
    } else if (role === 'artisan') {
      if (this.data.artisanAuth?.isRegistered) {
        if (!this.data.activeArtisanScreen || this.data.activeArtisanScreen === 'onboarding') {
          this.data.activeArtisanScreen = 'dashboard';
        }
      } else {
        this.data.activeArtisanScreen = 'onboarding';
      }
    }
    this.notify();
  }

  setLanguage(lang) {
    this.data.language = lang;
    this.notify();
  }

  setArtisanScreen(screen, params = {}, options = {}) {
    // 1. Admin must NOT be treated as Artisan
    if (this.data.currentRole === 'admin') {
      console.warn('Unauthorized access attempt to artisan route from admin');
      return { success: false, reason: 'admin_denied' };
    }

    // 2. Authenticated Buyer must NOT access Artisan My Crafts or any artisan screen
    if (this.data.currentRole === 'buyer') {
      console.warn('Unauthorized access attempt to artisan route from buyer');
      return { success: false, reason: 'buyer_denied' };
    }

    const protectedScreens = [
      'dashboard', 'my_crafts', 'product_detail', 'edit_product',
      'add_product', 'ai_analysis', 'review_product', 'smart_pricing',
      'market_matches', 'passport', 'provenance'
    ];

    const isProtected = protectedScreens.includes(screen);
    const isAuthenticated = Boolean(this.data.artisanAuth?.isRegistered);

    // 3. Unauthenticated user:
    // If not authenticated and trying to access a protected artisan route, redirect to Artisan Login ('onboarding')
    if (isProtected && !isAuthenticated) {
      console.warn('Unauthenticated access attempt to protected artisan route:', screen, '-> Redirecting to Artisan Login');
      this.data.currentRole = 'artisan';
      this.data.activeArtisanScreen = 'onboarding';
      this.notify();
      return { success: false, redirectedTo: 'onboarding' };
    }

    // 4. Record navigation history for forward navigation
    if (!options.isBack && !options.replace) {
      if (!this.data.navigationHistory) this.data.navigationHistory = { artisan: [], buyer: [], admin: [] };
      if (!Array.isArray(this.data.navigationHistory.artisan)) this.data.navigationHistory.artisan = [];

      const currentScreen = this.data.activeArtisanScreen;
      const currentProductId = this.data.selectedProductId;

      if (currentScreen && (currentScreen !== screen || (params.productId && params.productId !== currentProductId))) {
        this.data.navigationHistory.artisan.push({
          screen: currentScreen,
          params: {
            productId: currentProductId,
            artisanId: this.data.selectedArtisanId
          }
        });
        if (this.data.navigationHistory.artisan.length > 50) {
          this.data.navigationHistory.artisan.shift();
        }
      }
    }

    // 5. Authenticated Artisan:
    // Protected Artisan route -> allow access directly without login redirect
    this.data.currentRole = 'artisan';
    this.data.activeArtisanScreen = screen;
    if (params.productId) this.data.selectedProductId = params.productId;
    if (params.artisanId) this.data.selectedArtisanId = params.artisanId;
    this.notify();
    return { success: true, screen };
  }

  logoutArtisan() {
    this.data.artisanAuth.isRegistered = false;
    this.data.artisanAuth.artisanProfile = null;
    this.data.activeArtisanScreen = 'onboarding';
    if (this.data.navigationHistory) {
      this.data.navigationHistory.artisan = [];
    }
    this.notify();
  }

  setBuyerScreen(screen, params = {}, options = {}) {
    if (!options.isBack && !options.replace) {
      if (!this.data.navigationHistory) this.data.navigationHistory = { artisan: [], buyer: [], admin: [] };
      if (!Array.isArray(this.data.navigationHistory.buyer)) this.data.navigationHistory.buyer = [];

      const currentScreen = this.data.activeBuyerScreen;
      const currentProductId = this.data.selectedProductId;
      if (currentScreen && (currentScreen !== screen || (params.productId && params.productId !== currentProductId))) {
        this.data.navigationHistory.buyer.push({
          screen: currentScreen,
          params: {
            productId: currentProductId,
            artisanId: this.data.selectedArtisanId
          }
        });
        if (this.data.navigationHistory.buyer.length > 50) {
          this.data.navigationHistory.buyer.shift();
        }
      }
    }

    this.data.activeBuyerScreen = screen;
    if (params.productId) this.data.selectedProductId = params.productId;
    if (params.artisanId) this.data.selectedArtisanId = params.artisanId;
    this.notify();
  }

  setAdminScreen(screen, params = {}, options = {}) {
    // Normal artisan/buyer users cannot access admin routes
    if (this.data.currentRole !== 'admin') {
      console.warn('Unauthorized access attempt to admin route from role:', this.data.currentRole);
      if (this.data.currentRole === 'artisan') {
        this.data.activeArtisanScreen = this.data.artisanAuth?.isRegistered ? 'dashboard' : 'onboarding';
      } else if (this.data.currentRole === 'buyer') {
        this.data.activeBuyerScreen = 'explore';
      } else {
        this.data.currentRole = 'landing';
      }
      this.notify();
      return;
    }

    if (!options.isBack && !options.replace) {
      if (!this.data.navigationHistory) this.data.navigationHistory = { artisan: [], buyer: [], admin: [] };
      if (!Array.isArray(this.data.navigationHistory.admin)) this.data.navigationHistory.admin = [];

      const currentScreen = this.data.activeAdminScreen;
      if (currentScreen && currentScreen !== screen) {
        this.data.navigationHistory.admin.push({
          screen: currentScreen,
          params: {
            target: this.data.adminReviewingTarget
          }
        });
        if (this.data.navigationHistory.admin.length > 50) {
          this.data.navigationHistory.admin.shift();
        }
      }
    }

    if (!this.data.adminAuth?.isLoggedIn) {
      this.data.activeAdminScreen = 'login';
    } else {
      this.data.activeAdminScreen = screen;
    }
    if (params.target) this.data.adminReviewingTarget = params.target;
    this.notify();
  }

  goBack() {
    const role = this.data.currentRole;
    if (role === 'landing') return false;

    if (!this.data.navigationHistory) {
      this.data.navigationHistory = { artisan: [], buyer: [], admin: [] };
    }

    if (role === 'artisan') {
      const current = this.data.activeArtisanScreen;
      if (current === 'onboarding') {
        this.setRole('landing');
        return true;
      }

      const history = this.data.navigationHistory.artisan || [];
      let prev = null;
      while (history.length > 0) {
        const candidate = history.pop();
        if (candidate && (candidate.screen !== current || (candidate.params?.productId && candidate.params.productId !== this.data.selectedProductId))) {
          prev = candidate;
          break;
        }
      }

      if (prev) {
        this.setArtisanScreen(prev.screen, prev.params || {}, { isBack: true });
        return true;
      } else {
        // Fallback: If no previous screen in current app flow, use appropriate role home/dashboard
        const fallbackScreen = this.data.artisanAuth?.isRegistered ? 'dashboard' : 'onboarding';
        if (current !== fallbackScreen) {
          this.setArtisanScreen(fallbackScreen, {}, { isBack: true });
          return true;
        } else if (this.data.artisanAuth?.isRegistered) {
          return false;
        } else {
          this.setRole('landing');
          return true;
        }
      }
    } else if (role === 'buyer') {
      const current = this.data.activeBuyerScreen;
      if (current === 'welcome') {
        this.setRole('landing');
        return true;
      }

      const history = this.data.navigationHistory.buyer || [];
      let prev = null;
      while (history.length > 0) {
        const candidate = history.pop();
        if (candidate && (candidate.screen !== current || (candidate.params?.productId && candidate.params.productId !== this.data.selectedProductId))) {
          prev = candidate;
          break;
        }
      }

      if (prev) {
        this.setBuyerScreen(prev.screen, prev.params || {}, { isBack: true });
        return true;
      } else {
        const fallbackScreen = 'explore';
        if (current !== fallbackScreen) {
          this.setBuyerScreen(fallbackScreen, {}, { isBack: true });
          return true;
        } else {
          this.setRole('landing');
          return true;
        }
      }
    } else if (role === 'admin') {
      const current = this.data.activeAdminScreen;
      if (current === 'login') {
        this.setRole('landing');
        return true;
      }

      const history = this.data.navigationHistory.admin || [];
      let prev = null;
      while (history.length > 0) {
        const candidate = history.pop();
        if (candidate && candidate.screen !== current) {
          prev = candidate;
          break;
        }
      }

      if (prev) {
        this.setAdminScreen(prev.screen, prev.params || {}, { isBack: true });
        return true;
      } else {
        const fallbackScreen = 'dashboard';
        if (current !== fallbackScreen) {
          this.setAdminScreen(fallbackScreen, {}, { isBack: true });
          return true;
        } else {
          this.setRole('landing');
          return true;
        }
      }
    }
    return false;
  }

  loginAdmin(username, password) {
    if (username && username.trim() === 'admin' && password === 'admin123') {
      this.data.adminAuth.isLoggedIn = true;
      this.data.adminAuth.adminId = 'admin';
      this.data.currentRole = 'admin';
      this.data.activeAdminScreen = 'dashboard';
      this.notify();
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials. Demo: admin / admin123' };
  }

  logoutAdmin() {
    this.data.adminAuth.isLoggedIn = false;
    this.data.activeAdminScreen = 'login';
    this.data.currentRole = 'landing';
    this.notify();
  }

  // Artisan Auth Flow Handlers
  startNewArtisanRegistration() {
    this.data.currentRole = 'artisan';
    this.data.activeArtisanScreen = 'onboarding';
    this.data.artisanAuth.isRegistered = false;
    this.data.artisanAuth.artisanProfile = null;
    this.data.onboardingDraft = {
      mobileNumber: '',
      otp: '',
      name: '',
      craftCategory: '',
      location: '',
      artisanId: '',
      voiceTranscript: '',
      isVoiceExtracted: false
    };
    this.notify();
  }

  completeArtisanRegistration(name, craftCategory, location, mobileNumber) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const generatedId = `CRF-ART-${randomSuffix}`;

    const newProfile = {
      id: generatedId,
      name: name || this.data.onboardingDraft?.name || 'Artisan Partner',
      craftCategory: craftCategory || this.data.onboardingDraft?.craftCategory || 'Bamboo Craft',
      location: location || this.data.onboardingDraft?.location || 'India',
      mobileNumber: mobileNumber || this.data.onboardingDraft?.mobileNumber || '9876543210',
      rating: 0,
      ratingCount: 0,
      productsSold: 0,
      totalEarnings: 0,
      ordersCompleted: 0,
      recentSales: [],
      isNewArtisan: true
    };

    this.data.currentRole = 'artisan';
    this.data.artisanAuth.isRegistered = true;
    this.data.artisanAuth.artisanProfile = newProfile;
    this.data.selectedArtisanId = generatedId;

    if (!this.data.savedArtisans) this.data.savedArtisans = [];
    this.data.savedArtisans.push(newProfile);

    if (!this.data.artisans) this.data.artisans = [];
    this.data.artisans.push(newProfile);

    if (this.data.onboardingDraft) {
      this.data.onboardingDraft.artisanId = generatedId;
      this.data.onboardingDraft.name = newProfile.name;
      this.data.onboardingDraft.craftCategory = newProfile.craftCategory;
      this.data.onboardingDraft.location = newProfile.location;
    }

    this.data.activeArtisanScreen = 'artisan_id_card';
    this.notify();
    return newProfile;
  }

  loginReturningArtisan(mobileNumber = '9876543210') {
    const cleanNumber = (mobileNumber || '').replace(/\D/g, '');
    const found = (this.data.savedArtisans || []).find(a => (a.mobileNumber || '').replace(/\D/g, '') === cleanNumber)
      || (this.data.artisans || []).find(a => (a.mobileNumber || '').replace(/\D/g, '') === cleanNumber)
      || (this.data.savedArtisans || [])[0]
      || INITIAL_ARTISANS[0];

    this.data.currentRole = 'artisan';
    this.data.artisanAuth.isRegistered = true;
    this.data.artisanAuth.artisanProfile = { ...found };
    this.data.selectedArtisanId = found.id;
    this.data.activeArtisanScreen = 'dashboard';
    this.notify();
    return { success: true, profile: found };
  }

  toggleArtisanOnboardingState(isRegistered) {
    if (isRegistered) {
      this.loginReturningArtisan();
    } else {
      this.startNewArtisanRegistration();
    }
  }

  rateArtisan(artisanId, rating) {
    const num = Number(rating);
    if (!artisanId || isNaN(num) || num < 1 || num > 5) {
      return { success: false, reason: 'invalid_rating' };
    }
    // Prevent an artisan from rating themselves
    if (this.data.currentRole === 'artisan' && this.data.artisanAuth?.artisanProfile?.id === artisanId) {
      console.warn('Artisan cannot rate themselves');
      return { success: false, reason: 'artisan_self_rating_denied' };
    }

    const artisan = (this.data.artisans || []).find(a => a.id === artisanId);
    if (!artisan) return { success: false, reason: 'artisan_not_found' };

    const curCount = Number(artisan.ratingCount) || 1;
    const curRating = Number(artisan.rating) || 4.8;
    const newCount = curCount + 1;
    const newAvg = Math.round(((curRating * curCount + num) / newCount) * 10) / 10;

    artisan.rating = newAvg;
    artisan.ratingCount = newCount;

    const saved = (this.data.savedArtisans || []).find(a => a.id === artisanId);
    if (saved) {
      saved.rating = newAvg;
      saved.ratingCount = newCount;
    }

    (this.data.products || []).forEach(p => {
      if (p.artisanId === artisanId) {
        p.rating = newAvg;
        p.ratingCount = newCount;
      }
    });

    this.notify();
    return { success: true, rating: newAvg, ratingCount: newCount };
  }

  // Buyer Auth Flow Handlers
  startBuyerAuth() {
    this.data.currentRole = 'buyer';
    this.data.activeBuyerScreen = 'welcome';
    this.data.buyerDraft = {
      mobileNumber: '',
      otp: '',
      name: '',
      city: '',
      buyerId: ''
    };
    this.data.buyerAuth.isRegistered = false;
    this.data.buyerAuth.isGuest = false;
    this.notify();
  }

  continueBuyerAsGuest() {
    this.data.currentRole = 'buyer';
    this.data.buyerAuth.isRegistered = false;
    this.data.buyerAuth.isGuest = true;
    this.data.buyerAuth.buyerName = 'Guest Explorer';
    this.data.activeBuyerScreen = 'explore';
    this.notify();
  }

  loginReturningBuyer(mobileNumber = '9876543210') {
    const cleanNumber = (mobileNumber || '').replace(/\D/g, '');
    const found = (this.data.savedBuyers || []).find(b => (b.mobileNumber || '').replace(/\D/g, '') === cleanNumber)
      || this.data.savedBuyers[0]
      || { id: 'CRF-BUY-001001', name: 'Arjun Sharma', mobileNumber: '9876543210', city: 'New Delhi' };

    this.data.currentRole = 'buyer';
    this.data.buyerAuth.isRegistered = true;
    this.data.buyerAuth.isGuest = false;
    this.data.buyerAuth.buyerProfile = { ...found };
    this.data.buyerAuth.buyerName = found.name;
    this.data.buyerAuth.mobileNumber = found.mobileNumber;
    this.data.buyerAuth.city = found.city;
    this.data.activeBuyerScreen = 'explore';
    this.notify();
    return { success: true, profile: found };
  }

  completeBuyerRegistration(name, city, mobileNumber) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const generatedId = `CRF-BUY-${randomSuffix}`;
    const newBuyer = {
      id: generatedId,
      name: name || 'Valued Buyer',
      city: city || 'India',
      mobileNumber: mobileNumber || this.data.buyerDraft?.mobileNumber || '9876543210'
    };

    if (!this.data.savedBuyers) this.data.savedBuyers = [];
    this.data.savedBuyers.push(newBuyer);

    this.data.currentRole = 'buyer';
    this.data.buyerAuth.isRegistered = true;
    this.data.buyerAuth.isGuest = false;
    this.data.buyerAuth.buyerProfile = newBuyer;
    this.data.buyerAuth.buyerName = newBuyer.name;
    this.data.buyerAuth.mobileNumber = newBuyer.mobileNumber;
    this.data.buyerAuth.city = newBuyer.city;
    this.data.activeBuyerScreen = 'explore';
    this.notify();
    return newBuyer;
  }

  toggleBuyerAuthState(isRegistered, isGuest = false) {
    if (isGuest) {
      this.continueBuyerAsGuest();
    } else if (isRegistered) {
      this.loginReturningBuyer();
    } else {
      this.startBuyerAuth();
    }
  }

  addProduct(newProduct) {
    if (newProduct.isDemo === undefined) {
      newProduct.isDemo = false;
    }
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

  deleteProduct(productId, requestingArtisanId) {
    if (!productId) return { success: false, reason: 'missing_product_id' };

    const product = (this.data.products || []).find(p => p.id === productId);
    if (!product) return { success: false, reason: 'not_found' };

    // Role check: Only authenticated artisan can delete from artisan flow
    if (this.data.currentRole !== 'artisan') {
      return { success: false, reason: 'unauthorized_role' };
    }

    // Ownership check: must belong to the currently authenticated artisan
    const currentArtisan = this.data.artisanAuth?.artisanProfile
      || (this.data.selectedArtisanId && this.data.savedArtisans && this.data.savedArtisans.find(a => a.id === this.data.selectedArtisanId))
      || (this.data.savedArtisans && this.data.savedArtisans[0]);
    const authenticatedId = requestingArtisanId || currentArtisan?.id || this.data.selectedArtisanId;

    if (product.artisanId !== authenticatedId) {
      console.warn('Ownership check failed: Artisan cannot delete another artisan product');
      return { success: false, reason: 'unauthorized_not_owner' };
    }

    // Protection for demo products
    if (product.isDemo) {
      return {
        success: false,
        reason: 'demo_product_protected',
        message: 'This demo product is protected from deletion in the prototype demonstration.'
      };
    }

    // Protection for sold products with historical sales records
    if (product.hasSalesHistory) {
      return {
        success: false,
        reason: 'sales_history_protected',
        message: 'This product has sales history and cannot be deleted from active records.'
      };
    }

    // Central state removal: permanently removes from application state
    this.data.products = this.data.products.filter(p => p.id !== productId);

    // Update selectedProductId if pointing to the deleted product
    if (this.data.selectedProductId === productId) {
      const remainingMyProducts = this.data.products.filter(p => p.artisanId === authenticatedId);
      this.data.selectedProductId = remainingMyProducts.length > 0 ? remainingMyProducts[0].id : (this.data.products[0]?.id || null);
    }

    // Clean navigation history so back navigation does not return to deleted product
    if (this.data.navigationHistory?.artisan) {
      this.data.navigationHistory.artisan = this.data.navigationHistory.artisan.filter(h => h.params?.productId !== productId);
    }
    if (this.data.navigationHistory?.buyer) {
      this.data.navigationHistory.buyer = this.data.navigationHistory.buyer.filter(h => h.params?.productId !== productId);
    }

    // Clear confirmation dialog state
    delete this.data.deleteConfirmProductId;

    // Navigate to My Crafts
    this.data.activeArtisanScreen = 'my_crafts';

    this.notify();
    return { success: true, productId };
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
    if (!this.data.onboardingDraft) this.data.onboardingDraft = {};
    this.data.onboardingDraft.name = extracted.name;
    this.data.onboardingDraft.craftCategory = extracted.craft;
    this.data.onboardingDraft.location = extracted.location;
    this.data.onboardingDraft.voiceTranscript = this.data.voiceTranscript;
    this.data.onboardingDraft.isVoiceExtracted = true;
    if (this.data.currentRole === 'artisan') {
      this.data.activeArtisanScreen = 'profile_step1';
    }
    if (this.onSpeechExtracted) {
      this.onSpeechExtracted(extracted);
    }
    this.closeVoiceModal();
  }

  resetAllData() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.initDefaultState();
    this.notify();
  }
}

export const appState = new AppStateStore();
