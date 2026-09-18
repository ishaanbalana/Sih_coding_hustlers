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
                ? 'उदाहरण बोलें: "नाम बदलकर बाँस की टोकरी कर दो", "सामग्री प्राकृतिक बाँस है", "विवरण बदलो..."'
                : 'Say: "Change the product name to bamboo basket", "Material is natural bamboo", "Change description to..."'}
            </div>
          </div>
        ` : _voiceContext === 'dashboard' ? `
          <div class="notice-box" style="text-align:left; margin-bottom:14px;">
            ${renderIcon('sparkles', '', 12)}
            <div style="font-size:11px;">
              ${isHindi
                ? 'कमांड बोलें: "मेरे क्राफ्ट खोलो", "बायर्स ढूँढो", "नया प्रोडक्ट जोड़ो", "मेरा प्रोफाइल खोलो", "पासपोर्ट दिखाओ", "सुझाई गई कीमतें दिखाओ", "डैशबोर्ड"...'
                : 'Say commands: "Open my crafts", "Show my products", "Find buyers", "Show my passports", "Add a new product", "Show my profile", "Show suggested prices", "Go to dashboard"'}
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
    appState.closeVoiceModal();
  } else if (_voiceContext === 'product') {
    _applyToProductFields(_voiceTranscript);
    appState.closeVoiceModal();
  } else if (_voiceContext === 'dashboard') {
    executeDashboardVoiceCommand(_voiceTranscript);
  } else {
    appState.closeVoiceModal();
  }
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

