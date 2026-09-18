// Automated Verification Suite for CRAFTORA Functional Pass
import { appState } from './js/state.js';
import { renderAdminView } from './js/views/admin/AdminViews.js';
import { renderArtisanView } from './js/views/artisan/ArtisanViews.js';
import { renderBuyerView } from './js/views/buyer/BuyerViews.js';
import { renderLandingView } from './js/views/shared/LandingView.js';
import { renderQRScannerModal } from './js/components/QRScannerModal.js';
import { renderVoiceModal, parseArtisanProfileSpeech } from './js/components/VoiceModal.js';
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
console.log('--- CRAFTORA COMPREHENSIVE VERIFICATION SUITE ---');
console.log('======================================================\n');

// ----------------------------------------------------
// USER TEST 1: App Launch -> Screen 1 -> Artisan Flow -> Empty New Profile
// ----------------------------------------------------
console.log('TEST 1: App Launch -> Screen 1 -> Artisan Flow -> Empty New Profile');
appState.initDefaultState();
assert(appState.data.currentRole === 'landing', 'Initial role on launch is "landing" (Screen 1 Entry Point)');

const landingHtml = renderLandingView();
assert(landingHtml.includes("AI-POWERED DIGITAL BUSINESS PLATFORM FOR ARTISANS"), 'Screen 1 contains title "AI-POWERED DIGITAL BUSINESS PLATFORM FOR ARTISANS"');
assert(landingHtml.includes("I'm an Artisan"), 'Screen 1 has "I\'m an Artisan" button');
assert(landingHtml.includes("I'm a Buyer"), 'Screen 1 has "I\'m a Buyer" button');
assert(landingHtml.includes("CREATE • PRICE • CONNECT • VERIFY"), 'Screen 1 contains tag "CREATE • PRICE • CONNECT • VERIFY"');
assert(landingHtml.includes("Admin Verification Portal"), 'Screen 1 contains Admin Portal entry link at bottom');

// Click "I'm an Artisan"
appState.startNewArtisanRegistration();
assert(appState.data.currentRole === 'artisan', 'Role transitioned to "artisan"');
assert(appState.data.activeArtisanScreen === 'onboarding', 'Screen transitioned to artisan "onboarding"');
assert(appState.data.artisanAuth.isRegistered === false, 'New artisan isRegistered is false');
assert(appState.data.onboardingDraft.name === '', 'New artisan draft name starts EMPTY');
assert(appState.data.onboardingDraft.craftCategory === '', 'New artisan draft craft starts EMPTY');
assert(appState.data.onboardingDraft.location === '', 'New artisan draft location starts EMPTY');

// Step 1: Mobile Screen
const mobileHtml = renderArtisanView('onboarding');
assert(mobileHtml.includes('artisan_mobile_input'), 'Mobile screen contains mobile input');
assert(mobileHtml.includes('placeholder="10-digit number"'), 'Mobile input has proper placeholder');
assert(mobileHtml.includes('value=""'), 'Mobile input value is initially EMPTY for new user');

// Enter mobile and send demo OTP
appState.data.onboardingDraft.mobileNumber = '9876543210';
appState.setArtisanScreen('onboarding_otp');
assert(appState.data.activeArtisanScreen === 'onboarding_otp', 'Transitioned to "onboarding_otp"');

// Step 2: Demo OTP Screen
const otpHtml = renderArtisanView('onboarding_otp');
assert(otpHtml.includes('1234'), 'Demo OTP screen indicates 1234');
assert(otpHtml.includes('artisan_otp_input'), 'Contains OTP input');

// Verify OTP
appState.data.onboardingDraft.otp = '1234';
appState.setArtisanScreen('profile_step1');
assert(appState.data.activeArtisanScreen === 'profile_step1', 'Transitioned to "profile_step1"');

// Step 3: New Profile Setup Screen — Fields MUST be EMPTY with proper placeholders
const profileHtml = renderArtisanView('profile_step1');
assert(profileHtml.includes('placeholder="Enter your name"'), 'Name field has placeholder "Enter your name"');
assert(profileHtml.includes('value=""'), 'Name field starts EMPTY without demo data');
assert(profileHtml.includes('Select your craft'), 'Craft dropdown has "Select your craft" option');
assert(profileHtml.includes('disabled selected>Select your craft</option>'), 'Craft default is disabled empty selection');
assert(profileHtml.includes('placeholder="Enter your location"'), 'Location field has placeholder "Enter your location"');
assert(!profileHtml.includes('value="Ramesh Kumar"'), 'Old demo name "Ramesh Kumar" does NOT appear for new registration');

