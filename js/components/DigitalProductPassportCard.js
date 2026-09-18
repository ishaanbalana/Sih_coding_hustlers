/* ==========================================================================
   CRAFTORA - Digital Product Passport Component (Light Theme)
   Strict Compliance: No fake blockchain hashes.
   DPP and Blockchain Record are clearly distinguished.
   ========================================================================== */

import { appState } from '../state.js';
import { renderIcon } from './Icons.js';

export function renderDigitalProductPassportCard(product, isBuyerPerspective = false) {
  const isVerified = product.status === 'verified';
  const events = product.blockchainRecord?.events || [];

  return `
    <div class="craft-card craft-card-accent">

      <!-- Passport Header -->
      <div class="flex-between" style="margin-bottom:16px; padding-bottom:12px;
                                       border-bottom:1px solid var(--border-light);">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="color:var(--green);">${renderIcon('globe', '', 20)}</span>
          <div>
            <h3 style="font-size:15px; font-weight:800; color:var(--text-primary);">
              Digital Product Passport
            </h3>
            <div style="font-size:11px; color:var(--text-muted);">
              Registered craft identity record
            </div>
          </div>
        </div>
        <span class="badge-pill ${isVerified ? 'badge-emerald' : 'badge-gold'}">
          ${isVerified ? renderIcon('shield', '', 11) + ' Registered' : 'Pending Audit'}
        </span>
      </div>

      <!-- Product Image -->
      <div style="border-radius:var(--radius-md); overflow:hidden; margin-bottom:14px;
                  border:1px solid var(--border-light); height:180px; background:var(--bg-elevated);">
        <img src="${product.imageUrl}" alt="${product.title}"
             style="width:100%; height:100%; object-fit:cover;">
      </div>

      <h4 style="font-size:16px; font-weight:700; margin-bottom:2px;">${product.title}</h4>
      <div style="font-size:13px; color:var(--copper); font-weight:600; margin-bottom:16px;">
        ${product.category} &nbsp;·&nbsp; ₹${product.price.toLocaleString('en-IN')}
      </div>

      <!-- Passport Specifications Grid -->
      <div style="background:var(--bg-elevated); border-radius:var(--radius-md);
                  padding:14px; margin-bottom:14px;
                  border-left:3px solid var(--terracotta);">
        <div class="section-title" style="margin-bottom:12px;">Passport Specifications</div>
        <div class="grid-2" style="font-size:13px; gap:12px;">

          <div>
            <div style="font-size:10px; font-weight:700; text-transform:uppercase;
                        color:var(--text-muted); letter-spacing:0.05em;">Product ID</div>
            <div style="font-weight:700; color:var(--green); font-family:monospace;
                        font-size:12px; margin-top:2px;">${product.id}</div>
          </div>

          <div>
            <div style="font-size:10px; font-weight:700; text-transform:uppercase;
                        color:var(--text-muted); letter-spacing:0.05em;">Artisan</div>
            <div style="font-weight:600; margin-top:2px;">${product.artisanName}</div>
          </div>

          <div>
            <div style="font-size:10px; font-weight:700; text-transform:uppercase;
                        color:var(--text-muted); letter-spacing:0.05em;">Origin</div>
            <div style="font-weight:600; margin-top:2px; display:flex; align-items:center; gap:4px;">
              ${renderIcon('mappin', '', 12)} ${product.artisanLocation}
            </div>
          </div>

          <div>
            <div style="font-size:10px; font-weight:700; text-transform:uppercase;
                        color:var(--text-muted); letter-spacing:0.05em;">Materials</div>
            <div style="font-weight:600; margin-top:2px;">${product.materials.join(', ')}</div>
          </div>

          <div>
            <div style="font-size:10px; font-weight:700; text-transform:uppercase;
                        color:var(--text-muted); letter-spacing:0.05em;">Production</div>
            <div style="font-weight:600; margin-top:2px; display:flex; align-items:center; gap:4px;">
              ${renderIcon('clock', '', 12)} ${product.productionTimeDays} Days
            </div>
          </div>

          <div>
            <div style="font-size:10px; font-weight:700; text-transform:uppercase;
                        color:var(--text-muted); letter-spacing:0.05em;">Verification</div>
            <div style="font-weight:700; margin-top:2px;
                        color:${isVerified ? 'var(--success)' : 'var(--warning)'};">
              ${isVerified ? 'Approved' : 'Pending'}
            </div>
          </div>

        </div>
      </div>

      <!-- Provenance Event Timeline -->
      <div style="margin-bottom:14px;">
        <div class="section-title" style="margin-bottom:12px; display:flex; align-items:center; gap:6px;">
          ${renderIcon('shield', '', 13)} Provenance Event Log
        </div>
        <div style="display:flex; flex-direction:column; gap:0;">
          ${events.map((evt, i) => `
            <div class="timeline-item">
              <div class="timeline-dot">
                ${renderIcon('check', '', 10)}
              </div>
              <div style="padding-top:2px;">
                <div style="font-size:13px; font-weight:600; color:var(--text-primary);">
                  ${evt.title}
                </div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:1px;">
                  ${evt.date} &nbsp;·&nbsp; ${evt.status}
                </div>
              </div>
            </div>
          `).join('')}
          ${!isVerified ? `
            <div class="timeline-item">
              <div class="timeline-dot pending">
                ${renderIcon('clock', '', 10)}
              </div>
              <div style="padding-top:2px;">
                <div style="font-size:13px; font-weight:600; color:var(--text-muted);">
                  Verification Review
                </div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:1px;">
                  Pending admin review
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Prototype Blockchain Record — clearly labeled as demo -->
      <div class="blockchain-box">
        <div class="flex-between" style="margin-bottom:6px;">
          <span style="font-size:12px; font-weight:700; color:var(--warning);
                       display:flex; align-items:center; gap:6px;">
            ${renderIcon('shield', '', 13)} Prototype Blockchain Record
          </span>
          <span class="badge-pill badge-gold">Testnet Demo</span>
        </div>
        <div style="font-size:11px; color:var(--text-secondary);">
          Network: ${product.blockchainRecord?.network || 'Polygon Testnet Demo'} &nbsp;·&nbsp;
          Status: ${product.blockchainRecord?.status || 'Recorded'}
        </div>
        <div style="font-size:10px; color:var(--text-muted); font-style:italic; margin-top:4px;">
          Simulated ledger record for prototype demonstration.
          No fake transaction hashes or block numbers are generated.
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer-box">
        <span style="flex-shrink:0;">${renderIcon('alertCircle', '', 15)}</span>
        <div>
          <strong>Provenance Note:</strong>&nbsp;
          Approval confirms reviewed registration information.
          Blockchain provides a tamper-evident record of provenance events —
          it does not independently verify physical authenticity.
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex; flex-direction:column; gap:10px; margin-top:14px;">
        ${!isBuyerPerspective ? `
          <button class="btn-secondary" onclick="window.navArtisan('provenance')">
            ${renderIcon('shield', '', 16)} View Full Provenance History
          </button>
        ` : ''}
        <button class="btn-primary" onclick="window.openQRModal('${product.id}')">
          ${renderIcon('qr', '', 16)} Generate / Show Product QR Code
        </button>
      </div>

    </div>
  `;
}
