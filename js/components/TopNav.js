/* ==========================================================================
   CRAFTORA - Unified Header Navigation (Light Theme)
   ========================================================================== */

import { appState } from '../state.js';
import { renderIcon } from './Icons.js';

export function renderTopNav(showBack = false) {
  const state = appState.data;
  const lang = state.language;
  const role = state.currentRole;

  let roleLabel = 'DIGITAL PLATFORM';
  if (role === 'artisan') roleLabel = 'ARTISAN WORKSPACE';
  if (role === 'buyer') roleLabel = 'BUYER DISCOVERY';
  if (role === 'admin') roleLabel = 'ADMIN VERIFICATION';

  return `
    <header class="craftora-header">
      <div style="display: flex; align-items: center; gap: 10px;">
        ${showBack ? `
          <button class="btn-icon" onclick="window.historyBack()" title="Back" aria-label="Back">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
        ` : ''}
        <div>
          <div class="brand-title">CRAFTORA</div>
          <div class="brand-subtitle">${roleLabel}</div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 8px;">
        ${role === 'admin' && state.adminAuth?.isLoggedIn ? `
          <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px; height: auto; border-radius: var(--radius-xs);" onclick="window.logoutAdmin()" title="Sign Out">
            Sign Out
          </button>
        ` : ''}
        <button class="lang-selector" onclick="window.toggleLanguage()" aria-label="Toggle language">
          ${renderIcon('globe', '', 14)}
          <span>${lang === 'EN' ? 'EN' : 'हिं'}</span>
        </button>
      </div>
    </header>
  `;
}

window.toggleLanguage = () => {
  const newLang = appState.data.language === 'EN' ? 'HI' : 'EN';
  appState.setLanguage(newLang);
};

window.historyBack = () => {
  const state = appState.data;
  const role = state.currentRole;

  if (role === 'landing') return;

  if (role === 'artisan') {
    const current = state.activeArtisanScreen;
    if (current === 'onboarding') {
      appState.setRole('landing');
      return;
    }
    // Simple back map
    const backMap = {
      onboarding_otp: 'onboarding',
      profile_step1: 'onboarding_otp',
      artisan_id_card: 'profile_step1',
      welcome: 'artisan_id_card',
      add_product: 'dashboard',
      ai_analysis: 'add_product',
      review_product: 'ai_analysis',
      smart_pricing: 'review_product',
      market_matches: 'smart_pricing',
      passport: 'market_matches',
      provenance: 'passport',
      my_crafts: 'dashboard',
      product_detail: 'my_crafts',
      edit_product: 'product_detail',
    };
    appState.setArtisanScreen(backMap[current] || 'dashboard');
  } else if (role === 'buyer') {
    const current = state.activeBuyerScreen;
    if (current === 'welcome') {
      appState.setRole('landing');
      return;
    }
    const backMap = {
      buyer_mobile: 'welcome',
      buyer_otp: 'buyer_mobile',
      register: 'buyer_otp',
      buyer_signin: 'welcome',
      product_detail: 'explore',
      artisan_story: 'product_detail',
      passport: 'product_detail',
      scan_qr: 'explore',
      scan_qr_result: 'scan_qr',
      connect: 'product_detail',
      connect_success: 'explore',
      profile: 'explore',
    };
    appState.setBuyerScreen(backMap[current] || 'explore');
  } else if (role === 'admin') {
    const current = state.activeAdminScreen;
    if (current === 'login') {
      appState.setRole('landing');
      return;
    }
    const backMap = {
      artisan_list: 'dashboard',
      product_list: 'dashboard',
      provenance_logs: 'dashboard',
      review_detail: 'product_list',
    };
    appState.setAdminScreen(backMap[current] || 'dashboard');
  }
};
