/* ==========================================================================
   CRAFTORA - Voice Assistant — Real Web Speech API Implementation
   Uses browser SpeechRecognition / webkitSpeechRecognition
   Supports en-IN (English) and hi-IN (Hindi)
   ========================================================================== */

import { appState } from '../state.js';
import { renderIcon } from './Icons.js';

// Voice state (module-level, not in appState to avoid serialization issues)
let _recognition = null;
let _voiceState = 'idle'; // idle | listening | processing | done | error | unavailable
let _voiceTranscript = '';
let _voiceContext = null; // 'profile' | 'product' | null
let _onTranscriptExtracted = null;

/* ── Check browser support ───────────────────────────────────────── */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

/* ── Render Voice Modal ──────────────────────────────────────────── */
export function renderVoiceModal() {
  const state = appState.data;
  if (!state.isVoiceModalOpen) return '';

  const lang = state.language;
  const langCode = lang === 'HI' ? 'hi-IN' : 'en-IN';
  const langLabel = lang === 'HI' ? 'हिन्दी (Hindi)' : 'English (India)';

  const isSRAvailable = SR !== null;

  const stateLabel = {
    idle:        lang === 'HI' ? 'बोलने के लिए तैयार' : 'Ready to listen',
    listening:   lang === 'HI' ? 'सुन रहा हूँ...' : 'Listening...',
    processing:  lang === 'HI' ? 'प्रसंस्करण हो रहा है...' : 'Processing...',
    done:        lang === 'HI' ? 'आवाज़ कैप्चर हो गई' : 'Speech captured',
    error:       'Error — please try again',
    unavailable: 'Voice input not supported'
  }[_voiceState] || 'Ready';

  const isListening = _voiceState === 'listening';

  return `
    <div class="voice-modal-overlay">
      <div class="voice-modal-card">

        <!-- Mic orb -->
        <div class="voice-pulse-circle ${isListening ? 'listening' : ''}"
             style="cursor:pointer;" onclick="window.toggleVoiceListening()">
          ${renderIcon('mic', '', 30)}
        </div>

        <h3 style="margin-bottom:4px; font-size:17px; color:var(--text-primary);">
          ${isListening
            ? (lang === 'HI' ? 'बोलते रहें...' : 'Listening — speak now')
            : (lang === 'HI' ? 'CRAFTORA वॉइस असिस्टेंट' : 'CRAFTORA Voice Assistant')}
        </h3>

        <p style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">
          ${isSRAvailable
            ? `Language: <strong>${langLabel}</strong> • Tap mic to start/stop`
            : 'Voice input is not supported in this browser. Please type instead.'}
        </p>

        <!-- Status indicator -->
        <div style="display:flex; align-items:center; justify-content:center; gap:8px;
                    margin-bottom:16px; font-size:12px; font-weight:600;
                    color: ${isListening ? 'var(--terracotta)' : 'var(--text-muted)'};">
          ${isListening
            ? `<span style="display:inline-block; width:8px; height:8px; border-radius:50%;
                           background:var(--terracotta); animation:pulse-voice 1s infinite;"></span>`
            : `<span style="display:inline-block; width:8px; height:8px; border-radius:50%;
                           background:var(--border-medium);"></span>`}
          ${stateLabel}
        </div>

        <!-- Transcript area -->
        <div style="background:var(--bg-input); border:1.5px solid var(--border-light);
                    border-radius:var(--radius-md); padding:14px; margin-bottom:18px;
                    text-align:left; min-height:70px;">
          <div style="font-size:10px; font-weight:700; color:var(--text-muted);
                      text-transform:uppercase; letter-spacing:0.07em; margin-bottom:6px;
                      display:flex; align-items:center; gap:5px;">
            ${renderIcon('sparkles', '', 12)} Transcript
          </div>
          <div id="voice-transcript-display"
               style="font-size:14px; color:var(--text-primary); line-height:1.6;
                      font-style:${_voiceTranscript ? 'normal' : 'italic'};">
            ${_voiceTranscript || (lang === 'HI'
              ? 'यहाँ आपकी आवाज़ दिखेगी...'
              : 'Your speech will appear here...')}
          </div>
        </div>

        <!-- Instruction hint -->
        ${_voiceContext === 'profile' ? `
          <div class="notice-box" style="text-align:left; margin-bottom:14px;">
            ${renderIcon('sparkles', '', 12)}
            <div style="font-size:11px;">
              ${lang === 'HI'
                ? 'उदाहरण: "मेरा नाम रमेश है, मैं असम से हूँ, मैं बाँस की टोकरी बनाता हूँ।"'
                : 'Example: "My name is Ramesh Kumar, I make bamboo baskets in Assam."'}
            </div>
          </div>
        ` : _voiceContext === 'product' ? `
          <div class="notice-box" style="text-align:left; margin-bottom:14px;">
            ${renderIcon('sparkles', '', 12)}
            <div style="font-size:11px;">
              ${lang === 'HI'
                ? 'उदाहरण: "यह बाँस की हस्तनिर्मित टोकरी है, प्राकृतिक बाँस से बनी।"'
                : 'Example: "This is a handmade bamboo basket made from natural bamboo."'}
            </div>
          </div>
        ` : ''}

        <!-- Action buttons -->
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${isSRAvailable ? `
            <button class="btn-voice" id="voice-listen-btn"
                    onclick="window.toggleVoiceListening()">
              ${renderIcon('mic', '', 16)}
              ${isListening
                ? (lang === 'HI' ? 'रोकें' : 'Stop Listening')
                : (lang === 'HI' ? 'बोलना शुरू करें' : 'Start Listening')}
            </button>

            ${_voiceTranscript && _voiceState === 'done' ? `
              <button class="btn-primary" onclick="window.applyVoiceTranscript()">
                ${renderIcon('check', '', 16)}
                ${lang === 'HI' ? 'इसे लागू करें' : 'Apply This Transcript'}
              </button>
            ` : ''}
          ` : `
            <div class="disclaimer-box" style="text-align:left;">
              ${renderIcon('alertCircle', '', 16)}
              <div>
                <strong>Voice input is not supported in this browser.</strong><br>
                Please use Chrome or Edge on desktop/Android. You can type your information instead.
              </div>
            </div>
          `}

          <button class="btn-secondary" onclick="window.closeVoiceModal()">
            ${_voiceTranscript ? 'Done / Close' : 'Cancel'}
          </button>
        </div>

      </div>
    </div>
  `;
}

/* ── Toggle listening ────────────────────────────────────────────── */
window.toggleVoiceListening = () => {
  if (!SR) {
    _voiceState = 'unavailable';
    appState.notify();
    return;
  }

  if (_voiceState === 'listening') {
    _stopRecognition();
  } else {
    _startRecognition();
  }
};

/* ── Start SpeechRecognition ─────────────────────────────────────── */
function _startRecognition() {
  if (_recognition) {
    try { _recognition.stop(); } catch(e) {}
  }

  const lang = appState.data.language === 'HI' ? 'hi-IN' : 'en-IN';

  _recognition = new SR();
  _recognition.lang = lang;
  _recognition.interimResults = true;
  _recognition.continuous = false;
  _recognition.maxAlternatives = 1;

  _recognition.onstart = () => {
    _voiceState = 'listening';
    _voiceTranscript = '';
    appState.notify();
  };

  _recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        final += result[0].transcript;
      } else {
        interim += result[0].transcript;
      }
    }

    // Update the transcript display in real-time without full re-render
    const displayEl = document.getElementById('voice-transcript-display');
    const combined = (final || interim).trim();
    _voiceTranscript = combined;

    if (displayEl) {
      displayEl.textContent = combined || '...';
      displayEl.style.fontStyle = 'normal';
    }
  };

  _recognition.onerror = (event) => {
    const err = event.error;
    if (err === 'not-allowed') {
      _voiceState = 'error';
      _voiceTranscript = '⚠ Microphone permission denied. Please allow mic access and try again.';
    } else if (err === 'no-speech') {
      _voiceState = 'error';
      _voiceTranscript = 'No speech detected. Please speak louder or try again.';
    } else if (err === 'network') {
      _voiceState = 'error';
      _voiceTranscript = 'Network error — voice recognition requires internet access.';
    } else {
      _voiceState = 'error';
      _voiceTranscript = `Error: ${err}. Please try again.`;
    }
    appState.notify();
  };

  _recognition.onend = () => {
    if (_voiceState === 'listening') {
      _voiceState = _voiceTranscript ? 'done' : 'idle';
    }
    appState.notify();
  };

  try {
    _recognition.start();
  } catch (e) {
    _voiceState = 'error';
    _voiceTranscript = 'Could not start microphone: ' + e.message;
    appState.notify();
  }
}

/* ── Stop recognition ────────────────────────────────────────────── */
function _stopRecognition() {
  _voiceState = 'processing';
  appState.notify();
  if (_recognition) {
    try { _recognition.stop(); } catch(e) {}
  }
}

/* ── Apply transcript to calling context ─────────────────────────── */
window.applyVoiceTranscript = () => {
  if (!_voiceTranscript) return;

  if (_voiceContext === 'profile') {
    _applyToProfileFields(_voiceTranscript);
  } else if (_voiceContext === 'product') {
    _applyToProductFields(_voiceTranscript);
  }

  appState.closeVoiceModal();
};

/* ── Profile keyword parser ──────────────────────────────────────── */
function _applyToProfileFields(transcript) {
  const t = transcript.toLowerCase();

  // Extract name — look for "name is X", "मेरा नाम X है", or first proper noun pattern
  let extractedName = null;
  const nameMatch = t.match(/(?:name is|my name is|i am|मेरा नाम|नाम है)\s+([a-z\u0900-\u097f ]+?)(?:\s+(?:and|from|,|।)|$)/i);
  if (nameMatch) {
    extractedName = _titleCase(nameMatch[1].trim());
  }

  // Extract location — look for "from X", "in X", "X से हूँ"
  let extractedLoc = null;
  const locMatch = t.match(/(?:from|in|live in|based in|असम|बिहार|राजस्थान|X से)\s+([a-z\u0900-\u097f ,]+?)(?:\s+(?:and|,|।|i make)|$)/i);
  if (locMatch) {
    extractedLoc = _titleCase(locMatch[1].trim().replace(/[।,]+$/, ''));
  }

  // Apply to DOM if elements exist
  const nameEl = document.getElementById('artisan_name_input');
  const locEl  = document.getElementById('artisan_location_input');

  if (extractedName && nameEl) nameEl.value = extractedName;
  if (extractedLoc && locEl) locEl.value = extractedLoc;

  // Also call the external callback if one was registered
  if (typeof _onTranscriptExtracted === 'function') {
    _onTranscriptExtracted({
      name: extractedName || '',
      location: extractedLoc || '',
      transcript: transcript
    });
  }
}

/* ── Product keyword parser ──────────────────────────────────────── */
function _applyToProductFields(transcript) {
  const descEl  = document.getElementById('edit_draft_desc');
  const titleEl = document.getElementById('edit_draft_title');

  if (descEl && !descEl.value.trim()) {
    descEl.value = _titleCase(transcript.trim());
  }

  // Try to generate a title from first sentence
  if (titleEl && !titleEl.value.trim()) {
    const firstSentence = transcript.split(/[.।]/)[0].trim();
    if (firstSentence.length > 4 && firstSentence.length < 60) {
      titleEl.value = _titleCase(firstSentence);
    }
  }

  if (typeof _onTranscriptExtracted === 'function') {
    _onTranscriptExtracted({ transcript, description: transcript });
  }
}

/* ── Utility: Title Case ─────────────────────────────────────────── */
function _titleCase(str) {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/* ── Public API: open modal for profile context ──────────────────── */
window.openVoiceAssistantProfile = (onExtracted) => {
  _voiceContext = 'profile';
  _voiceState = 'idle';
  _voiceTranscript = '';
  _recognition = null;
  _onTranscriptExtracted = onExtracted || null;
  appState.openVoiceModal(onExtracted);
};

/* ── Public API: open modal for product context ──────────────────── */
window.openVoiceAssistantProduct = (onExtracted) => {
  _voiceContext = 'product';
  _voiceState = 'idle';
  _voiceTranscript = '';
  _recognition = null;
  _onTranscriptExtracted = onExtracted || null;
  appState.openVoiceModal(onExtracted);
};

/* ── Close modal and stop recognition ───────────────────────────── */
window.closeVoiceModal = () => {
  if (_recognition) {
    try { _recognition.stop(); } catch(e) {}
    _recognition = null;
  }
  _voiceState = 'idle';
  _voiceTranscript = '';
  _voiceContext = null;
  appState.closeVoiceModal();
};