// ----------------------------------------------------
// USER TEST 2: Voice Input — Transcript Populates Profile
// ----------------------------------------------------
console.log('\nTEST 2: Voice Input — Bilingual Speech Parsing & Form Population');

// Test English extraction: "My name is Ramesh. I make bamboo baskets. I am from Assam."
const enSpeech = "My name is Ramesh. I make bamboo baskets. I am from Assam.";
const extractedEn = parseArtisanProfileSpeech(enSpeech);
assert(extractedEn.name.toLowerCase().includes('ramesh'), `English speech parses Name: "${extractedEn.name}"`);
assert(extractedEn.craft === 'Bamboo Craft', `English speech parses Craft: "${extractedEn.craft}"`);
assert(extractedEn.location.toLowerCase().includes('assam'), `English speech parses Location: "${extractedEn.location}"`);

// Test Hindi extraction: "मेरा नाम रमेश है। मैं बाँस की टोकरी बनाता हूँ। मैं असम से हूँ।"
const hiSpeech = "मेरा नाम रमेश है। मैं बाँस की टोकरी बनाता हूँ। मैं असम से हूँ।";
const extractedHi = parseArtisanProfileSpeech(hiSpeech);
assert(extractedHi.name.includes('रमेश') || extractedHi.name.toLowerCase().includes('ramesh'), `Hindi speech parses Name: "${extractedHi.name}"`);
assert(extractedHi.craft === 'Bamboo Craft', `Hindi speech parses Craft: "${extractedHi.craft}"`);
assert(extractedHi.location.toLowerCase().includes('assam'), `Hindi speech parses Location: "${extractedHi.location}"`);

// Populate draft from voice transcript as done by applyVoiceTranscript
appState.data.onboardingDraft.name = extractedEn.name;
appState.data.onboardingDraft.craftCategory = extractedEn.craft;
appState.data.onboardingDraft.location = extractedEn.location;
appState.data.onboardingDraft.isVoiceExtracted = true;
appState.data.onboardingDraft.voiceTranscript = enSpeech;

const voicePopulatedHtml = renderArtisanView('profile_step1');
assert(voicePopulatedHtml.includes('Voice-Suggested Profile'), 'Displays Voice-Suggested Profile banner');
assert(voicePopulatedHtml.includes(`value="${extractedEn.name}"`), 'Name field is populated from voice');
assert(voicePopulatedHtml.includes(`selected>Bamboo Craft (Assam)</option>`), 'Craft dropdown selects Bamboo Craft from voice');
assert(voicePopulatedHtml.includes(`value="${extractedEn.location}"`), 'Location field is populated from voice');

// Manual edit and complete registration
const editedName = 'Rameshwar Barua';
const randomSuffix = Math.floor(100000 + Math.random() * 900000);
const generatedArtisanId = `CRF-ART-${randomSuffix}`;
const registeredProfile = {
  id: generatedArtisanId,
  name: editedName,
  craftCategory: 'Bamboo Craft',
  location: 'Assam, India',
  mobileNumber: '9876543210'
};
appState.data.artisanAuth.artisanProfile = registeredProfile;
appState.data.artisanAuth.isRegistered = true;
appState.setArtisanScreen('artisan_id_card');

const idCardHtml = renderArtisanView('artisan_id_card');
assert(idCardHtml.includes(generatedArtisanId), `Artisan ID card renders new User ID: ${generatedArtisanId}`);
assert(idCardHtml.includes(editedName), `Artisan ID card displays manually edited name: ${editedName}`);

// ----------------------------------------------------
// USER TEST 3: Buyer Authentication Flow
// ----------------------------------------------------
console.log('\nTEST 3: Complete Buyer Authentication Flow');
// Reset to Screen 1
appState.setRole('landing');
assert(appState.data.currentRole === 'landing', 'Reset to Screen 1');

