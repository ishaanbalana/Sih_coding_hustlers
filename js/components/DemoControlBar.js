/* ==========================================================================
   CRAFTORA - Unobtrusive Floating Demo Control Bar (Hackathon Demo Tool)
   Styled as a developer tool — intentionally separate from product UI
   ========================================================================== */

import { appState } from '../state.js';
import { renderIcon } from './Icons.js';

let isDemoPopoverOpen = false;

export function renderDemoControlBar(state) {
  const currentRole = state.currentRole;
  const isArtisanReg = state.artisanAuth.isRegistered;
  const isBuyerReg = state.buyerAuth.isRegistered;

  const roleIcons = { artisan: '🧑‍🎨', buyer: '🛍️', admin: '🔐' };

  return `
    <div class="demo-bar-floating">
      <button class="demo-toggle-btn" onclick="window.toggleDemoPopover()"
              title="Hackathon demo controls — not part of product UI">
        ${renderIcon('sliders', '', 12)}
        <span>Demo · ${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}</span>
        <span style="opacity:0.7; font-size:9px;">${isDemoPopoverOpen ? '▲' : '▼'}</span>
      </button>

      ${isDemoPopoverOpen ? `
        <div class="demo-popover">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div class="demo-popover-title">🛠 Hackathon Demo Controls</div>
            <button onclick="window.toggleDemoPopover()"
                    style="background:none; border:none; color:#6B7280; cursor:pointer;
                           font-size:15px; line-height:1; padding:2px 4px;">✕</button>
          </div>

          <div style="font-size:10px; color:#6B7280; margin-top:-4px;">
            Switch role to demonstrate different user perspectives
          </div>

          <div class="demo-role-grid">
            <button class="demo-role-btn ${currentRole === 'artisan' ? 'active' : ''}"
                    onclick="window.handleRoleChange('artisan')">
              🧑‍🎨<br>Artisan
            </button>
            <button class="demo-role-btn ${currentRole === 'buyer' ? 'active' : ''}"
                    onclick="window.handleRoleChange('buyer')">
              🛍️<br>Buyer
            </button>
            <button class="demo-role-btn ${currentRole === 'admin' ? 'active' : ''}"
                    onclick="window.handleRoleChange('admin')">
              🔐<br>Admin
            </button>
          </div>

          ${currentRole === 'artisan' ? `
            <button class="demo-role-btn" style="width:100%;"
                    onclick="window.toggleArtisanAuthMode()">
              ${isArtisanReg ? '↩ Show Onboarding Flow' : '→ Show Returning Artisan'}
            </button>
          ` : ''}

          ${currentRole === 'buyer' ? `
            <button class="demo-role-btn" style="width:100%;"
                    onclick="window.toggleBuyerAuthMode()">
              ${isBuyerReg ? '↩ Show Guest/New Buyer' : '→ Show Registered Buyer'}
            </button>
          ` : ''}

          <button onclick="window.resetDemoData()"
                  style="background:none; border:1px solid rgba(220,38,38,0.3); border-radius:6px;
                         color:#EF4444; font-size:11px; font-weight:600; padding:6px 10px;
                         cursor:pointer; width:100%; text-align:center;">
            🔄 Reset All Demo Data
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

window.toggleDemoPopover = () => {
  isDemoPopoverOpen = !isDemoPopoverOpen;
  appState.notify();
};

window.handleRoleChange = (role) => {
  appState.setRole(role);
  isDemoPopoverOpen = false;
};

window.toggleArtisanAuthMode = () => {
  const current = appState.data.artisanAuth.isRegistered;
  appState.toggleArtisanOnboardingState(!current);
  isDemoPopoverOpen = false;
};

window.toggleBuyerAuthMode = () => {
  const current = appState.data.buyerAuth.isRegistered;
  appState.toggleBuyerAuthState(!current, !current ? false : true);
  isDemoPopoverOpen = false;
};

window.resetDemoData = () => {
  if (confirm('Reset all CRAFTORA demo data to initial defaults?')) {
    appState.resetAllData();
    isDemoPopoverOpen = false;
  }
};