/* ── Bilingual Speech Parser for Product Edits ───────────────────── */
export function parseProductEditSpeech(transcript) {
  if (!transcript || typeof transcript !== 'string') return {};
  const t = transcript.trim();
  if (!t) return {};

  let title = null;
  let category = null;
  let materials = null;
  let description = null;
  let tags = null;

  // Split clauses if multiple statements are chained (by period, danda, semicolon, newline, or " and then ")
  const clauses = t.split(/(?:[.।\n]|;\s*|\band\s+then\b)/i).map(s => s.trim()).filter(Boolean);

  for (const clause of (clauses.length ? clauses : [t])) {
    // 1. Category
    // Commands: "Change category to Bamboo Craft", "Set category as Bamboo Craft", "Change the category to...", etc.
    const catMatchEn = clause.match(/(?:change\s+(?:the\s+)?category\s+(?:to|as)|set\s+(?:the\s+)?category\s+(?:as|to)|update\s+(?:the\s+)?category\s+(?:to|as)|category\s+is)\s+([^.।\n;]+)/i);
    if (catMatchEn && catMatchEn[1].trim()) {
      category = _cleanTitle(catMatchEn[1].trim());
      continue;
    }
    const catMatchHi = clause.match(/(?:उत्पाद\s*की\s*श्रेणी|श्रेणी\s*बदलकर|श्रेणी\s*बदलो|श्रेणी\s*है|श्रेणी)\s+(?:को\s+|है\s+)?([^\d,.!?;:।\n]+?)(?:\s+कर\s*दो|\s+रखो|\s+है|$)/i);
    if (catMatchHi && catMatchHi[1].trim()) {
      category = _cleanTitle(catMatchHi[1].trim());
      continue;
    }

    // 2. Tags
    // Commands: "Change tags to handmade, bamboo, eco-friendly", "Set tags as bamboo, handmade", etc.
    const tagMatchEn = clause.match(/(?:change\s+(?:the\s+)?tags?\s+(?:to|as)|set\s+(?:the\s+)?tags?\s+(?:as|to)|update\s+(?:the\s+)?tags?\s+(?:to|as)|tags?\s+(?:are|is))\s+([^.।\n;]+)/i);
    if (tagMatchEn && tagMatchEn[1].trim()) {
      tags = _cleanTags(tagMatchEn[1].trim());
      continue;
    }
    const tagMatchHi = clause.match(/(?:टैग\s*बदलकर|टैग\s*बदलो|टैग\s*है|टैग)\s+(?:को\s+|है\s+)?([^\d,.!?;:।\n]+?)(?:\s+कर\s*दो|\s+रखो|\s+है|$)/i);
    if (tagMatchHi && tagMatchHi[1].trim()) {
      tags = _cleanTags(tagMatchHi[1].trim());
      continue;
    }

    // 3. Product Name / Title
    // Commands: "Change the product name to Bamboo Basket", "Set product name as Bamboo Basket", "Change title to...", etc.
    const nameMatchEn = clause.match(/(?:change\s+(?:the\s+)?(?:product\s+)?(?:name|title)\s+(?:to|as)|set\s+(?:the\s+)?(?:product\s+)?(?:name|title)\s+(?:as|to)|update\s+(?:the\s+)?(?:product\s+)?(?:name|title)\s+(?:to|as)|(?:product\s+)?name\s+is|title\s+is)\s+([^.।\n;]+)/i);
    if (nameMatchEn && nameMatchEn[1].trim()) {
      title = _cleanTitle(nameMatchEn[1].trim());
      continue;
    }
    const nameMatchHi = clause.match(/(?:उत्पाद\s*का\s*नाम|नाम\s*बदलकर|नाम\s*बदलो|नाम)\s+(?:को\s+|है\s+)?([^\d,.!?;:।\n]+?)(?:\s+कर\s*दो|\s+रखो|\s+है|$)/i);
    if (nameMatchHi && nameMatchHi[1].trim()) {
      title = _cleanTitle(nameMatchHi[1].trim());
      continue;
    }

    // 4. Materials
    // Commands: "Change material to Natural Bamboo", "Set material as Natural Bamboo", "Material is...", etc.
    const matMatchEn = clause.match(/(?:change\s+(?:the\s+)?materials?\s+(?:to|as)|set\s+(?:the\s+)?materials?\s+(?:as|to)|update\s+(?:the\s+)?materials?\s+(?:to|as)|materials?\s+(?:is|are)|made\s+(?:of|from)|using\s+materials?)\s+([^.।\n;]+)/i);
    if (matMatchEn && matMatchEn[1].trim()) {
      materials = _cleanTitle(matMatchEn[1].trim());
      continue;
    }
    const matMatchHi = clause.match(/(?:सामग्री\s*बदलकर|सामग्री\s*बदलो|सामग्री\s*है|सामग्री)\s+(?:को\s+|है\s+)?([^\d,.!?;:।\n]+?)(?:\s+कर\s*दो|\s+रखो|\s+है|$)/i);
    if (matMatchHi && matMatchHi[1].trim()) {
      materials = _cleanTitle(matMatchHi[1].trim());
      continue;
    }

    // 5. Description
    // Commands: "Change description to Handmade bamboo basket made in Assam", "Update the description...", etc.
    const descMatchEn = clause.match(/(?:change\s+(?:the\s+)?description\s+(?:to|as)|update\s+(?:the\s+)?description\s+(?:to|as)|set\s+(?:the\s+)?description\s+(?:as|to)|description\s+is)\s+(.+)/i);
    if (descMatchEn && descMatchEn[1].trim()) {
      description = _cleanSentence(descMatchEn[1].trim());
      continue;
    }
    const descMatchHi = clause.match(/(?:विवरण\s*बदलकर|विवरण\s*बदलो|विवरण\s*है|विवरण)\s+(?:को\s+|है\s+)?(.+?)(?:\s+कर\s*दो|$)/i);
    if (descMatchHi && descMatchHi[1].trim()) {
      description = _cleanSentence(descMatchHi[1].trim());
      continue;
    }
  }

  // NOTE: If the command does not clearly identify a field, DO NOT GUESS.
  // Leave all fields null so no unintended field is updated.

  return { title, category, materials, description, tags, raw: t };
}

