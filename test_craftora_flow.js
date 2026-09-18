import { appState } from './js/state.js';
import { renderAdminView } from './js/views/admin/AdminViews.js';
import { renderArtisanView } from './js/views/artisan/ArtisanViews.js';
import { renderBuyerView } from './js/views/buyer/BuyerViews.js';
import { renderLandingView } from './js/views/shared/LandingView.js';
import { renderQRScannerModal } from './js/components/QRScannerModal.js';
import { renderVoiceModal, parseArtisanProfileSpeech, parseProductEditSpeech } from './js/components/VoiceModal.js';
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
// USER TESTS 1–6: Review Your Product Screen Voice Input
// ----------------------------------------------------
console.log('\nTESTS 1–6: Review Your Product Screen Voice Input & Field Updates');
appState.data.currentRole = 'artisan';
appState.data.selectedProductId = 'CRF-BAM-001284';
appState.setArtisanScreen('review_product');

const reviewHtmlInitial = renderArtisanView('review_product');
assert(reviewHtmlInitial.includes('Review Your Product'), 'Review Your Product screen renders');
assert(reviewHtmlInitial.includes('Make changes by voice'), 'Contains voice action button');
assert(reviewHtmlInitial.includes('edit_draft_title'), 'Contains Product Name input (edit_draft_title)');
assert(reviewHtmlInitial.includes('edit_draft_mat'), 'Contains Materials input (edit_draft_mat)');
assert(reviewHtmlInitial.includes('edit_draft_desc'), 'Contains Description input (edit_draft_desc)');

// TEST 1: Microphone opens & transcript area renders
window.openVoiceAssistantProduct();
const voiceProductModalHtml = renderVoiceModal();
assert(voiceProductModalHtml.includes('voice-transcript-display'), 'TEST 1: Voice modal contains transcript display area');
assert(voiceProductModalHtml.includes('Change the product name to bamboo basket'), 'TEST 1: Shows contextual product voice suggestions');
window.closeVoiceModal();

// TEST 2: Speak product-name change -> Product Name field actually updates
const testSpeechName = "Change the product name to bamboo basket";
const parsedName = parseProductEditSpeech(testSpeechName);
assert(parsedName.title === 'Bamboo Basket', `TEST 2: Parsed title is "Bamboo Basket" (got "${parsedName.title}")`);

// Test Hindi product-name change
const testSpeechNameHi = "नाम बदलकर बाँस की टोकरी कर दो";
const parsedNameHi = parseProductEditSpeech(testSpeechNameHi);
assert(parsedNameHi.title === 'बाँस की टोकरी', `TEST 2 (Hindi): Parsed title is "बाँस की टोकरी" (got "${parsedNameHi.title}")`);

// Apply name change to state
const productObj = appState.data.products.find(p => p.id === 'CRF-BAM-001284');
productObj.title = parsedName.title;
appState.data.productVoiceSuggestion = {
  transcript: testSpeechName,
  title: parsedName.title,
  updatedFields: ['Product Name']
};
const reviewHtmlAfterName = renderArtisanView('review_product');
assert(reviewHtmlAfterName.includes('value="Bamboo Basket"'), 'TEST 2: Product Name input value updated to "Bamboo Basket"');
assert(reviewHtmlAfterName.includes('Voice Suggestion'), 'TEST 2: Voice Suggestion indicator appears on screen');

// TEST 3: Speak material change -> Materials field actually updates
const testSpeechMat = "Material is natural bamboo";
const parsedMat = parseProductEditSpeech(testSpeechMat);
assert(parsedMat.materials === 'Natural Bamboo', `TEST 3: Parsed materials is "Natural Bamboo" (got "${parsedMat.materials}")`);

// Test Hindi material change
const testSpeechMatHi = "सामग्री प्राकृतिक बाँस है";
const parsedMatHi = parseProductEditSpeech(testSpeechMatHi);
assert(parsedMatHi.materials === 'प्राकृतिक बाँस', `TEST 3 (Hindi): Parsed materials is "प्राकृतिक बाँस" (got "${parsedMatHi.materials}")`);

// Apply material change to state
productObj.materials = [parsedMat.materials];
appState.data.productVoiceSuggestion = {
  transcript: testSpeechMat,
  materials: parsedMat.materials,
  updatedFields: ['Materials']
};
const reviewHtmlAfterMat = renderArtisanView('review_product');
assert(reviewHtmlAfterMat.includes('value="Natural Bamboo"'), 'TEST 3: Materials input value updated to "Natural Bamboo"');

// TEST 4: Speak description change -> Description field actually updates
const testSpeechDesc = "Change the description to handmade bamboo basket made in Assam";
const parsedDesc = parseProductEditSpeech(testSpeechDesc);
assert(parsedDesc.description === 'Handmade bamboo basket made in Assam', `TEST 4: Parsed description is "Handmade bamboo basket made in Assam"`);

// Test Hindi description change
const testSpeechDescHi = "विवरण बदलो असम में बनी हस्तनिर्मित बाँस की टोकरी";
const parsedDescHi = parseProductEditSpeech(testSpeechDescHi);
assert(parsedDescHi.description === 'असम में बनी हस्तनिर्मित बाँस की टोकरी', `TEST 4 (Hindi): Parsed description is "असम में बनी हस्तनिर्मित बाँस की टोकरी"`);

// Apply description change to state
productObj.description = parsedDesc.description;
appState.data.productVoiceSuggestion = {
  transcript: testSpeechDesc,
  description: parsedDesc.description,
  updatedFields: ['Description']
};
const reviewHtmlAfterDesc = renderArtisanView('review_product');
assert(reviewHtmlAfterDesc.includes('Handmade bamboo basket made in Assam'), 'TEST 4: Description textarea content updated');

// Compound command test (name + material in one voice input)
const compoundSpeech = "Change the product name to Assam Cane Planter. Material is treated natural cane.";
const parsedCompound = parseProductEditSpeech(compoundSpeech);
assert(parsedCompound.title === 'Assam Cane Planter', `Compound speech parses title: "${parsedCompound.title}"`);
assert(parsedCompound.materials === 'Treated Natural Cane', `Compound speech parses materials: "${parsedCompound.materials}"`);

// TEST 5: Manual editing still works after voice input
const manualEditedName = "Assam Artisan Bamboo Basket (Deluxe)";
window.syncProductDraftField('title', manualEditedName);
assert(productObj.title === manualEditedName, 'TEST 5: Manual editing immediately updates product state');
const reviewHtmlAfterManual = renderArtisanView('review_product');
assert(reviewHtmlAfterManual.includes(`value="${manualEditedName}"`), 'TEST 5: Manual edit reflected in Product Name input field');

// TEST 6: Language selector toggle works
appState.data.isVoiceModalOpen = true;
const voiceLangHtml = renderVoiceModal();
assert(voiceLangHtml.includes('English (en-IN)') && voiceLangHtml.includes('हिन्दी (hi-IN)'), 'TEST 6: English & Hindi voice selectors available in voice modal');
appState.data.isVoiceModalOpen = false;

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
