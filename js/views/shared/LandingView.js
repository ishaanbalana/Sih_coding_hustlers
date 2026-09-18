/* ==========================================================================
   CRAFTORA - Screen 1: Role Selection Landing Page
   ========================================================================== */

import { appState } from '../../state.js';
import { renderIcon } from '../../components/Icons.js';

export function renderLandingView() {
  return `
    <div style="padding: 24px 20px 20px; display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: space-between; min-height: 82vh; max-width: 440px; margin: 0 auto; box-sizing: border-box;">
      
      <!-- Top Typography Hierarchy -->
      <div style="margin-top: 6px; display: flex; flex-direction: column; align-items: center;">
        <!-- Small Eyebrow Pill -->
        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 14px; background: var(--copper-pale); border-radius: var(--radius-full); margin-bottom: 12px; border: 1px solid rgba(160, 113, 79, 0.2);">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--terracotta);"></span>
          <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: var(--copper); text-transform: uppercase;">
            Heritage Craft • Digital Empowerment
          </span>
        </div>

        <!-- Main Headline -->
        <h1 style="font-family: var(--font-display); font-size: 25px; line-height: 1.28; font-weight: 700; color: var(--text-primary); margin: 0 0 10px 0; max-width: 380px; letter-spacing: -0.01em;">
          AI-Powered Digital Business Platform for Artisans
        </h1>

        <!-- Supporting Tagline -->
        <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin: 0; max-width: 320px; font-weight: 500;">
          Bring your craft to the digital world.
        </p>
      </div>

      <!-- Restored Craft Hero Image with Clean Composition -->
      <div style="position: relative; width: 100%; max-width: 360px; margin: 20px 0; border-radius: 16px; overflow: hidden; background: #FFFFFF; box-shadow: 0 10px 25px -4px rgba(28, 25, 23, 0.08), 0 4px 8px -2px rgba(28, 25, 23, 0.04); border: 1px solid var(--border-light);">
        <div style="position: relative; width: 100%; height: 185px; overflow: hidden; background: var(--bg-surface);">
          <img src="assets/bamboo_basket.png" alt="Handcrafted Artisan Bamboo Basket" style="width: 100%; height: 100%; object-fit: cover; object-position: center 38%; display: block;" />
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(28, 25, 23, 0.3) 0%, transparent 45%); pointer-events: none;"></div>
          <div style="position: absolute; bottom: 10px; left: 12px; right: 12px; display: flex; align-items: center; justify-content: space-between;">
            <span style="background: rgba(255, 255, 255, 0.94); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; color: var(--text-primary); border: 1px solid rgba(0,0,0,0.06); display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.07);">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--green);"></span> Verified Artisan Craft
            </span>
            <span style="background: rgba(33, 80, 54, 0.92); backdrop-filter: blur(8px); padding: 4px 9px; border-radius: var(--radius-full); font-size: 10px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.06em; text-transform: uppercase;">
              Handmade
            </span>
          </div>
        </div>
      </div>

      <!-- Visually Premium CTA Buttons -->
      <div style="width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 11px;">
        <!-- Artisan Button (Solid Forest Green) -->
        <button class="landing-cta-artisan" onclick="window.selectRoleLanding('artisan')" style="width: 100%; height: 48px; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; background: var(--green); color: #FFFFFF; border: none; border-radius: var(--radius-md); font-size: 14.5px; font-weight: 600; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 4px 12px rgba(33, 80, 54, 0.2);">
          <span style="display: flex; align-items: center; gap: 11px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: rgba(255, 255, 255, 0.18);">
              ${renderIcon('palette', '#FFFFFF', 15)}
            </span>
            <span>I'm an Artisan</span>
          </span>
          ${renderIcon('arrowRight', '#FFFFFF', 15)}
        </button>

        <!-- Buyer Button (Clean Outlined) -->
        <button class="landing-cta-buyer" onclick="window.selectRoleLanding('buyer')" style="width: 100%; height: 48px; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; background: #FFFFFF; color: var(--text-primary); border: 1.5px solid var(--border-medium); border-radius: var(--radius-md); font-size: 14.5px; font-weight: 600; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);">
          <span style="display: flex; align-items: center; gap: 11px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: var(--bg-surface); border: 1px solid var(--border-light);">
              ${renderIcon('store', 'var(--text-secondary)', 15)}
            </span>
            <span>I'm a Buyer</span>
          </span>
          ${renderIcon('arrowRight', 'var(--text-secondary)', 15)}
        </button>
      </div>

      <!-- Process Pipeline Tag -->
      <div style="margin-top: 24px;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.16em; color: var(--copper); text-transform: uppercase; opacity: 0.9;">
          CREATE • PRICE • CONNECT • VERIFY
        </div>
      </div>

      <!-- Footer & Admin Link -->
      <div style="margin-top: 18px; font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <div style="letter-spacing: 0.05em; font-weight: 500;">— Hindi | English —</div>
        <div>
          <a href="#" onclick="window.selectRoleLanding('admin'); return false;" style="color: var(--text-secondary); text-decoration: none; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: var(--radius-sm); transition: var(--transition-fast);">
            ${renderIcon('shield', 'currentColor', 13)} Admin Verification Portal
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