function _cleanTitle(str) {
  const trimmed = str.trim().replace(/[.,!?;:।]+$/, '');
  return trimmed.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function _cleanSentence(str) {
  const trimmed = str.trim().replace(/[;:]+$/, '');
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function _cleanTags(raw) {
  if (!raw) return [];
  const cleaned = raw.trim().replace(/[.;:!।]+$/, '');
  return cleaned
    .split(/[,]|(?:\band\b)/i)
    .map(t => t.trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean);
}

/* ── Product keyword parser ──────────────────────────────────────── */
function _applyToProductFields(transcript) {
  const extracted = parseProductEditSpeech(transcript);
  const updatedFields = [];

  // 1. Update active product in appState
  const state = appState.data;
  const product = state.products.find(p => p.id === state.selectedProductId) || state.products[0];

  if (product) {
    if (extracted.title) {
      product.title = extracted.title;
      product.productName = extracted.title;
      updatedFields.push('Product Name');
    }
    if (extracted.category) {
      product.category = extracted.category;
      updatedFields.push('Category');
    }
    if (extracted.materials) {
      product.materials = Array.isArray(extracted.materials)
        ? extracted.materials
        : extracted.materials.split(',').map(s => s.trim()).filter(Boolean);
      updatedFields.push('Materials');
    }
    if (extracted.description) {
      product.description = extracted.description;
      updatedFields.push('Description');
    }
    if (extracted.tags) {
      product.tags = Array.isArray(extracted.tags)
        ? extracted.tags
        : extracted.tags.split(',').map(s => s.trim()).filter(Boolean);
      updatedFields.push('Tags');
    }
  }

  // 2. Save voice suggestion metadata into appState
  state.productVoiceSuggestion = {
    transcript: transcript,
    title: extracted.title,
    category: extracted.category,
    materials: extracted.materials,
    description: extracted.description,
    tags: extracted.tags,
    updatedFields: updatedFields,
    timestamp: Date.now()
  };

  // 3. Update DOM elements directly if rendered
  const titleEl = document.getElementById('edit_draft_title') || document.getElementById('edit_p_name');
  const catEl   = document.getElementById('edit_draft_cat')   || document.getElementById('edit_p_cat');
  const matEl   = document.getElementById('edit_draft_mat')   || document.getElementById('edit_p_mat');
  const descEl  = document.getElementById('edit_draft_desc')  || document.getElementById('edit_p_desc');
  const tagsEl  = document.getElementById('edit_draft_tags')  || document.getElementById('edit_p_tags');

  if (extracted.title && titleEl) {
    titleEl.value = extracted.title;
  }
  if (extracted.category && catEl) {
    catEl.value = extracted.category;
  }
  if (extracted.materials && matEl) {
    matEl.value = Array.isArray(extracted.materials) ? extracted.materials.join(', ') : extracted.materials;
  }
  if (extracted.description && descEl) {
    descEl.value = extracted.description;
  }
  if (extracted.tags && tagsEl) {
    tagsEl.value = Array.isArray(extracted.tags) ? extracted.tags.join(', ') : extracted.tags;
  }

  // 4. Notify appState so the Review Your Product screen re-renders cleanly with Voice Suggestion badge and values
  appState.notify();

  // 5. Call external callback if registered
  if (typeof _onTranscriptExtracted === 'function') {
    _onTranscriptExtracted({
      transcript,
      title: extracted.title,
      category: extracted.category,
      materials: extracted.materials,
      description: extracted.description,
      tags: extracted.tags,
      updatedFields
    });
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

/* ── Public API: open modal for dashboard context ────────────────── */
window.openVoiceAssistantDashboard = (onCommand) => {
  _voiceContext = 'dashboard';
  _voiceState = 'idle';
  _voiceTranscript = '';
  _recognition = null;
  _onTranscriptExtracted = onCommand || null;
  appState.openVoiceModal(onCommand);
};

/* ── Bilingual Speech Parser for Dashboard Commands ──────────────── */
export function parseDashboardVoiceCommand(transcript) {
  if (!transcript || typeof transcript !== 'string') return null;
  const t = transcript.trim().toLowerCase();

  // 1. "Open my crafts" / "मेरे क्राफ्ट खोलो" -> my_crafts
  if (/open\s+(?:my\s+)?crafts|open\s+crafts|मेरे\s*क्राफ्ट\s*(?:खोलो|दिखाओ)?|क्राफ्ट\s*खोलो/i.test(t)) {
    return { command: 'open_my_crafts', screen: 'my_crafts', title: 'My Crafts' };
  }

  // 2. "Show my products" / "मेरे प्रोडक्ट दिखाओ" -> my_crafts
  if (/show\s+(?:my\s+)?products|view\s+(?:my\s+)?products|मेरे\s*प्रोडक्ट\s*(?:दिखाओ|खोलो)?|प्रोडक्ट\s*दिखाओ|उत्पाद\s*दिखाओ/i.test(t)) {
    return { command: 'show_my_products', screen: 'my_crafts', title: 'My Products' };
  }

  // 3. "Find buyers" / "बायर्स ढूँढो" -> market_matches
  if (/find\s+buyers?|search\s+buyers?|market\s+linkage|बायर्स\s*(?:ढूँढो|ढूंढो|दिखाओ|खोजो)|खरीदार\s*(?:ढूँढो|ढूंढो|खोजो)/i.test(t)) {
    return { command: 'find_buyers', screen: 'market_matches', title: 'Market Linkage' };
  }

  // 4. "Show my passports" / "पासपोर्ट दिखाओ" -> passport
  if (/show\s+(?:my\s+)?passports?|view\s+(?:my\s+)?passports?|product\s+passports?|passports?|पासपोर्ट\s*(?:दिखाओ|खोलो)?|मेरे\s*पासपोर्ट/i.test(t)) {
    return { command: 'show_passports', screen: 'passport', title: 'Product Passports' };
  }

  // 5. "Add a new product" / "नया प्रोडक्ट जोड़ो" -> add_product
  if (/add\s+(?:a\s+)?(?:new\s+)?(?:product|craft)|new\s+product|नया\s*प्रोडक्ट\s*(?:जोड़ो|जोड़े)?|नया\s*उत्पाद\s*(?:जोड़ो|जोड़े)?|नया\s*क्राफ्ट/i.test(t)) {
    return { command: 'add_new_product', screen: 'add_product', title: 'Add Product' };
  }

  // 6. "Show my profile" / "मेरा प्रोफाइल खोलो" -> artisan_id_card
  if (/show\s+(?:my\s+)?profile|open\s+(?:my\s+)?profile|view\s+(?:my\s+)?profile|my\s+id|मेरा\s*प्रोफाइल\s*(?:खोलो|दिखाओ)?|प्रोफाइल\s*खोलो/i.test(t)) {
    return { command: 'show_profile', screen: 'artisan_id_card', title: 'Artisan Profile' };
  }

  // 7. "Show suggested prices" / "सुझाई गई कीमतें दिखाओ" -> smart_pricing
  if (/show\s+(?:suggested\s+)?prices?|suggested\s+prices?|smart\s+pricing|सुझाई\s*गई\s*कीमतें?\s*दिखाओ?|सुझाव\s*मूल्य|स्मार्ट\s*प्राइसिंग/i.test(t)) {
    return { command: 'suggested_prices', screen: 'smart_pricing', title: 'Smart Pricing' };
  }

  // 8. "Go to dashboard" / "डैशबोर्ड पर जाओ" -> dashboard
  if (/go\s+to\s+dashboard|open\s+dashboard|show\s+dashboard|\bdashboard\b|डैशबोर्ड\s*(?:पर\s*जाओ|खोलो)?/i.test(t)) {
    return { command: 'go_to_dashboard', screen: 'dashboard', title: 'Artisan Dashboard' };
  }

  return null;
}

/* ── Execute Dashboard Voice Command ─────────────────────────────── */
export function executeDashboardVoiceCommand(transcript) {
  const parsed = parseDashboardVoiceCommand(transcript);

  if (parsed && parsed.screen) {
    // IMPORTANT AUTH RULE:
    // If the artisan is already authenticated, voice navigation must use
    // the existing authenticated artisan state and MUST NOT redirect to Login.
    if (appState.data.currentRole !== 'artisan') {
      appState.data.currentRole = 'artisan';
    }

    appState.data.dashboardVoiceFeedback = {
      transcript,
      success: true,
      destination: parsed.screen,
      message: `Navigating to ${parsed.title}...`
    };

    appState.closeVoiceModal();
    appState.setArtisanScreen(parsed.screen);

    if (typeof _onTranscriptExtracted === 'function') {
      _onTranscriptExtracted(parsed);
    }
    return { success: true, destination: parsed.screen, command: parsed.command };
  } else {
    // For commands that are not recognized:
    // - show the transcript
    // - display a simple "I couldn't understand that command" message
    // - do not navigate randomly
    appState.data.dashboardVoiceFeedback = {
      transcript,
      success: false,
      error: "I couldn't understand that command. Please try: 'Open my crafts', 'Find buyers', 'Add a new product', or 'Show my profile'."
    };

    appState.closeVoiceModal();
    appState.notify();

    if (typeof _onTranscriptExtracted === 'function') {
      _onTranscriptExtracted({ success: false, transcript });
    }
    return { success: false, reason: 'unrecognized_command', transcript };
  }
}
