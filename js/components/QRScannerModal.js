/* ==========================================================================
   CRAFTORA - QR Code Generator & Scanner Component
   Uses qrcode.js (loaded via CDN in index.html) for real QR generation.
   QR payload: local verification route  →  /verify/{productId}
   ========================================================================== */

import { appState } from '../state.js';
import { INITIAL_PRODUCTS } from '../data/mockData.js';
import { renderIcon } from './Icons.js';

/* ── QR Scanner placeholder shown in buyer Scan tab ───────────── */
export function renderQRScannerModal() {
  return `
    <div class="craft-card" style="text-align: center; padding: 24px 18px;">
      <div style="color: var(--green); margin-bottom: 8px;">
        ${renderIcon('qr', '', 32)}
      </div>
      <h3 style="font-size: 17px; margin-bottom: 4px;">Verify Product Provenance</h3>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
        Scan the QR code printed on the physical craft to view its registered Digital Product Passport.
      </p>

      <!-- Viewfinder Box -->
      <div style="width: 230px; height: 230px; margin: 0 auto 20px;
                  border: 2px dashed var(--border-green); border-radius: var(--radius-lg);
                  background: var(--bg-elevated); display: flex; flex-direction: column;
                  align-items: center; justify-content: center; position: relative;">
        <div style="width: 56px; height: 56px; border: 2px solid var(--green);
                    border-radius: var(--radius-sm); display: flex; align-items: center;
                    justify-content: center; color: var(--green);">
          ${renderIcon('camera', '', 26)}
        </div>
        <div style="font-size: 11px; font-weight: 700; color: var(--green);
                    text-transform: uppercase; margin-top: 14px; letter-spacing: 0.05em;">
          SCAN AREA
        </div>
        <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">
          Point camera at product QR
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; max-width: 320px; margin: 0 auto;">
        <button class="btn-primary" id="simulate-qr-scan-btn" onclick="window.triggerSimulatedQRScan()">
          ${renderIcon('camera', '', 16)} Simulate QR Scan (Demo)
        </button>
        <button class="btn-secondary" onclick="window.triggerSimulatedQRScan()">
          ${renderIcon('package', '', 16)} Upload QR Image (Demo)
        </button>
      </div>

      <div class="disclaimer-box" style="margin-top: 20px; text-align: left;">
        <span>${renderIcon('shield', '', 16)}</span>
        <div>
          <strong>Verification Guarantee:</strong><br>
          Scan accesses the product's registered Digital Product Passport & provenance log.
        </div>
      </div>
    </div>
  `;
}

/* ── Simulated QR scan (for demo — picks first product) ─────────── */
window.triggerSimulatedQRScan = () => {
  const products = appState.data.products;
  const sampleProduct = products[0] || INITIAL_PRODUCTS[0];
  appState.data.scannedQRProduct = sampleProduct;
  appState.setBuyerScreen('scan_qr_result', { productId: sampleProduct.id });
};

/* ── openQRModal — generates a real QR via qrcode.js ────────────── */
window.openQRModal = (productId) => {
  const products = appState.data.products;
  const product = products.find(p => p.id === productId) || products[0];
  if (!product) return;

  // QR payload: local verification reference
  const qrPayload = `CRAFTORA://verify/${product.id}`;
  const displayRef  = `/verify/${product.id}`;

  const container = document.getElementById('qr-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="qr-modal-overlay" id="qr-overlay" onclick="event.target===this && window.closeQRModal()">
      <div class="qr-modal-card">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:18px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:var(--green);">${renderIcon('qr', '', 22)}</span>
            <div>
              <div style="font-family:var(--font-heading); font-weight:700; font-size:16px; color:var(--text-primary);">
                Product QR Code
              </div>
              <div style="font-size:11px; color:var(--text-muted);">Scan to verify provenance</div>
            </div>
          </div>
          <button onclick="window.closeQRModal()"
                  style="background:none; border:none; cursor:pointer; color:var(--text-muted);
                         font-size:20px; line-height:1; padding:4px;"
                  aria-label="Close">✕</button>
        </div>

        <!-- QR Canvas rendered here -->
        <div id="craftora-qr-wrapper"
             style="display:flex; align-items:center; justify-content:center;
                    background:white; padding:12px; border-radius:var(--radius-md);
                    border:1px solid var(--border-light); margin-bottom:16px;">
          <canvas id="craftora-qr-canvas"></canvas>
        </div>

        <div style="font-size:13px; font-weight:700; color:var(--text-primary); margin-bottom:2px;">
          ${product.title}
        </div>
        <div style="font-size:11px; color:var(--text-muted); font-family:monospace; margin-bottom:14px;">
          ${displayRef}
        </div>

        <div class="success-box" style="font-size:12px;">
          ${renderIcon('shield', '', 14)}
          <div>This QR code links to the registered Digital Product Passport for <strong>${product.id}</strong>.</div>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px; margin-top:14px;">
          <button class="btn-primary" onclick="window.downloadQRCode('${product.id}')">
            ${renderIcon('package', '', 16)} Download QR Code
          </button>
          <button class="btn-secondary" onclick="window.closeQRModal()">
            Close
          </button>
        </div>
      </div>
    </div>
  `;

  // Generate the real QR using qrcode.js (loaded from CDN)
  const canvas = document.getElementById('craftora-qr-canvas');
  if (!canvas) return;

  try {
    // Use QRCode.js library
    if (typeof QRCode !== 'undefined') {
      QRCode.toCanvas(canvas, qrPayload, {
        width: 220,
        margin: 2,
        color: {
          dark: '#215036',   // Forest green modules
          light: '#FFFFFF'   // White background
        },
        errorCorrectionLevel: 'M'
      }, (error) => {
        if (error) {
          _renderQRFallback(canvas, qrPayload, product.id);
        }
      });
    } else {
      // Fallback if CDN didn't load
      _renderQRFallback(canvas, qrPayload, product.id);
    }
  } catch (e) {
    _renderQRFallback(canvas, qrPayload, product.id);
  }
};

/* ── Internal fallback: draw a simple text notice if CDN fails ─── */
function _renderQRFallback(canvas, payload, productId) {
  const wrapper = document.getElementById('craftora-qr-wrapper');
  if (!wrapper) return;
  wrapper.innerHTML = `
    <div style="padding:24px; text-align:center; border:2px dashed var(--border-medium);
                border-radius:var(--radius-md); background:var(--bg-elevated); width:220px;">
      <div style="font-family:monospace; font-size:11px; color:var(--text-secondary);
                  word-break:break-all; margin-bottom:8px;">${payload}</div>
      <div style="font-size:11px; color:var(--text-muted);">
        QR library unavailable offline.<br>
        Product ID: <strong>${productId}</strong>
      </div>
    </div>
  `;
}

/* ── Download QR Code as PNG ─────────────────────────────────────── */
window.downloadQRCode = (productId) => {
  const canvas = document.getElementById('craftora-qr-canvas');
  if (!canvas || !canvas.toDataURL) {
    alert('QR canvas not available for download.');
    return;
  }
  const link = document.createElement('a');
  link.download = `CRAFTORA_QR_${productId}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

/* ── Close QR Modal ──────────────────────────────────────────────── */
window.closeQRModal = () => {
  const container = document.getElementById('qr-modal-container');
  if (container) container.innerHTML = '';
};
