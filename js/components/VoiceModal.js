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

/* ── Bilingual Speech Parser for Artisan Profile ─────────────────── */
export function parseArtisanProfileSpeech(transcript) {
  if (!transcript || typeof transcript !== 'string') return {};
  const t = transcript.trim();
  const lower = t.toLowerCase();

  let name = '';
  let craft = '';
  let location = '';

  // 1. Name Parsing
  // Hindi pattern: "मेरा नाम रमेश है" or "मेरा नाम रमेश कुमार"
  const hiNameMatch = t.match(/(?:मेरा\s*नाम|नाम\s*है|नाम)\s+([^\d,.!?;:।\n]+?)(?:\s+है|\s+हूँ|\s+हूं|[.,।!]|\s+और|\s+मैं|\s+असम|\s+से|$)/i);
  if (hiNameMatch && hiNameMatch[1].trim()) {
    name = _cleanName(hiNameMatch[1].trim());
  }

  // English pattern: "My name is Ramesh" or "I am Ramesh"
  if (!name) {
    const enNameMatch = t.match(/(?:my\s*name\s*is|i\s*am|name\s*is)\s+([a-zA-Z\s]+?)(?:[.,!?]|\s+and\b|\bi\s+make\b|\bi\s+am\s+from\b|\bfrom\b|$)/i);
    if (enNameMatch && enNameMatch[1].trim()) {
      name = _cleanName(enNameMatch[1].trim());
    }
  }

  // 2. Craft Parsing (Map keywords to CRAFTORA Catalog Crafts)
  if (lower.includes('bamboo') || lower.includes('basket') || lower.includes('बाँस') || lower.includes('बांस') || lower.includes('टोकरी')) {
    craft = 'Bamboo Craft';
  } else if (lower.includes('madhubani') || lower.includes('मधुबनी') || lower.includes('मिथिला') || lower.includes('painting') || lower.includes('चित्रकला') || lower.includes('पेंटिंग')) {
    craft = 'Madhubani Painting';
  } else if (lower.includes('blue pottery') || lower.includes('pottery') || lower.includes('घड़ा') || lower.includes('मिट्टी') || lower.includes('बर्तन')) {
    craft = 'Blue Pottery';
  } else if (lower.includes('phulkari') || lower.includes('embroidery') || lower.includes('फुलकारी') || lower.includes('कढ़ाई')) {
    craft = 'Phulkari Embroidery';
  } else if (lower.includes('banarasi') || lower.includes('weaving') || lower.includes('saree') || lower.includes('बनारसी') || lower.includes('बुनाई') || lower.includes('साड़ी')) {
    craft = 'Banarasi Weaving';
  } else if (lower.includes('terracotta') || lower.includes('टेराकोटा') || lower.includes('clay work')) {
    craft = 'Terracotta Clay Work';
  }

  // 3. Location Parsing
  const locationMap = [
    { keys: ['assam', 'असम'], name: 'Assam, India' },
    { keys: ['bihar', 'बिहार', 'patna', 'पटना', 'madhubani'], name: 'Bihar, India' },
    { keys: ['rajasthan', 'राजस्थान', 'jaipur', 'जयपुर'], name: 'Jaipur, Rajasthan' },
    { keys: ['punjab', 'पंजाब', 'amritsar', 'अमृतसर'], name: 'Punjab, India' },
    { keys: ['varanasi', 'वाराणसी', 'banaras', 'बनारस', 'uttar pradesh', 'उत्तर प्रदेश', 'up'], name: 'Varanasi, UP' },
    { keys: ['bengal', 'पश्चिम बंगाल', 'bankura', 'बांकुरा', 'kolkata'], name: 'West Bengal, India' },
    { keys: ['delhi', 'दिल्ली'], name: 'Delhi, India' },
    { keys: ['kashmir', 'कश्मीर'], name: 'Kashmir, India' },
    { keys: ['gujarat', 'गुजरात'], name: 'Gujarat, India' },
    { keys: ['odisha', 'ओडिशा'], name: 'Odisha, India' }
  ];

  for (const loc of locationMap) {
    if (loc.keys.some(k => lower.includes(k))) {
      location = loc.name;
      break;
    }
  }

  // Fallback regex if specific state was not in dictionary
  if (!location) {
    const locMatchEn = t.match(/(?:from|in|live in|based in)\s+([a-zA-Z\s]+?)(?:[.,!?]|\s+and\b|\bi\s+make\b|$)/i);
    if (locMatchEn && locMatchEn[1].trim()) {
      location = _titleCase(locMatchEn[1].trim());
    } else {
      const locMatchHi = t.match(/([^\d,.!?;:।\n]+?)\s*से\s*(?:हूँ|रहता|हूँ|आता)/i);
      if (locMatchHi && locMatchHi[1].trim()) {
        location = locMatchHi[1].trim();
      }
    }
  }

  return { name, craft, location };
}

function _cleanName(raw) {
  return raw
    .replace(/\b(?:my|name|is|i|am)\b/gi, '')
    .replace(/(?:मेरा|नाम|है|हूँ|हूं)/g, '')
    .trim()
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/* ── Profile keyword parser ──────────────────────────────────────── */
function _applyToProfileFields(transcript) {
  const extracted = parseArtisanProfileSpeech(transcript);

  // 1. Update persistent state draft
  if (!appState.data.onboardingDraft) appState.data.onboardingDraft = {};
  if (extracted.name) appState.data.onboardingDraft.name = extracted.name;
  if (extracted.craft) appState.data.onboardingDraft.craftCategory = extracted.craft;
  if (extracted.location) appState.data.onboardingDraft.location = extracted.location;
  appState.data.onboardingDraft.voiceTranscript = transcript;
  appState.data.onboardingDraft.isVoiceExtracted = true;

  // 2. If elements already exist in DOM, update them immediately
  const nameEl  = document.getElementById('artisan_name_input');
  const craftEl = document.getElementById('artisan_craft_select');
  const locEl   = document.getElementById('artisan_location_input');

  if (extracted.name && nameEl) nameEl.value = extracted.name;
  if (extracted.craft && craftEl) craftEl.value = extracted.craft;
  if (extracted.location && locEl) locEl.value = extracted.location;

  // 3. If currently in onboarding mobile/OTP or welcome, navigate directly to profile setup
  if (appState.data.currentRole === 'artisan' && appState.data.activeArtisanScreen !== 'profile_step1') {
    appState.setArtisanScreen('profile_step1');
  } else {
    appState.notify();
  }

  // 4. Also call the external callback if one was registered
  if (typeof _onTranscriptExtracted === 'function') {
    _onTranscriptExtracted({
      name: extracted.name || '',
      craft: extracted.craft || '',
      location: extracted.location || '',
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
