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
let _selectedVoiceLang = 'en-IN'; // Default: en-IN (English). Toggleable to hi-IN (Hindi)

/* ── Check browser support ───────────────────────────────────────── */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

/* ── Render Voice Modal ──────────────────────────────────────────── */
export function renderVoiceModal() {
  const state = appState.data;
  if (!state.isVoiceModalOpen) return '';

  const isHindi = _selectedVoiceLang === 'hi-IN';
  const langLabel = isHindi ? 'हिन्दी (Hindi - hi-IN)' : 'English (India - en-IN)';
  const isSRAvailable = SR !== null;

  const stateLabel = {
    idle:        isHindi ? 'बोलने के लिए तैयार' : 'Ready to listen',
    listening:   isHindi ? 'सुन रहा हूँ...' : 'Listening — speak clearly...',
    processing:  isHindi ? 'प्रसंस्करण हो रहा है...' : 'Processing speech...',
    done:        isHindi ? 'आवाज़ रिकॉर्ड हो गई' : 'Speech captured successfully',
    error:       'Microphone error — please retry',
    unavailable: 'Speech recognition not supported in browser'
  }[_voiceState] || 'Ready';

  const isListening = _voiceState === 'listening';

  return `
    <div class="voice-modal-overlay">
      <div class="voice-modal-card">

        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
            ${renderIcon('mic', '', 18)} CRAFTORA Voice Input
          </div>
          <button onclick="window.closeVoiceModal()"
                  style="background:none; border:none; color:var(--text-muted); font-size:18px; cursor:pointer; padding:2px 6px;">✕</button>
        </div>

        <!-- Visible Language Selector (Default: English en-IN, with Hindi hi-IN) -->
        <div style="margin-bottom:16px;">
          <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px;">
            Choose Input Language:
          </div>
          <div style="display:flex; justify-content:center; gap:8px;">
            <button type="button"
                    class="btn-secondary"
                    style="padding:6px 14px; font-size:12px; border-radius:var(--radius-full); transition:var(--transition-fast); ${!isHindi ? 'background:var(--green); color:white; border-color:var(--green); font-weight:700;' : 'color:var(--text-secondary);'}"
                    onclick="window.setVoiceLanguage('en-IN')">
              🇬🇧 English (en-IN)
            </button>
            <button type="button"
                    class="btn-secondary"
                    style="padding:6px 14px; font-size:12px; border-radius:var(--radius-full); transition:var(--transition-fast); ${isHindi ? 'background:var(--green); color:white; border-color:var(--green); font-weight:700;' : 'color:var(--text-secondary);'}"
                    onclick="window.setVoiceLanguage('hi-IN')">
              🇮🇳 हिन्दी (hi-IN)
            </button>
          </div>
        </div>

        <!-- Mic Orb -->
        <div class="voice-pulse-circle ${isListening ? 'listening' : ''}"
             style="cursor:pointer; margin: 0 auto 12px;" onclick="window.toggleVoiceListening()"
             title="${isListening ? 'Click to stop' : 'Click to speak'}">
          ${renderIcon('mic', '', 32)}
        </div>

        <div style="font-size:13px; font-weight:600; color: ${isListening ? 'var(--terracotta)' : 'var(--text-primary)'}; margin-bottom:4px;">
          ${isListening
            ? (isHindi ? 'सुन रहा हूँ — बोलिए...' : 'Listening — please speak now')
            : (isHindi ? 'माइक दबाकर बोलना शुरू करें' : 'Tap microphone to start speaking')}
        </div>

        <!-- Status indicator -->
        <div style="display:flex; align-items:center; justify-content:center; gap:8px;
                    margin-bottom:14px; font-size:12px; font-weight:600;
                    color: ${isListening ? 'var(--terracotta)' : 'var(--text-muted)'};">
          ${isListening
            ? `<span style="display:inline-block; width:8px; height:8px; border-radius:50%;
                           background:var(--terracotta); animation:pulse-voice 1s infinite;"></span>`
            : `<span style="display:inline-block; width:8px; height:8px; border-radius:50%;
                           background:var(--border-medium);"></span>`}
          ${stateLabel}
        </div>

        <!-- Live Transcript Area -->
        <div style="background:var(--bg-input); border:1.5px solid var(--border-light);
                    border-radius:var(--radius-md); padding:12px; margin-bottom:14px;
                    text-align:left;">
          <div style="font-size:10px; font-weight:700; color:var(--text-muted);
                      text-transform:uppercase; letter-spacing:0.07em; margin-bottom:6px;
                      display:flex; align-items:center; justify-content:space-between;">
            <span style="display:flex; align-items:center; gap:5px;">
              ${renderIcon('sparkles', '', 12)} Spoken Transcript (${_selectedVoiceLang})
            </span>
            ${_voiceTranscript ? `<span style="color:var(--green); font-size:10px;">✓ Captured</span>` : ''}
          </div>
          <textarea id="voice-transcript-display"
                    rows="3"
                    style="width:100%; border:none; background:transparent; resize:none;
                           font-size:13px; color:var(--text-primary); line-height:1.5; font-family:var(--font-body); outline:none;"
                    placeholder="${isHindi ? 'यहाँ आपका बोला हुआ शब्द दिखेगा...' : 'Your live speech transcript will appear here...'}"
                    oninput="_voiceTranscript = this.value">${_voiceTranscript || ''}</textarea>
        </div>

        <!-- Hint -->
        ${_voiceContext === 'profile' ? `
          <div class="notice-box" style="text-align:left; margin-bottom:14px;">
            ${renderIcon('sparkles', '', 12)}
            <div style="font-size:11px;">
              ${isHindi
                ? 'उदाहरण बोलें: "मेरा नाम रमेश है, मैं असम से हूँ, मैं बाँस की टोकरी बनाता हूँ।"'
                : 'Say: "My name is Ramesh Kumar, I am from Assam, I make bamboo craft."'}
            </div>
          </div>
        ` : _voiceContext === 'product' ? `
          <div class="notice-box" style="text-align:left; margin-bottom:14px;">
            ${renderIcon('sparkles', '', 12)}
            <div style="font-size:11px;">
              ${isHindi
                ? 'उदाहरण बोलें: "यह बाँस की हस्तनिर्मित टोकरी है, प्राकृतिक बाँस से बनी।"'
                : 'Say: "Handmade decorative bamboo basket woven from natural Assam bamboo."'}
            </div>
          </div>
        ` : ''}

        <!-- Action buttons -->
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${isSRAvailable ? `
            <button class="btn-voice" id="voice-listen-btn"
                    onclick="window.toggleVoiceListening()">
              ${renderIcon('mic', '', 16)}
              ${isListening
                ? (isHindi ? 'रिकॉर्डिंग रोकें' : 'Stop Listening')
                : (isHindi ? 'बोलना शुरू करें' : 'Start Speaking')}
            </button>

            ${_voiceTranscript ? `
              <button class="btn-primary" onclick="window.applyVoiceTranscript()">
                ${renderIcon('check', '', 16)}
                ${isHindi ? 'यह जानकारी लागू करें' : 'Apply This Transcript'}
              </button>
            ` : ''}
          ` : `
            <div class="disclaimer-box" style="text-align:left;">
              ${renderIcon('alertCircle', '', 16)}
              <div>
                <strong>Web Speech API is not supported in this browser.</strong><br>
                Please use Chrome or Edge. You can also type your details directly.
              </div>
            </div>
          `}

          <button class="btn-secondary" onclick="window.closeVoiceModal()">
            Cancel / Close
          </button>
        </div>

      </div>
    </div>
  `;
}

/* ── Switch Language ─────────────────────────────────────────────── */
window.setVoiceLanguage = (langCode) => {
  _selectedVoiceLang = langCode;
  if (_voiceState === 'listening' && _recognition) {
    try {
      _recognition.stop();
    } catch(e) {}
    setTimeout(() => _startRecognition(), 200);
  } else {
    appState.notify();
  }
};

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

  try {
    _recognition = new SR();
    _recognition.lang = _selectedVoiceLang || 'en-IN';
    _recognition.interimResults = true;
    _recognition.continuous = true;
    _recognition.maxAlternatives = 1;

    _recognition.onstart = () => {
      _voiceState = 'listening';
      appState.notify();
    };

    _recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      const combined = (final + interim).trim();
      if (combined) {
        _voiceTranscript = combined;
      }

      const displayEl = document.getElementById('voice-transcript-display');
      if (displayEl) {
        displayEl.value = _voiceTranscript;
      }
    };

    _recognition.onerror = (event) => {
      const err = event.error;
      if (err === 'not-allowed') {
        _voiceState = 'error';
        _voiceTranscript = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      } else if (err === 'no-speech') {
        // Just keep listening or wait
      } else if (err === 'network') {
        _voiceState = 'error';
        _voiceTranscript = 'Network connection needed for speech-to-text service.';
      } else {
        _voiceState = 'error';
        _voiceTranscript = `Speech recognition error: ${err}`;
      }
      appState.notify();
    };

    _recognition.onend = () => {
      if (_voiceState === 'listening') {
        _voiceState = _voiceTranscript ? 'done' : 'idle';
      }
      appState.notify();
    };

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
  const currentText = document.getElementById('voice-transcript-display')?.value?.trim() || _voiceTranscript?.trim();
  if (!currentText) return;
  _voiceTranscript = currentText;

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