// Click "I'm a Buyer"
appState.startBuyerAuth();
assert(appState.data.currentRole === 'buyer', 'Transitioned to "buyer" role');
assert(appState.data.activeBuyerScreen === 'welcome', 'Screen transitioned to buyer "welcome"');
assert(appState.data.buyerAuth.isRegistered === false, 'Buyer isRegistered is false');

// Buyer Welcome Screen
const buyerWelcomeHtml = renderBuyerView('welcome');
assert(buyerWelcomeHtml.includes('Welcome, Buyer'), 'Buyer welcome screen renders');
assert(buyerWelcomeHtml.includes('Continue with Mobile'), 'Contains "Continue with Mobile" button');
assert(buyerWelcomeHtml.includes('Continue as Guest'), 'Contains "Continue as Guest" option');

// Step 1: Buyer Mobile Screen
appState.setBuyerScreen('buyer_mobile');
const buyerMobileHtml = renderBuyerView('buyer_mobile');
assert(buyerMobileHtml.includes('BUYER AUTHENTICATION · STEP 1 OF 3'), 'Buyer Step 1 Mobile screen renders');
assert(buyerMobileHtml.includes('buyer_mobile_input'), 'Contains buyer mobile input');

// Step 2: Buyer Demo OTP Screen
appState.data.buyerDraft.mobileNumber = '9123456780';
appState.setBuyerScreen('buyer_otp');
const buyerOtpHtml = renderBuyerView('buyer_otp');
assert(buyerOtpHtml.includes('BUYER AUTHENTICATION · STEP 2 OF 3'), 'Buyer Step 2 Demo OTP screen renders');
assert(buyerOtpHtml.includes('1234'), 'Specifies Demo OTP (1234)');

// Step 3: Buyer Registration Profile Screen
appState.setBuyerScreen('register');
const buyerRegHtml = renderBuyerView('register');
assert(buyerRegHtml.includes('BUYER REGISTRATION · STEP 3 OF 3'), 'Buyer Step 3 Profile setup screen renders');
assert(buyerRegHtml.includes('buyer_reg_name'), 'Contains Buyer Name input');
assert(buyerRegHtml.includes('buyer_reg_city'), 'Contains City/Location input');

// Complete Buyer Registration
const newBuyer = appState.completeBuyerRegistration('Priya Sengupta', 'Kolkata, WB', '9123456780');
assert(newBuyer.id.startsWith('CRF-BUY-'), `Generated Buyer ID starts with CRF-BUY- (${newBuyer.id})`);
assert(appState.data.buyerAuth.isRegistered === true, 'buyerAuth.isRegistered is true');
assert(appState.data.activeBuyerScreen === 'explore', 'Transitioned to Buyer Home / Explore');
assert(appState.data.currentRole === 'buyer', 'Role remains strictly "buyer" (never enters artisan dashboard)');

// ----------------------------------------------------
// USER TEST 4: Protected Admin Login
// ----------------------------------------------------
console.log('\nTEST 4: Protected Admin Login & Dashboard');
appState.setRole('admin');
appState.setAdminScreen('login');
assert(appState.data.adminAuth.isLoggedIn === false, 'Admin initially not logged in');

const adminLoginHtml = renderAdminView('login');
assert(adminLoginHtml.includes('VERIFICATION PORTAL (DEMO ADMIN LOGIN)'), 'Admin Login portal rendered');
assert(adminLoginHtml.includes('admin_login_username') && adminLoginHtml.includes('admin_login_password'), 'Admin login contains username & password fields');

// Test invalid credentials
const failedLogin = appState.loginAdmin('wrongAdmin', 'wrongPass');
assert(!failedLogin.success, 'Invalid admin credentials rejected');
assert(!appState.data.adminAuth.isLoggedIn, 'isLoggedIn remains false on failed login');

// Test valid demo credentials: admin / admin123
const successfulLogin = appState.loginAdmin('admin', 'admin123');
assert(successfulLogin.success, 'Valid demo credentials (admin / admin123) accepted');
assert(appState.data.adminAuth.isLoggedIn === true, 'adminAuth.isLoggedIn is now true');
assert(appState.data.activeAdminScreen === 'dashboard', 'Admin screen redirected to dashboard');

const adminDashHtml = renderAdminView('dashboard');
assert(adminDashHtml.includes('Verification Dashboard'), 'Admin Dashboard renders successfully');
assert(adminDashHtml.includes('Sign Out'), 'Admin Dashboard has Sign Out action');

