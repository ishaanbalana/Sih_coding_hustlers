/* ==========================================================================
   CRAFTORA - Screen 1: Role Selection Landing Page
   ========================================================================== */

import { appState } from '../../state.js';
import { renderIcon } from '../../components/Icons.js';

export function renderLandingView() {
  return `
    <div style="padding: 24px 20px; display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: space-between; min-height: 85vh;">
      
      <!-- Top Branding -->
      <div style="margin-top: 10px;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; color: var(--text-copper); text-transform: uppercase; margin-bottom: 6px;">
          CRAFTORA PLATFORM
        </div>
        <h1 style="font-size: 22px; line-height: 1.3; font-weight: 800; color: var(--text-primary);">
          AI-POWERED DIGITAL BUSINESS PLATFORM FOR ARTISANS
        </h1>
      </div>

      <!-- Hero Graphic Card -->
      <div class="craft-card craft-card-glow" style="width: 100%; max-width: 360px; margin: 24px 0; padding: 20px;">
        <div style="width: 100%; height: 190px; border-radius: var(--radius-md); overflow: hidden; background: var(--bg-canvas); border: 1px solid var(--border-medium); margin-bottom: 14px; display: flex; align-items: center; justify-content: center;">
          <img src="assets/bamboo_basket.png" alt="Craft Artisan" style="width: 100%; height: 100%; object-fit: cover;">
        </div>

        <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
          Artisan + Handmade Craft
        </div>
        <p style="font-size: 13px; color: var(--text-secondary);">
          Bring your craft to the digital world.
        </p>
      </div>

      <!-- Action Buttons -->
      <div style="width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 14px;">
        <button class="btn-primary" onclick="window.selectRoleLanding('artisan')">
          ${renderIcon('palette', '', 18)} I'm an Artisan ${renderIcon('arrowRight', '', 16)}
        </button>

        <button class="btn-secondary" style="border-color: var(--terracotta); color: var(--terracotta);" onclick="window.selectRoleLanding('buyer')">
          ${renderIcon('store', '', 18)} I'm a Buyer ${renderIcon('arrowRight', '', 16)}
        </button>
      </div>

      <!-- Process Pipeline Tag -->
      <div style="margin-top: 24px;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.1em; color: var(--text-copper); text-transform: uppercase;">
          CREATE • PRICE • CONNECT • VERIFY
        </div>
      </div>

      <!-- Footer & Admin Link -->
      <div style="margin-top: 20px; font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 8px;">
        <div>— Hindi | English —</div>
        <div>
          <a href="#" onclick="window.selectRoleLanding('admin'); return false;" style="color: var(--text-secondary); text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;">
            ${renderIcon('shield', '', 14)} Admin Verification Portal
          </a>
        </div>
      </div>

    </div>
  `;
}

window.selectRoleLanding = (role) => {
  if (role === 'artisan') {
    appState.startNewArtisanRegistration();
  } else if (role === 'buyer') {
    appState.startBuyerAuth();
  } else if (role === 'admin') {
    appState.setRole('admin');
    appState.setAdminScreen('login');
  }
};
