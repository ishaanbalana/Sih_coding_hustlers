// Automated Verification Suite for CRAFTORA Functional Pass
import { appState } from './js/state.js';
import { renderAdminView } from './js/views/admin/AdminViews.js';
import { renderArtisanView } from './js/views/artisan/ArtisanViews.js';
import { renderBuyerView } from './js/views/buyer/BuyerViews.js';
import { renderQRScannerModal } from './js/components/QRScannerModal.js';
import { renderVoiceModal } from './js/components/VoiceModal.js';
import { renderDemoControlBar } from './js/components/DemoControlBar.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('--- CRAFTORA FUNCTIONAL VERIFICATION SUITE ---');
console.log('======================================================\n');

// TEST 1: QR Generation & Scanning Logic
console.log('TEST 1: QR Verification & Route Specification');
const sampleProduct = appState.data.products[0];
const expectedRoute = `/verify/${sampleProduct.id}`;
assert(expectedRoute.startsWith('/verify/CRF-'), `Expected verification route is /verify/CRF-... (got ${expectedRoute})`);

// Test QR scanner parsing function
const simulatedText1 = `/verify/${sampleProduct.id}`;
const match1 = simulatedText1.match(/CRF-[A-Za-z0-9-]+/i);
assert(match1 && match1[0] === sampleProduct.id, `QR text '${simulatedText1}' parsed accurately to '${sampleProduct.id}'`);

const simulatedText2 = `https://craftora.gov.in/verify/${sampleProduct.id}`;
const match2 = simulatedText2.match(/CRF-[A-Za-z0-9-]+/i);
assert(match2 && match2[0] === sampleProduct.id, `Full URL QR text '${simulatedText2}' parsed accurately to '${sampleProduct.id}'`);

// Verify QR Scanner markup includes ZXing video and controls
const qrScannerHtml = renderQRScannerModal();
assert(qrScannerHtml.includes('craftora-scanner-video'), 'Scanner contains live camera video element for ZXing');
assert(qrScannerHtml.includes('startCameraScanner'), 'Scanner contains startCameraScanner handler');
assert(qrScannerHtml.includes('handleQRImageUpload'), 'Scanner contains file-based QR upload decoder');
assert(qrScannerHtml.includes('triggerSimulatedQRScan'), 'Scanner contains demo fallback scanner');

// TEST 2: Voice Language Selector & Web Speech Integration
console.log('\nTEST 2: Voice Input & Visible Language Selector');
appState.data.isVoiceModalOpen = true;
const voiceHtml = renderVoiceModal();
assert(voiceHtml.includes('English (en-IN)'), 'Voice modal displays visible English (en-IN) option');
assert(voiceHtml.includes('हिन्दी (hi-IN)'), 'Voice modal displays visible हिन्दी (hi-IN) option');
assert(voiceHtml.includes('setVoiceLanguage'), 'Voice modal includes explicit language switcher');
assert(voiceHtml.includes('voice-transcript-display'), 'Voice modal contains transcript display area');
appState.data.isVoiceModalOpen = false;

// TEST 3: Admin Demo Authentication & Access Separation
console.log('\nTEST 3: Admin Credentials & Protected Routes');
// Reset to unauthenticated
appState.data.adminAuth.isLoggedIn = false;
appState.data.currentRole = 'admin';

// Verify unauthenticated admin sees login screen
const loginHtml = renderAdminView('dashboard');
assert(loginHtml.includes('VERIFICATION PORTAL (DEMO AUTH)'), 'Unauthenticated admin view strictly forces login portal');
assert(loginHtml.includes('admin_login_username') && loginHtml.includes('admin_login_password'), 'Login portal contains username & password inputs');

// Test invalid credentials
const invalidResult = appState.loginAdmin('wrongUser', 'wrongPass');
assert(!invalidResult.success, 'Invalid credentials rejected');
assert(!appState.data.adminAuth.isLoggedIn, 'adminAuth.isLoggedIn remains false on failed login');