// ----------------------------------------------------
// USER TEST 5: Normal User Admin Route Protection
// ----------------------------------------------------
console.log('\nTEST 5: Normal Artisan / Buyer Access Denial to Admin Routes');
// Log out admin
appState.logoutAdmin();
assert(appState.data.adminAuth.isLoggedIn === false, 'Admin logged out');

// An Artisan tries to call setAdminScreen
appState.data.currentRole = 'artisan';
appState.data.activeArtisanScreen = 'dashboard';
appState.setAdminScreen('dashboard');
assert(appState.data.currentRole === 'artisan', 'Current role was not switched to admin');
assert(appState.data.activeArtisanScreen === 'dashboard', 'Artisan remains safely in artisan screens');

// Attempt to render admin view directly while role is 'artisan'
const deniedHtmlArtisan = renderAdminView('dashboard');
assert(deniedHtmlArtisan.includes('Access Denied'), 'renderAdminView returns Access Denied for role === "artisan"');

// A Buyer tries to call setAdminScreen
appState.data.currentRole = 'buyer';
appState.data.activeBuyerScreen = 'explore';
appState.setAdminScreen('artisan_list');
assert(appState.data.currentRole === 'buyer', 'Current role remains "buyer"');
assert(appState.data.activeBuyerScreen === 'explore', 'Buyer remains safely in buyer screens');

const deniedHtmlBuyer = renderAdminView('artisan_list');
assert(deniedHtmlBuyer.includes('Access Denied'), 'renderAdminView returns Access Denied for role === "buyer"');

// ----------------------------------------------------
// USER TEST 6: Returning Artisan Profile Persistence
// ----------------------------------------------------
console.log('\nTEST 6: Returning Artisan Saved Profile Persistence');
// Login as returning artisan (e.g. Ramesh Kumar)
const returnResult = appState.loginReturningArtisan('9876543210');
assert(returnResult.success, 'Returning artisan login successful');
assert(appState.data.currentRole === 'artisan', 'Role is "artisan"');
assert(appState.data.artisanAuth.isRegistered === true, 'artisanAuth.isRegistered is true');
assert(appState.data.activeArtisanScreen === 'dashboard', 'Redirected directly to dashboard');
assert(appState.data.artisanAuth.artisanProfile.name === 'Ramesh Kumar', 'Saved artisan profile loaded: Ramesh Kumar');
assert(appState.data.artisanAuth.artisanProfile.id === 'CRF-ART-001284', 'Saved artisan ID preserved: CRF-ART-001284');

// ----------------------------------------------------
// REGRESSION TESTS: QR Scanning & Web Speech & Demo Bar
// ----------------------------------------------------
console.log('\nREGRESSION: QR Scanner & Route Verification');
const sampleProduct = appState.data.products[0];
const expectedRoute = `/verify/${sampleProduct.id}`;
assert(expectedRoute.startsWith('/verify/CRF-'), `Expected verification route is /verify/CRF-... (${expectedRoute})`);

const simulatedQR = `/verify/${sampleProduct.id}`;
const match = simulatedQR.match(/CRF-[A-Za-z0-9-]+/i);
assert(match && match[0] === sampleProduct.id, `QR text '${simulatedQR}' parsed accurately to '${sampleProduct.id}'`);

const qrScannerHtml = renderQRScannerModal();
assert(qrScannerHtml.includes('craftora-scanner-video'), 'Scanner contains live camera video element');
assert(qrScannerHtml.includes('startCameraScanner'), 'Scanner contains startCameraScanner handler');

console.log('\nREGRESSION: Voice Modal & Visible Language Selector');
appState.data.isVoiceModalOpen = true;
const voiceHtml = renderVoiceModal();
assert(voiceHtml.includes('English (en-IN)'), 'Voice modal displays visible English (en-IN) option');
assert(voiceHtml.includes('हिन्दी (hi-IN)'), 'Voice modal displays visible हिन्दी (hi-IN) option');
appState.data.isVoiceModalOpen = false;

const demoBarHtml = renderDemoControlBar(appState.data);
assert(demoBarHtml.includes('Demo Mode (Testing)'), 'Demo control bar present for evaluation');

console.log('\n======================================================');
console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) process.exit(1);
