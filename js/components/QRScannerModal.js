/* ==========================================================================
   CRAFTORA - QR Code Generator & Scanner Component
   Uses qrcode.js for real QR generation.
   Uses @zxing/browser (ZXingBrowser) for real camera & image scanning.
   QR payload: real verification route  →  /verify/{productId}
   ========================================================================== */

import { appState } from '../state.js';
import { INITIAL_PRODUCTS } from '../data/mockData.js';
import { renderIcon } from './Icons.js';

// Global scanner instance tracker
let _activeCodeReader = null;
let _isCameraRunning = false;

/* ── QR Scanner Component for Buyer Scan Screen ─────────────────── */
export function renderQRScannerModal() {
  return `
    <div class="craft-card" style="text-align: center; padding: 24px 18px;">
      <div style="color: var(--green); margin-bottom: 8px;">
        ${renderIcon('qr', '', 32)}
      </div>
      <h3 style="font-size: 17px; margin-bottom: 4px;">Verify Product Provenance</h3>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">
        Scan the QR code printed on the physical craft to view its registered Digital Product Passport.
      </p>

      <!-- Viewfinder Box (Hosts live video or placeholder) -->
      <div id="craftora-viewfinder-box"
           style="width: 260px; height: 260px; margin: 0 auto 16px;
                  border: 2px dashed var(--border-green); border-radius: var(--radius-lg);
                  background: var(--bg-elevated); display: flex; flex-direction: column;
                  align-items: center; justify-content: center; position: relative; overflow: hidden;">
        
        <!-- Live Camera Video -->
        <video id="craftora-scanner-video" playsinline muted
               style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-lg); display: none;"></video>
        
        <!-- Placeholder View (When Camera is stopped) -->
        <div id="craftora-scanner-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
          <div style="width: 56px; height: 56px; border: 2px solid var(--green);
                      border-radius: var(--radius-sm); display: flex; align-items: center;
                      justify-content: center; color: var(--green); margin-bottom: 12px;">
            ${renderIcon('camera', '', 26)}
          </div>
          <div style="font-size: 11px; font-weight: 700; color: var(--green);
                      text-transform: uppercase; letter-spacing: 0.05em;">
            SCAN AREA
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
            Point camera at craft verification QR
          </div>
        </div>

        <!-- Scanning Overlay Aim Grid (visible when camera is running) -->
        <div id="craftora-scan-aim-overlay"
             style="display: none; position: absolute; inset: 20px; border: 2px solid var(--green);
                    border-radius: var(--radius-md); box-shadow: 0 0 0 9999px rgba(0,0,0,0.35); pointer-events: none;">
          <div style="position: absolute; top: 50%; left: 0; right: 0; height: 2px; background: var(--terracotta); opacity: 0.75; box-shadow: 0 0 8px var(--terracotta);"></div>
        </div>
      </div>

      <!-- Live Status & Feedback -->
      <div id="scanner-status-msg"
           style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 16px; min-height: 20px;">
        Camera ready. Tap "Start Camera Scanner" below.
      </div>

      <!-- Controls -->
      <div style="display: flex; flex-direction: column; gap: 10px; max-width: 320px; margin: 0 auto;">
        <button class="btn-primary" id="start-camera-scan-btn" onclick="window.startCameraScanner()">
          ${renderIcon('camera', '', 16)} Start Camera Scanner
        </button>

        <button class="btn-secondary" id="stop-camera-scan-btn" style="display: none;" onclick="window.stopCameraScanner()">
          Stop Camera
        </button>

        <input type="file" id="qr-file-upload-input" accept="image/*" style="display: none;" onchange="window.handleQRImageUpload(this)">
        <button class="btn-secondary" onclick="document.getElementById('qr-file-upload-input').click()">
          ${renderIcon('package', '', 16)} Scan from Saved QR Image
        </button>

        <button class="btn-secondary" style="border-style: dashed; font-size: 12px;" onclick="window.triggerSimulatedQRScan()">
          ${renderIcon('sparkles', '', 14)} Simulate Scan (Demo Testing)
        </button>
      </div>

      <div class="disclaimer-box" style="margin-top: 20px; text-align: left;">
        <span>${renderIcon('shield', '', 16)}</span>
        <div>
          <strong>Tamper-Evident Verification:</strong><br>
          Scanning decodes the registered route <code>/verify/CRF-...</code> and opens the verified Digital Product Passport.
        </div>
      </div>
    </div>
  `;
}