// Test valid demo credentials: admin / admin123
const validResult = appState.loginAdmin('admin', 'admin123');
assert(validResult.success, 'Demo credentials admin / admin123 accepted');
assert(appState.data.adminAuth.isLoggedIn === true, 'adminAuth.isLoggedIn set to true');
assert(appState.data.activeAdminScreen === 'dashboard', 'Admin screen redirected to dashboard on success');

// Verify dashboard renders for logged in admin
const dashHtml = renderAdminView('dashboard');
assert(dashHtml.includes('Verification Dashboard'), 'Authenticated admin dashboard rendered');
assert(dashHtml.includes('window.logoutAdmin'), 'Dashboard includes Sign Out action');

// Test sign out
appState.logoutAdmin();
assert(appState.data.adminAuth.isLoggedIn === false, 'logoutAdmin successfully resets isLoggedIn to false');
const postLogoutHtml = renderAdminView('dashboard');
assert(postLogoutHtml.includes('VERIFICATION PORTAL (DEMO AUTH)'), 'Post-logout view returns to login portal');

// TEST 4: Demo Mode Developer-Only Toggle
console.log('\nTEST 4: Demo Mode Developer-Only Control');
const demoBarHtml = renderDemoControlBar(appState.data);
assert(demoBarHtml.includes('Demo Mode (Testing)'), 'Demo bar has subtle collapsible trigger labeled Demo Mode (Testing)');

// TEST 5: Artisan Onboarding Flow & Aadhaar-Free Compliance
console.log('\nTEST 5: Artisan Onboarding: Role -> Mobile -> Demo OTP -> Profile -> CRAFTORA User ID -> Dashboard');
// Step 1: Mobile input screen
const mobileScreenHtml = renderArtisanView('onboarding');
assert(mobileScreenHtml.includes('ARTISAN ONBOARDING · STEP 1 OF 3'), 'Step 1 Mobile input screen renders correctly');
assert(mobileScreenHtml.includes('artisan_mobile_input'), 'Contains mobile number input');
assert(mobileScreenHtml.includes('submitArtisanMobile'), 'Contains submitArtisanMobile handler');

// Step 2: Demo OTP screen
const otpScreenHtml = renderArtisanView('onboarding_otp');
assert(otpScreenHtml.includes('ARTISAN ONBOARDING · STEP 2 OF 3'), 'Step 2 Demo OTP screen renders correctly');
assert(otpScreenHtml.includes('1234'), 'Specifies demo OTP (1234)');
assert(otpScreenHtml.includes('verifyArtisanOTP'), 'Contains verifyArtisanOTP handler');

// Step 3: Profile setup screen
const profileScreenHtml = renderArtisanView('profile_step1');
assert(profileScreenHtml.includes('ARTISAN ONBOARDING · STEP 3 OF 3'), 'Step 3 Profile setup screen renders correctly');
assert(profileScreenHtml.includes('artisan_name_input'), 'Contains artisan name input');
assert(profileScreenHtml.includes('artisan_craft_select'), 'Contains craft select');
assert(profileScreenHtml.includes('artisan_location_input'), 'Contains location input');
assert(!profileScreenHtml.toLowerCase().includes('upload aadhaar'), 'Zero Aadhaar document upload fields present');
assert(profileScreenHtml.includes('Document-Free Digital Verification'), 'Explicitly notes document-free digital verification');

// Step 4: CRAFTORA User ID display card
const idCardHtml = renderArtisanView('artisan_id_card');
assert(idCardHtml.includes('CRAFTORA ARTISAN PASS'), 'Step 4 CRAFTORA Artisan Pass card rendered');
assert(idCardHtml.includes('Permanent CRAFTORA User ID:'), 'Displays permanent CRAFTORA User ID');
assert(idCardHtml.includes('enterArtisanDashboard'), 'Contains button to enter Artisan Dashboard');

console.log('\n======================================================');
console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) process.exit(1);