/* ── Process Decoded QR String ───────────────────────────────────── */
window.processScannedQRCode = (text) => {
  if (!text) return;
  console.log('[CRAFTORA QR Scanner] Decoded QR Payload:', text);

  // Stop camera if running
  window.stopCameraScanner();

  // Pattern match: look for /verify/CRF-... or CRF-... in payload
  const match = text.match(/CRF-[A-Za-z0-9-]+/i) || text.match(/\/verify\/([A-Za-z0-9-]+)/i);
  let productId = match ? (match[1] || match[0]).toUpperCase() : '';

  const products = appState.data.products;
  let targetProduct = products.find(p => p.id.toUpperCase() === productId);

  if (!targetProduct && !productId) {
    // If no specific product ID was found in raw text, fallback to sample for general demo scans
    targetProduct = products[0] || INITIAL_PRODUCTS[0];
  }

  // Haptic feedback if available
  try {
    if (navigator.vibrate) navigator.vibrate(80);
  } catch(e) {}

  appState.data.scannedQRProduct = targetProduct || null;
  appState.setBuyerScreen('scan_qr_result', { productId: targetProduct ? targetProduct.id : (productId || 'unknown') });
};

/* ── Start Real Camera Scanner via @zxing/browser ────────────────── */
window.startCameraScanner = async () => {
  const video = document.getElementById('craftora-scanner-video');
  const placeholder = document.getElementById('craftora-scanner-placeholder');
  const overlay = document.getElementById('craftora-scan-aim-overlay');
  const statusMsg = document.getElementById('scanner-status-msg');
  const startBtn = document.getElementById('start-camera-scan-btn');
  const stopBtn = document.getElementById('stop-camera-scan-btn');

  if (!video) return;

  // Check ZXing availability
  const ZXing = window.ZXingBrowser;
  if (!ZXing || !ZXing.BrowserQRCodeReader) {
    if (statusMsg) {
      statusMsg.innerHTML = '<span style="color:var(--danger)">ZXing scanner library not loaded. Use "Scan from Saved QR Image" or "Simulate Scan".</span>';
    }
    return;
  }

  try {
    if (statusMsg) statusMsg.textContent = 'Requesting camera access...';

    // Stop any existing session
    window.stopCameraScanner();

    _activeCodeReader = new ZXing.BrowserQRCodeReader();
    _isCameraRunning = true;

    // Show video element and hide placeholder
    video.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    if (overlay) overlay.style.display = 'block';
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-block';

    if (statusMsg) statusMsg.textContent = 'Point camera at product QR code...';

    // Use environment camera (back camera on mobile)
    await _activeCodeReader.decodeFromVideoDevice(
      undefined,
      video,
      (result, err, controls) => {
        if (result) {
          const scannedText = result.getText();
          if (statusMsg) statusMsg.innerHTML = `<span style="color:var(--success)">QR Detected: ${scannedText}</span>`;
          if (controls) controls.stop();
          window.processScannedQRCode(scannedText);
        }
      }
    );
  } catch (err) {
    console.error('Camera Scanner Error:', err);
    window.stopCameraScanner();
    if (statusMsg) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        statusMsg.innerHTML = '<span style="color:var(--danger)">Camera access denied. Please grant camera permission in your browser or upload an image.</span>';
      } else if (err.name === 'NotFoundError') {
        statusMsg.innerHTML = '<span style="color:var(--danger)">No camera device found on this system. Please upload a QR image or use demo simulation.</span>';
      } else {
        statusMsg.innerHTML = `<span style="color:var(--danger)">Camera error: ${err.message || 'Unable to access camera.'}</span>`;
      }
    }
  }
};

/* ── Stop Camera Scanner ─────────────────────────────────────────── */
window.stopCameraScanner = () => {
  if (_activeCodeReader) {
    try {
      _activeCodeReader.stopContinuousDecode?.();
      _activeCodeReader.reset?.();
    } catch(e) {}
    _activeCodeReader = null;
  }

  const video = document.getElementById('craftora-scanner-video');
  if (video) {
    if (video.srcObject) {
      try {
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      } catch(e) {}
      video.srcObject = null;
    }
    video.style.display = 'none';
  }

  const placeholder = document.getElementById('craftora-scanner-placeholder');
  const overlay = document.getElementById('craftora-scan-aim-overlay');
  const startBtn = document.getElementById('start-camera-scan-btn');
  const stopBtn = document.getElementById('stop-camera-scan-btn');

  if (placeholder) placeholder.style.display = 'flex';
  if (overlay) overlay.style.display = 'none';
  if (startBtn) startBtn.style.display = 'inline-block';
  if (stopBtn) stopBtn.style.display = 'none';

  _isCameraRunning = false;
};

/* ── Decode from Uploaded QR Image File ──────────────────────────── */
window.handleQRImageUpload = (inputEl) => {
  const file = inputEl.files?.[0];
  if (!file) return;

  const statusMsg = document.getElementById('scanner-status-msg');
  if (statusMsg) statusMsg.textContent = 'Decoding QR image...';

  const reader = new FileReader();
  reader.onload = async (e) => {
    const imgUrl = e.target.result;
    const img = new Image();
    img.onload = async () => {
      try {
        const ZXing = window.ZXingBrowser;
        if (!ZXing || !ZXing.BrowserQRCodeReader) {
          throw new Error('ZXing scanner not loaded');
        }
        const codeReader = new ZXing.BrowserQRCodeReader();
        const result = await codeReader.decodeFromImageElement(img);
        if (result) {
          window.processScannedQRCode(result.getText());
        } else {
          if (statusMsg) statusMsg.innerHTML = '<span style="color:var(--danger)">No valid QR code detected in the uploaded image.</span>';
        }
      } catch(err) {
        console.warn('Image QR Decode error:', err);
        if (statusMsg) statusMsg.innerHTML = '<span style="color:var(--danger)">Could not decode QR code from image. Please make sure the QR is clear and well-lit.</span>';
      }
    };
    img.src = imgUrl;
  };
  reader.readAsDataURL(file);
};

/* ── Simulated QR scan (for demo testing fallback) ───────────────── */
window.triggerSimulatedQRScan = () => {
  const products = appState.data.products;
  const sampleProduct = products[0] || INITIAL_PRODUCTS[0];
  window.processScannedQRCode(`/verify/${sampleProduct.id}`);
};

/* ── openQRModal — generates a real scannable QR via qrcode.js ────── */
window.openQRModal = (productId) => {
  const products = appState.data.products;
  const product = products.find(p => p.id === productId) || products[0];
  if (!product) return;

  // Real scannable verification route payload as required
  const qrPayload = `/verify/${product.id}`;
  const displayRef = `/verify/${product.id}`;

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
              <div style="font-size:11px; color:var(--text-muted);">Real scannable product passport code</div>
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
                    background:white; padding:14px; border-radius:var(--radius-md);
                    border:1px solid var(--border-light); margin-bottom:16px; box-shadow:var(--shadow-sm);">
          <canvas id="craftora-qr-canvas"></canvas>
        </div>

        <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:2px;">
          ${product.title}
        </div>
        <div style="font-size:12px; color:var(--green); font-family:monospace; font-weight:600; margin-bottom:14px;">
          ${displayRef}
        </div>

        <div class="success-box" style="font-size:12px; margin-bottom:14px;">
          ${renderIcon('shield', '', 14)}
          <div>Encoded Reference: <strong>${qrPayload}</strong><br>Scannable with any mobile camera or QR reader.</div>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          <button class="btn-primary" onclick="window.downloadQRCode('${product.id}')">
            ${renderIcon('package', '', 16)} Download QR Code (PNG)
          </button>
          <button class="btn-secondary" onclick="window.closeQRModal()">
            Close
          </button>
        </div>
      </div>
    </div>
  `;

  // Generate real QR code using qrcode.js
  const canvas = document.getElementById('craftora-qr-canvas');
  if (!canvas) return;

  try {
    if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
      QRCode.toCanvas(canvas, qrPayload, {
        width: 220,
        margin: 2,
        color: {
          dark: '#215036',   // Deep Forest green modules
          light: '#FFFFFF'   // Pure white background
        },
        errorCorrectionLevel: 'M'
      }, (error) => {
        if (error) {
          console.error('QRCode.toCanvas error:', error);
          _renderQRFallback(canvas, qrPayload, product.id);
        }
      });
    } else {
      _renderQRFallback(canvas, qrPayload, product.id);
    }
  } catch (e) {
    console.error('QR generation exception:', e);
    _renderQRFallback(canvas, qrPayload, product.id);
  }
};

/* ── Fallback SVG drawing if QRCode library is unavailable ───────── */
function _renderQRFallback(canvas, payload, productId) {
  const wrapper = document.getElementById('craftora-qr-wrapper');
  if (!wrapper) return;
  wrapper.innerHTML = `
    <div style="padding:20px; text-align:center; border:2px dashed var(--border-medium);
                border-radius:var(--radius-md); background:var(--bg-elevated); width:220px;">
      <div style="font-family:monospace; font-size:12px; color:var(--text-primary);
                  word-break:break-all; font-weight:700; margin-bottom:8px;">${payload}</div>
      <div style="font-size:11px; color:var(--text-muted);">
        Verification Reference for <strong>${productId}</strong>
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
