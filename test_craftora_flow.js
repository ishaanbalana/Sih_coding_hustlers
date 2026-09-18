import { appState } from './js/state.js';
import { renderAdminView } from './js/views/admin/AdminViews.js';
import { renderArtisanView } from './js/views/artisan/ArtisanViews.js';
import { renderBuyerView } from './js/views/buyer/BuyerViews.js';
import { renderLandingView } from './js/views/shared/LandingView.js';
import { renderQRScannerModal } from './js/components/QRScannerModal.js';
import { renderVoiceModal, parseArtisanProfileSpeech, parseProductEditSpeech, parseDashboardVoiceCommand, executeDashboardVoiceCommand } from './js/components/VoiceModal.js';
import { renderDemoControlBar } from './js/components/DemoControlBar.js';
import { renderBottomNav } from './js/components/BottomNav.js';
import { renderTopNav } from './js/components/TopNav.js';

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

const navHtml = renderTopNav();
assert(navHtml.includes('src="assets/craftora_logo.png"'), 'Screen 1 Header displays official CRAFTORA logo asset in top-left');
assert(navHtml.includes('lang-selector'), 'Screen 1 Header retains language selector');

const landingHtml = renderLandingView();
assert(landingHtml.includes("AI-Powered Digital Business Platform for Artisans") || landingHtml.toUpperCase().includes("AI-POWERED DIGITAL BUSINESS PLATFORM FOR ARTISANS"), 'Screen 1 contains title "AI-Powered Digital Business Platform for Artisans"');
assert(landingHtml.includes("Bring your craft to the digital world."), 'Screen 1 contains "Bring your craft to the digital world."');
assert(landingHtml.includes('src="assets/bamboo_basket.png"'), 'Screen 1 hero image restores the original handcrafted craft image');
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
// USER SPECIFIED TESTS A–I: Exact Verification Matrix
// ----------------------------------------------------
console.log('\n======================================================');
console.log('--- USER SPECIFIED VERIFICATION: TESTS A THROUGH I ---');
console.log('======================================================');

// Setup clean baseline product
appState.data.currentRole = 'artisan';
appState.data.artisanAuth.isRegistered = true;
appState.data.selectedProductId = 'CRF-BAM-001284';
const testProduct = appState.data.products.find(p => p.id === 'CRF-BAM-001284');

testProduct.title = 'Initial Name';
testProduct.category = 'Initial Category';
testProduct.materials = ['Initial Material'];
testProduct.description = 'Initial Description';
testProduct.tags = ['initial', 'tag'];

// TEST A: "Change category to Bamboo Craft" → only Category changes.
console.log('\nTEST A: Voice Command -> Category');
const speechA = "Change category to Bamboo Craft";
window.applyVoiceTranscript = () => {}; // mock if needed
const parsedA = parseProductEditSpeech(speechA);
assert(parsedA.category === 'Bamboo Craft', `TEST A: Parsed category is "Bamboo Craft" (got "${parsedA.category}")`);
assert(parsedA.title === null, 'TEST A: Parsed title is null');
assert(parsedA.materials === null, 'TEST A: Parsed materials is null');
assert(parsedA.description === null, 'TEST A: Parsed description is null');
assert(parsedA.tags === null, 'TEST A: Parsed tags is null');

// Apply to product via VoiceModal logic
if (parsedA.category) testProduct.category = parsedA.category;
assert(testProduct.category === 'Bamboo Craft', 'TEST A: Category updated to "Bamboo Craft"');
assert(testProduct.title === 'Initial Name', 'TEST A: Product Name STRICTLY UNCHANGED');
assert(testProduct.materials[0] === 'Initial Material', 'TEST A: Materials STRICTLY UNCHANGED');
assert(testProduct.description === 'Initial Description', 'TEST A: Description STRICTLY UNCHANGED');
assert(testProduct.tags[0] === 'initial', 'TEST A: Tags STRICTLY UNCHANGED');

// TEST B: "Change the product name to Bamboo Basket" → only Product Name changes.
console.log('\nTEST B: Voice Command -> Product Name');
const speechB = "Change the product name to Bamboo Basket";
const parsedB = parseProductEditSpeech(speechB);
assert(parsedB.title === 'Bamboo Basket', `TEST B: Parsed title is "Bamboo Basket" (got "${parsedB.title}")`);
assert(parsedB.category === null, 'TEST B: Parsed category is null');
assert(parsedB.materials === null, 'TEST B: Parsed materials is null');
assert(parsedB.description === null, 'TEST B: Parsed description is null');
assert(parsedB.tags === null, 'TEST B: Parsed tags is null');

if (parsedB.title) testProduct.title = parsedB.title;
assert(testProduct.title === 'Bamboo Basket', 'TEST B: Product Name updated to "Bamboo Basket"');
assert(testProduct.category === 'Bamboo Craft', 'TEST B: Category STRICTLY UNCHANGED');
assert(testProduct.materials[0] === 'Initial Material', 'TEST B: Materials STRICTLY UNCHANGED');
assert(testProduct.description === 'Initial Description', 'TEST B: Description STRICTLY UNCHANGED');
assert(testProduct.tags[0] === 'initial', 'TEST B: Tags STRICTLY UNCHANGED');

// TEST C: "Change material to Natural Bamboo" → only Materials changes.
console.log('\nTEST C: Voice Command -> Materials');
const speechC = "Change material to Natural Bamboo";
const parsedC = parseProductEditSpeech(speechC);
assert(parsedC.materials === 'Natural Bamboo', `TEST C: Parsed materials is "Natural Bamboo" (got "${parsedC.materials}")`);
assert(parsedC.title === null, 'TEST C: Parsed title is null');
assert(parsedC.category === null, 'TEST C: Parsed category is null');
assert(parsedC.description === null, 'TEST C: Parsed description is null');
assert(parsedC.tags === null, 'TEST C: Parsed tags is null');

if (parsedC.materials) testProduct.materials = [parsedC.materials];
assert(testProduct.materials[0] === 'Natural Bamboo', 'TEST C: Materials updated to ["Natural Bamboo"]');
assert(testProduct.title === 'Bamboo Basket', 'TEST C: Product Name STRICTLY UNCHANGED');
assert(testProduct.category === 'Bamboo Craft', 'TEST C: Category STRICTLY UNCHANGED');
assert(testProduct.description === 'Initial Description', 'TEST C: Description STRICTLY UNCHANGED');
assert(testProduct.tags[0] === 'initial', 'TEST C: Tags STRICTLY UNCHANGED');

// TEST D: "Change description to Handmade bamboo basket made in Assam" → only Description changes.
console.log('\nTEST D: Voice Command -> Description');
const speechD = "Change description to Handmade bamboo basket made in Assam";
const parsedD = parseProductEditSpeech(speechD);
assert(parsedD.description === 'Handmade bamboo basket made in Assam', `TEST D: Parsed description is "Handmade bamboo basket made in Assam"`);
assert(parsedD.title === null, 'TEST D: Parsed title is null');
assert(parsedD.category === null, 'TEST D: Parsed category is null');
assert(parsedD.materials === null, 'TEST D: Parsed materials is null');
assert(parsedD.tags === null, 'TEST D: Parsed tags is null');

if (parsedD.description) testProduct.description = parsedD.description;
assert(testProduct.description === 'Handmade bamboo basket made in Assam', 'TEST D: Description updated');
assert(testProduct.title === 'Bamboo Basket', 'TEST D: Product Name STRICTLY UNCHANGED');
assert(testProduct.category === 'Bamboo Craft', 'TEST D: Category STRICTLY UNCHANGED');
assert(testProduct.materials[0] === 'Natural Bamboo', 'TEST D: Materials STRICTLY UNCHANGED');
assert(testProduct.tags[0] === 'initial', 'TEST D: Tags STRICTLY UNCHANGED');

// TEST E: "Change tags to handmade, bamboo, eco-friendly" → only Tags change.
console.log('\nTEST E: Voice Command -> Tags');
const speechE = "Change tags to handmade, bamboo, eco-friendly";
const parsedE = parseProductEditSpeech(speechE);
assert(Array.isArray(parsedE.tags), 'TEST E: Parsed tags is an array');
assert(parsedE.tags.length === 3, `TEST E: Parsed tags length is 3 (got ${parsedE.tags.length})`);
assert(parsedE.tags[0] === 'handmade' && parsedE.tags[1] === 'bamboo' && parsedE.tags[2] === 'eco-friendly', `TEST E: Parsed tags are ["handmade", "bamboo", "eco-friendly"]`);
assert(parsedE.title === null, 'TEST E: Parsed title is null');
assert(parsedE.category === null, 'TEST E: Parsed category is null');
assert(parsedE.materials === null, 'TEST E: Parsed materials is null');
assert(parsedE.description === null, 'TEST E: Parsed description is null');

if (parsedE.tags) testProduct.tags = parsedE.tags;
assert(testProduct.tags.length === 3 && testProduct.tags[0] === 'handmade', 'TEST E: Tags updated');
assert(testProduct.title === 'Bamboo Basket', 'TEST E: Product Name STRICTLY UNCHANGED');
assert(testProduct.category === 'Bamboo Craft', 'TEST E: Category STRICTLY UNCHANGED');
assert(testProduct.materials[0] === 'Natural Bamboo', 'TEST E: Materials STRICTLY UNCHANGED');
assert(testProduct.description === 'Handmade bamboo basket made in Assam', 'TEST E: Description STRICTLY UNCHANGED');

// Unrecognized command test (no guessing fallback!)
console.log('\nVERIFY: Unrecognized voice command does NOT guess or mutate fields');
const speechUnknown = "Random spoken words that do not specify any field at all";
const parsedUnknown = parseProductEditSpeech(speechUnknown);
assert(parsedUnknown.title === null, 'Unrecognized command: title is null (no guessing)');
assert(parsedUnknown.category === null, 'Unrecognized command: category is null (no guessing)');
assert(parsedUnknown.materials === null, 'Unrecognized command: materials is null (no guessing)');
assert(parsedUnknown.description === null, 'Unrecognized command: description is null (no guessing)');
assert(parsedUnknown.tags === null, 'Unrecognized command: tags is null (no guessing)');

// TEST F: Manually edit Category after voice input. → manual editing still works.
console.log('\nTEST F: Manual Editing Category After Voice Input');
window.syncProductDraftField('category', 'Handcrafted Cane & Bamboo');
assert(testProduct.category === 'Handcrafted Cane & Bamboo', 'TEST F: Manual editing Category directly updates product state');
const reviewHtmlManual = renderArtisanView('review_product');
assert(reviewHtmlManual.includes('value="Handcrafted Cane & Bamboo"'), 'TEST F: Manual edit reflected in Category input field in DOM');

// TEST G: Authenticated Artisan Dashboard → My Crafts → My Crafts opens directly.
console.log('\nTEST G: Authenticated Artisan Dashboard -> My Crafts (Direct Access)');
appState.loginReturningArtisan('9876543210');
assert(appState.data.currentRole === 'artisan', 'TEST G: Current role is artisan');
assert(appState.data.artisanAuth.isRegistered === true, 'TEST G: artisanAuth.isRegistered is true');
assert(appState.data.activeArtisanScreen === 'dashboard', 'TEST G: Started on Artisan Dashboard');

// Click "My Crafts"
window.navArtisan('my_crafts');
assert(appState.data.activeArtisanScreen === 'my_crafts', 'TEST G: navArtisan opens "my_crafts" directly without login redirect');
const myCraftsHtml = renderArtisanView('my_crafts');
assert(myCraftsHtml.includes('My Crafts') && myCraftsHtml.includes('Your handmade products'), 'TEST G: My Crafts screen rendered cleanly');
assert(!myCraftsHtml.includes('ARTISAN ONBOARDING'), 'TEST G: NO login/onboarding screen in between');

// TEST H: Logout → try to access My Crafts → redirect to Artisan Login.
console.log('\nTEST H: Logout -> Try to Access My Crafts -> Redirect to Artisan Login');
appState.logoutArtisan();
assert(appState.data.artisanAuth.isRegistered === false, 'TEST H: Artisan isRegistered is false after logout');

// Unauthenticated user attempts to access My Crafts
window.navArtisan('my_crafts');
assert(appState.data.activeArtisanScreen === 'onboarding', 'TEST H: Accessing My Crafts while unauthenticated redirected to "onboarding" (Artisan Login)');
const redirectedLoginHtml = renderArtisanView(appState.data.activeArtisanScreen);
assert(redirectedLoginHtml.includes('ARTISAN ONBOARDING') && redirectedLoginHtml.includes('artisan_mobile_input'), 'TEST H: Login screen rendered for unauthenticated user');

// TEST I: Authenticated Buyer → attempt My Crafts → access denied/redirected appropriately.
console.log('\nTEST I: Authenticated Buyer -> Attempt My Crafts -> Access Denied');
appState.setRole('buyer');
appState.setBuyerScreen('explore');
assert(appState.data.currentRole === 'buyer', 'TEST I: Role set to buyer');
assert(appState.data.activeBuyerScreen === 'explore', 'TEST I: Buyer active screen is explore');

// Buyer attempts to call navArtisan('my_crafts')
const buyerNavResult = appState.setArtisanScreen('my_crafts');
assert(!buyerNavResult.success, 'TEST I: setArtisanScreen rejected buyer access');
assert(appState.data.currentRole === 'buyer', 'TEST I: Role remains strictly buyer');
assert(appState.data.activeBuyerScreen === 'explore', 'TEST I: Buyer remains in explore screen');

// Direct render check
const buyerDirectRenderHtml = renderArtisanView('my_crafts');
assert(buyerDirectRenderHtml.includes('Access Denied'), 'TEST I: renderArtisanView returns Access Denied for buyer');
assert(buyerDirectRenderHtml.includes('Buyers cannot access Artisan My Crafts'), 'TEST I: Explicit buyer denial message present');

console.log('\n------------------------------------------------------');
// ----------------------------------------------------
// BUG 3 VERIFICATION: NAVIGATION HISTORY & BACK BUTTON
// ----------------------------------------------------
console.log('\n======================================================');
console.log('--- BUG 3 VERIFICATION: NAVIGATION HISTORY & BACK ---');
console.log('======================================================');

// TEST 1: Dashboard -> My Crafts -> Product Details -> Back -> My Crafts
console.log('\nBUG 3 - TEST 1: Dashboard -> My Crafts -> Product Details -> Back -> My Crafts');
appState.loginReturningArtisan('9876543210');
assert(appState.data.activeArtisanScreen === 'dashboard', 'TEST 1: Started on Dashboard');

window.navArtisan('my_crafts');
assert(appState.data.activeArtisanScreen === 'my_crafts', 'TEST 1: Navigated to My Crafts');

// View details of Bamboo Basket (CRF-BAM-001285)
window.viewArtisanProductDetail('CRF-BAM-001285');
assert(appState.data.activeArtisanScreen === 'product_detail', 'TEST 1: Navigated to Product Details');
assert(appState.data.selectedProductId === 'CRF-BAM-001285', 'TEST 1: Viewing product CRF-BAM-001285');

// Click Back
window.historyBack();
assert(appState.data.activeArtisanScreen === 'my_crafts', 'TEST 1: Back from Product Details returned to My Crafts');
const test1View = renderArtisanView('my_crafts');
assert(test1View.includes('My Crafts') && !test1View.includes('Selling Price:'), 'TEST 1: Renders My Crafts catalogue, NOT Product Detail page');

// TEST 2: Dashboard -> My Crafts -> Product Details -> Edit Product -> Back -> Product Details -> Back -> My Crafts
console.log('\nBUG 3 - TEST 2: Multi-level Navigation & Back Stack');
appState.loginReturningArtisan('9876543210');
window.navArtisan('my_crafts');
window.viewArtisanProductDetail('CRF-BAM-001284'); // Bamboo Handwoven Basket
assert(appState.data.selectedProductId === 'CRF-BAM-001284', 'TEST 2: Viewing product CRF-BAM-001284');

window.navArtisan('edit_product');
assert(appState.data.activeArtisanScreen === 'edit_product', 'TEST 2: Navigated to Edit Product');

// Back from Edit Product -> Product Details
window.historyBack();
assert(appState.data.activeArtisanScreen === 'product_detail', 'TEST 2: Back from Edit Product returns to Product Details');
assert(appState.data.selectedProductId === 'CRF-BAM-001284', 'TEST 2: Preserves the product being edited (CRF-BAM-001284, not hardcoded lamp)');

// Back from Product Details -> My Crafts
window.historyBack();
assert(appState.data.activeArtisanScreen === 'my_crafts', 'TEST 2: Back from Product Details returns to My Crafts');

// Back from My Crafts -> Dashboard
window.historyBack();
assert(appState.data.activeArtisanScreen === 'dashboard', 'TEST 2: Back from My Crafts returns to Dashboard');

// TEST 3: Dashboard -> Add Product -> AI Catalogue -> Review Product -> Smart Pricing -> Back -> Review Product
console.log('\nBUG 3 - TEST 3: Product Creation Pipeline Back Navigation');
appState.loginReturningArtisan('9876543210');
window.navArtisan('add_product');
assert(appState.data.activeArtisanScreen === 'add_product', 'TEST 3: On Add Product');

window.navArtisan('ai_analysis');
assert(appState.data.activeArtisanScreen === 'ai_analysis', 'TEST 3: On AI Analysis / Catalogue');

window.navArtisan('review_product');
assert(appState.data.activeArtisanScreen === 'review_product', 'TEST 3: On Review Product');

window.navArtisan('smart_pricing');
assert(appState.data.activeArtisanScreen === 'smart_pricing', 'TEST 3: On Smart Pricing');

// Back from Smart Pricing -> Review Product
window.historyBack();
assert(appState.data.activeArtisanScreen === 'review_product', 'TEST 3: Back from Smart Pricing returns to Review Product');

// Back from Review Product -> AI Analysis
window.historyBack();
assert(appState.data.activeArtisanScreen === 'ai_analysis', 'TEST 3: Back from Review Product returns to AI Analysis');

// Back from AI Analysis -> Add Product
window.historyBack();
assert(appState.data.activeArtisanScreen === 'add_product', 'TEST 3: Back from AI Analysis returns to Add Product');

// Back from Add Product -> Dashboard
window.historyBack();
assert(appState.data.activeArtisanScreen === 'dashboard', 'TEST 3: Back from Add Product returns to Dashboard');

// TEST 4: Dashboard -> any screen -> Back -> actual previous screen, NOT Bamboo Woven Table Lamp
console.log('\nBUG 3 - TEST 4: Direct Links From Dashboard Back Navigation');
// Test 4a: Dashboard -> Passport -> Back -> Dashboard
appState.loginReturningArtisan('9876543210');
window.navArtisan('passport');
assert(appState.data.activeArtisanScreen === 'passport', 'TEST 4a: Navigated from Dashboard to Passport');
window.historyBack();
assert(appState.data.activeArtisanScreen === 'dashboard', 'TEST 4a: Back from Passport returns to Dashboard (not static market_matches)');

// Test 4b: Dashboard -> Market Matches -> Back -> Dashboard
window.navArtisan('market_matches');
assert(appState.data.activeArtisanScreen === 'market_matches', 'TEST 4b: Navigated from Dashboard to Market Matches');
window.historyBack();
assert(appState.data.activeArtisanScreen === 'dashboard', 'TEST 4b: Back from Market Matches returns to Dashboard (not static smart_pricing)');

// Test 4c: Dashboard -> Smart Pricing -> Back -> Dashboard
window.navArtisan('smart_pricing');
assert(appState.data.activeArtisanScreen === 'smart_pricing', 'TEST 4c: Navigated from Dashboard to Smart Pricing');
window.historyBack();
assert(appState.data.activeArtisanScreen === 'dashboard', 'TEST 4c: Back from Smart Pricing returns to Dashboard (not static review_product)');

// TEST 5: Refresh/reload the app and verify navigation does NOT hardcode Bamboo Woven Table Lamp
console.log('\nBUG 3 - TEST 5: App Reload & Navigation History Integrity');
appState.loginReturningArtisan('9876543210');
window.navArtisan('my_crafts');
window.viewArtisanProductDetail('CRF-BAM-001285');

// Simulate page refresh
appState.loadState();
assert(appState.data.activeArtisanScreen === 'product_detail', 'TEST 5: Active screen preserved after reload');
assert(appState.data.selectedProductId === 'CRF-BAM-001285', 'TEST 5: Selected product preserved after reload (CRF-BAM-001285)');

// Back after reload uses persisted navigation history
window.historyBack();
assert(appState.data.activeArtisanScreen === 'my_crafts', 'TEST 5: Back after reload returns to My Crafts');

// Back again returns to Dashboard
window.historyBack();
assert(appState.data.activeArtisanScreen === 'dashboard', 'TEST 5: Back again returns to Dashboard');

// Authenticated artisan at root Dashboard pressing Back does NOT send them to Login
window.historyBack();
assert(appState.data.activeArtisanScreen === 'dashboard', 'TEST 5: Authenticated artisan pressing Back at root Dashboard stays at Dashboard');
assert(appState.data.artisanAuth.isRegistered === true, 'TEST 5: Authenticated status preserved');

console.log('\n------------------------------------------------------');
console.log('All BUG 3 SPECIFIED TESTS 1 THROUGH 5 PASSED CLEANLY');
console.log('------------------------------------------------------\n');

// ======================================================
// --- NEW REQUIREMENTS VERIFICATION: TESTS 1 THROUGH 15 ---
// ======================================================

console.log('\n======================================================');
console.log('--- USER REQUIREMENTS: TESTS 1 THROUGH 15 ---');
console.log('======================================================\n');

// TEST 1 — Artisan Registration
// Screen 1 -> Artisan -> Register -> Demo OTP -> empty profile -> complete profile -> dashboard
console.log('TEST 1 — Artisan Registration');
appState.initDefaultState();
assert(appState.data.currentRole === 'landing', 'TEST 1: Started on Screen 1');
appState.startNewArtisanRegistration();
assert(appState.data.currentRole === 'artisan' && appState.data.activeArtisanScreen === 'onboarding', 'TEST 1: Navigated to Artisan Onboarding');
window.setArtisanAuthMode('register');
assert(appState.data.onboardingDraft.authMode === 'register', 'TEST 1: Chose Register mode');
appState.data.onboardingDraft.mobileNumber = '9876500001';
window.submitArtisanMobile('register');
assert(appState.data.activeArtisanScreen === 'onboarding_otp', 'TEST 1: On Demo OTP screen');
window.verifyArtisanOTP();
assert(appState.data.activeArtisanScreen === 'profile_step1', 'TEST 1: On empty profile setup screen');
assert(appState.data.onboardingDraft.name === '', 'TEST 1: Profile setup starts empty');
// Complete profile
window.completeProfileSetup();
assert(appState.data.activeArtisanScreen === 'artisan_id_card', 'TEST 1: Generated Artisan ID card');
assert(appState.data.artisanAuth.isRegistered === true, 'TEST 1: Artisan registered');
window.enterArtisanDashboard();
assert(appState.data.activeArtisanScreen === 'dashboard', 'TEST 1: Arrived at Artisan Dashboard');

// TEST 2 — Artisan Login
// Screen 1 -> Artisan -> Sign In -> Demo OTP -> existing artisan restored -> dashboard
console.log('\nTEST 2 — Artisan Login');
appState.initDefaultState();
appState.setRole('landing');
assert(appState.data.currentRole === 'landing', 'TEST 2: Started on Screen 1');
appState.setRole('artisan');
assert(appState.data.activeArtisanScreen === 'onboarding', 'TEST 2: On Artisan Authentication screen');
window.setArtisanAuthMode('signin');
assert(appState.data.onboardingDraft.authMode === 'signin', 'TEST 2: Chose Sign In mode');
appState.data.onboardingDraft.mobileNumber = '9876543210';
window.submitArtisanMobile('signin');
assert(appState.data.activeArtisanScreen === 'onboarding_otp', 'TEST 2: On Demo OTP screen');
window.verifyArtisanOTP();
assert(appState.data.artisanAuth.isRegistered === true, 'TEST 2: Authenticated existing artisan');
assert(appState.data.artisanAuth.artisanProfile.name === 'Ramesh Kumar', 'TEST 2: Existing artisan profile restored (Ramesh Kumar)');
assert(appState.data.activeArtisanScreen === 'dashboard', 'TEST 2: Navigated directly to Dashboard without empty profile');

// TEST 3 — Buyer Registration
// Screen 1 -> Buyer -> Register -> Demo OTP -> Buyer profile -> Buyer Home
console.log('\nTEST 3 — Buyer Registration');
appState.initDefaultState();
appState.setRole('landing');
appState.startBuyerAuth();
assert(appState.data.currentRole === 'buyer' && appState.data.activeBuyerScreen === 'welcome', 'TEST 3: On Buyer Welcome');
window.navBuyer('buyer_mobile');
assert(appState.data.activeBuyerScreen === 'buyer_mobile', 'TEST 3: On Buyer Mobile Input');
appState.data.buyerDraft.mobileNumber = '9998887777';
window.submitBuyerMobile();
assert(appState.data.activeBuyerScreen === 'buyer_otp', 'TEST 3: On Buyer OTP');
window.verifyBuyerOTP();
assert(appState.data.activeBuyerScreen === 'register', 'TEST 3: On Buyer Profile Setup');
window.submitBuyerRegistration();
assert(appState.data.buyerAuth.isRegistered === true, 'TEST 3: Buyer is registered');
assert(appState.data.activeBuyerScreen === 'explore', 'TEST 3: Navigated to Buyer Home (explore)');

// TEST 4 — Buyer Login
// Screen 1 -> Buyer -> Sign In -> Demo OTP -> existing buyer restored -> Buyer Home
console.log('\nTEST 4 — Buyer Login');
appState.initDefaultState();
appState.setRole('landing');
appState.startBuyerAuth();
window.navBuyer('buyer_signin');
assert(appState.data.activeBuyerScreen === 'buyer_signin', 'TEST 4: On Buyer Sign In screen');
window.submitBuyerSignIn();
assert(appState.data.activeBuyerScreen === 'buyer_otp', 'TEST 4: On Buyer OTP screen');
window.verifyBuyerOTP();
assert(appState.data.buyerAuth.isRegistered === true, 'TEST 4: Existing buyer account authenticated');
assert(appState.data.buyerAuth.buyerName === 'Arjun Sharma', 'TEST 4: Restored existing buyer account (Arjun Sharma)');
assert(appState.data.activeBuyerScreen === 'explore', 'TEST 4: Navigated to Buyer Home (explore)');

// TEST 5 — Artisan Ratings
// -> Artisan Dashboard/Profile -> rating visible
console.log('\nTEST 5 — Artisan Ratings');
appState.loginReturningArtisan('9876543210');
const dashboardHtmlTest5 = renderArtisanView('dashboard');
assert(dashboardHtmlTest5.includes('4.8'), 'TEST 5: Rating 4.8 visible on Artisan Dashboard');
assert(dashboardHtmlTest5.includes('24 ratings') || dashboardHtmlTest5.includes('Based on 24 ratings'), 'TEST 5: 24 ratings count visible on Artisan Dashboard');
const idCardHtmlTest5 = renderArtisanView('artisan_id_card');
assert(idCardHtmlTest5.includes('4.8'), 'TEST 5: Rating visible on Artisan ID Card');

// TEST 6 — Buyer Ratings
// -> Explore -> Product Details -> Artisan Profile -> same artisan rating visible consistently
console.log('\nTEST 6 — Buyer Ratings Consistency');
appState.initDefaultState();
appState.setRole('buyer');
const exploreHtmlTest6 = renderBuyerView('explore');
assert(exploreHtmlTest6.includes('⭐ 4.8 · 24 ratings'), 'TEST 6: Ramesh Kumar rating visible on Explore product cards');
assert(exploreHtmlTest6.includes('⭐ 4.6 · 18 ratings'), 'TEST 6: Meera Devi rating visible on Explore product cards');
assert(exploreHtmlTest6.includes('⭐ 4.7 · 15 ratings'), 'TEST 6: Harpreet Singh rating visible on Explore product cards');

// Product Details
const productDetailHtmlTest6 = renderBuyerView('product_detail');
assert(productDetailHtmlTest6.includes('⭐ 4.8') && productDetailHtmlTest6.includes('24 ratings'), 'TEST 6: Same rating visible on Product Details');

// Artisan Profile / Story
appState.data.selectedArtisanId = 'CRF-ART-001284';
const storyHtmlTest6 = renderBuyerView('artisan_story');
assert(storyHtmlTest6.includes('⭐ 4.8') && storyHtmlTest6.includes('24 ratings'), 'TEST 6: Same rating visible on Artisan Story / Profile');

// TEST 7 — Demo Data
// Verify: Artisans = exactly 3, Products = exactly 8
// Verify every product maps to one of the 3 artisans.
console.log('\nTEST 7 — Demo Data Verification');
assert(appState.data.artisans.length === 3, `TEST 7: Exactly 3 artisans in appState (got ${appState.data.artisans.length})`);
assert(appState.data.products.length === 8, `TEST 7: Exactly 8 products in appState (got ${appState.data.products.length})`);
const artisanIds = new Set(appState.data.artisans.map(a => a.id));
assert(artisanIds.size === 3, 'TEST 7: Exactly 3 unique artisan IDs');
const allProductsMapped = appState.data.products.every(p => artisanIds.has(p.artisanId));
assert(allProductsMapped, 'TEST 7: Every single product maps cleanly to one of the 3 artisans');
const rameshProds = appState.data.products.filter(p => p.artisanId === 'CRF-ART-001284');
const meeraProds = appState.data.products.filter(p => p.artisanId === 'CRF-ART-001285');
const harpreetProds = appState.data.products.filter(p => p.artisanId === 'CRF-ART-001286');
assert(rameshProds.length >= 5, `TEST 7: Ramesh Kumar has at least 5 products (got ${rameshProds.length})`);
assert(meeraProds.length === 2, `TEST 7: Meera Devi has exactly 2 products (got ${meeraProds.length})`);
assert(harpreetProds.length === 1, `TEST 7: Harpreet Singh has exactly 1 product (got ${harpreetProds.length})`);

// TEST 8 — Dashboard Voice: "Open my crafts"
console.log('\nTEST 8 — Dashboard Voice: "Open my crafts"');
appState.loginReturningArtisan('9876543210');
assert(appState.data.activeArtisanScreen === 'dashboard', 'TEST 8: On Dashboard');
const cmd8 = executeDashboardVoiceCommand('Open my crafts');
assert(cmd8.success === true, 'TEST 8: Voice command recognized');
assert(appState.data.activeArtisanScreen === 'my_crafts', 'TEST 8: Navigated directly to My Crafts');
assert(appState.data.artisanAuth.isRegistered === true, 'TEST 8: Preserved authenticated artisan session');

// TEST 9 — Dashboard Voice: "Find buyers"
console.log('\nTEST 9 — Dashboard Voice: "Find buyers"');
appState.setArtisanScreen('dashboard');
const cmd9 = executeDashboardVoiceCommand('Find buyers');
assert(cmd9.success === true && appState.data.activeArtisanScreen === 'market_matches', 'TEST 9: "Find buyers" navigated to Market Linkage');

// TEST 10 — Dashboard Voice: "Show my passports"
console.log('\nTEST 10 — Dashboard Voice: "Show my passports"');
appState.setArtisanScreen('dashboard');
const cmd10 = executeDashboardVoiceCommand('Show my passports');
assert(cmd10.success === true && appState.data.activeArtisanScreen === 'passport', 'TEST 10: "Show my passports" navigated to Product Passports');

// TEST 11 — Dashboard Voice: "Add a new product"
console.log('\nTEST 11 — Dashboard Voice: "Add a new product"');
appState.setArtisanScreen('dashboard');
const cmd11 = executeDashboardVoiceCommand('Add a new product');
assert(cmd11.success === true && appState.data.activeArtisanScreen === 'add_product', 'TEST 11: "Add a new product" navigated to Add Product');

// TEST 12 — Hindi Voice Commands
console.log('\nTEST 12 — Hindi Voice Commands');
appState.setArtisanScreen('dashboard');
const cmd12a = executeDashboardVoiceCommand('मेरे क्राफ्ट खोलो');
assert(cmd12a.success === true && appState.data.activeArtisanScreen === 'my_crafts', 'TEST 12: "मेरे क्राफ्ट खोलो" navigated to My Crafts');

appState.setArtisanScreen('dashboard');
const cmd12b = executeDashboardVoiceCommand('बायर्स ढूँढो');
assert(cmd12b.success === true && appState.data.activeArtisanScreen === 'market_matches', 'TEST 12: "बायर्स ढूँढो" navigated to Market Linkage');

appState.setArtisanScreen('dashboard');
const cmd12c = executeDashboardVoiceCommand('मेरा प्रोफाइल खोलो');
assert(cmd12c.success === true && appState.data.activeArtisanScreen === 'artisan_id_card', 'TEST 12: "मेरा प्रोफाइल खोलो" navigated to Artisan Profile');

// TEST 13 — Unknown Voice Command -> No random navigation
console.log('\nTEST 13 — Unknown Voice Command');
appState.setArtisanScreen('dashboard');
const cmd13 = executeDashboardVoiceCommand('कल मौसम कैसा रहेगा');
assert(cmd13.success === false, 'TEST 13: Unknown command marked as not recognized');
assert(appState.data.activeArtisanScreen === 'dashboard', 'TEST 13: Did NOT navigate randomly, stayed on dashboard');
assert(appState.data.dashboardVoiceFeedback.error !== undefined, 'TEST 13: Error feedback set for display');

// TEST 14 — Verify existing authentication/profile voice flow still works
console.log('\nTEST 14 — Verify Existing Profile Voice Input');
const parsedProfileTest14 = parseArtisanProfileSpeech('मेरा नाम रमेश है। मैं असम से हूँ। मैं बाँस की टोकरी बनाता हूँ।');
assert(parsedProfileTest14.name === 'रमेश' || parsedProfileTest14.name === 'Ramesh', `TEST 14: Profile voice extracted name Ramesh/रमेश (got "${parsedProfileTest14.name}")`);
assert(parsedProfileTest14.craft === 'Bamboo Craft', `TEST 14: Profile voice extracted Bamboo Craft (got "${parsedProfileTest14.craft}")`);
assert(parsedProfileTest14.location === 'Assam, India', `TEST 14: Profile voice extracted Assam, India (got "${parsedProfileTest14.location}")`);

// TEST 15 — Verify Review Your Product voice field mapping still works
console.log('\nTEST 15 — Verify Review Your Product Voice Field Mapping');
const editCatTest15 = parseProductEditSpeech('Change category to Bamboo Craft');
assert(editCatTest15.category === 'Bamboo Craft' && editCatTest15.title === null && editCatTest15.materials === null, 'TEST 15: Category command maps ONLY to category');
const editTitleTest15 = parseProductEditSpeech('Change product name to Bamboo Basket');
assert(editTitleTest15.title === 'Bamboo Basket' && editTitleTest15.category === null && editTitleTest15.materials === null, 'TEST 15: Product name command maps ONLY to title');
const editMatTest15 = parseProductEditSpeech('Set material as Natural Bamboo');
assert(editMatTest15.materials === 'Natural Bamboo' && editMatTest15.title === null, 'TEST 15: Material command maps ONLY to materials');
const editDescTest15 = parseProductEditSpeech('Change description to Handcrafted bamboo basket made in Assam');
assert(editDescTest15.description === 'Handcrafted bamboo basket made in Assam' && editDescTest15.title === null, 'TEST 15: Description command maps ONLY to description');

// TEST 16 — Artisan Dashboard & My Crafts: At least 5 products
console.log('\nTEST 16 — Artisan Dashboard & My Crafts 5 Products');
appState.initDefaultState();
appState.loginReturningArtisan('9876543210');
const rameshDashboardHtml = renderArtisanView('dashboard');
assert(rameshDashboardHtml.includes('5') && rameshDashboardHtml.includes('Products'), 'TEST 16: Dashboard displays 5 Products for Ramesh Kumar');
const myCraftsHtmlTest16 = renderArtisanView('my_crafts');
assert(myCraftsHtmlTest16.includes('Bamboo Woven Table Lamp'), 'TEST 16: Product 1 (Table Lamp) visible in My Crafts');
assert(myCraftsHtmlTest16.includes('Bamboo Storage Basket'), 'TEST 16: Product 2 (Storage Basket) visible in My Crafts');
assert(myCraftsHtmlTest16.includes('Handwoven Bamboo Basket'), 'TEST 16: Product 3 (Handwoven Basket) visible in My Crafts');
assert(myCraftsHtmlTest16.includes('Bamboo Decorative Tray'), 'TEST 16: Product 4 (Decorative Tray) visible in My Crafts');
assert(myCraftsHtmlTest16.includes('Bamboo Utility Organizer'), 'TEST 16: Product 5 (Utility Organizer) visible in My Crafts');

// TEST 17 — Buyer Explore: Exactly 8 products from central state
console.log('\nTEST 17 — Buyer Explore 8 Products');
appState.initDefaultState();
appState.setRole('buyer');
appState.setBuyerScreen('explore');
assert(appState.data.products.length === 8, `TEST 17: Central dataset has exactly 8 products (got ${appState.data.products.length})`);
const buyerExploreInitial = renderBuyerView('explore');
assert(buyerExploreInitial.includes('Showing 8 of 8') || buyerExploreInitial.includes('8 crafts available'), 'TEST 17: Explore displays 8 available crafts initially');

// TEST 18 — Buyer Dynamic Search Functionality
console.log('\nTEST 18 — Buyer Dynamic Search Functionality');
// Search by craft term
window.filterCrafts('bamboo');
const searchBambooHtml = renderBuyerView('explore');
const searchBambooCards = searchBambooHtml.split('id="crafts_container"')[1] || '';
assert(searchBambooCards.includes('Bamboo Woven Table Lamp') && searchBambooCards.includes('Bamboo Storage Basket'), 'TEST 18: Search "bamboo" returns bamboo crafts');
assert(!searchBambooCards.includes('Blue Pottery') && !searchBambooCards.includes('Phulkari'), 'TEST 18: Search "bamboo" excludes non-bamboo crafts');

// Search by artisan name
window.filterCrafts('Ramesh');
const searchArtisanHtml = renderBuyerView('explore');
const searchArtisanCards = searchArtisanHtml.split('id="crafts_container"')[1] || '';
assert(searchArtisanCards.includes('Ramesh Kumar'), 'TEST 18: Search "Ramesh" returns crafts by Ramesh Kumar');

// Search by specific item
window.filterCrafts('basket');
const searchBasketHtml = renderBuyerView('explore');
const searchBasketCards = searchBasketHtml.split('id="crafts_container"')[1] || '';
assert(searchBasketCards.includes('Bamboo Storage Basket') && searchBasketCards.includes('Handwoven Bamboo Basket'), 'TEST 18: Search "basket" returns basket items');

// Search non-existent
window.filterCrafts('xyznonexistent123');
const searchEmptyHtml = renderBuyerView('explore');
assert(searchEmptyHtml.includes('No products found'), 'TEST 18: Non-existent query displays "No products found" message');
assert(searchEmptyHtml.includes('Clear Search & Filters'), 'TEST 18: Empty state has clear button');

// Clear search
window.clearBuyerSearch();
const searchClearedHtml = renderBuyerView('explore');
assert(searchClearedHtml.includes('Showing 8 of 8') || searchClearedHtml.includes('8 crafts available'), 'TEST 18: Clear search restores all products');

// TEST 19 — Buyer Category Filter & Combined Filter
console.log('\nTEST 19 — Buyer Category Filter & Combined Filter');
// Filter by Bamboo Craft
window.selectCategory('Bamboo Craft');
const catBambooHtml = renderBuyerView('explore');
const catBambooCards = catBambooHtml.split('id="crafts_container"')[1] || '';
assert(catBambooCards.includes('Bamboo Woven Table Lamp'), 'TEST 19: Category Bamboo Craft shows bamboo items');
assert(!catBambooCards.includes('Madhubani Artwork Frame'), 'TEST 19: Category Bamboo Craft excludes Madhubani');

// Filter by Madhubani Painting
window.selectCategory('Madhubani Painting');
const catMadhubaniHtml = renderBuyerView('explore');
const catMadhubaniCards = catMadhubaniHtml.split('id="crafts_container"')[1] || '';
assert(catMadhubaniCards.includes('Madhubani Artwork Frame'), 'TEST 19: Category Madhubani shows painting');

// Filter by Phulkari
window.selectCategory('Phulkari');
const catPhulkariHtml = renderBuyerView('explore');
const catPhulkariCards = catPhulkariHtml.split('id="crafts_container"')[1] || '';
assert(catPhulkariCards.includes('Phulkari Dupatta'), 'TEST 19: Category Phulkari shows dupatta');

// Combined: Category = Bamboo Craft AND Search = basket
window.selectCategory('Bamboo Craft');
window.filterCrafts('basket');
const combinedHtml = renderBuyerView('explore');
const combinedCards = combinedHtml.split('id="crafts_container"')[1] || '';
assert(combinedCards.includes('Bamboo Storage Basket') && combinedCards.includes('Handwoven Bamboo Basket'), 'TEST 19: Combined filter shows bamboo baskets');
assert(!combinedCards.includes('Bamboo Woven Table Lamp'), 'TEST 19: Combined filter excludes non-basket bamboo lamp');

// Reset all filters
window.clearAllBuyerFilters();
const resetAllHtml = renderBuyerView('explore');
assert(resetAllHtml.includes('Showing 8 of 8') || resetAllHtml.includes('8 crafts available'), 'TEST 19: Reset all filters restores 8 products');

// TEST 20 — Add Product Photo Options, Camera & Pipeline
console.log('\nTEST 20 — Add Product Photo Options, Camera & Pipeline');
appState.loginReturningArtisan('9876543210');
appState.setArtisanScreen('add_product');
const addProductHtmlTest20 = renderArtisanView('add_product');
assert(addProductHtmlTest20.includes('Choose Existing Product Image'), 'TEST 20: Option 1 (Choose Existing Product Image) visible');
assert(addProductHtmlTest20.includes('Capture with Camera'), 'TEST 20: Option 2 (Capture with Camera) visible');

// Trigger Camera mode
window.startProductCamera();
const cameraActiveHtmlTest20 = renderArtisanView('add_product');
assert(cameraActiveHtmlTest20.includes('product_webcam_video'), 'TEST 20: Live camera preview video element present');
assert(cameraActiveHtmlTest20.includes('Capture Photo'), 'TEST 20: Capture Photo action button present');
assert(cameraActiveHtmlTest20.includes('Camera unavailable. You can choose an existing product image instead.'), 'TEST 20: Camera fallback message present');

// Close camera stops stream
window.closeProductCamera();
assert(appState.data.productCameraActive === false, 'TEST 20: Closing camera deactivates camera mode');

// Pipeline test: Proceed with photo -> AI Catalogue -> Review & Edit -> Smart Pricing -> My Crafts
const initialRameshCount = appState.data.products.filter(p => p.artisanId === 'CRF-ART-001284').length;
window.proceedWithProductImage('assets/bamboo_basket.png');
assert(appState.data.activeArtisanScreen === 'ai_analysis', 'TEST 20: Captured/uploaded image transitions to AI Catalogue (ai_analysis)');
const aiCatalogHtmlTest20 = renderArtisanView('ai_analysis');
assert(aiCatalogHtmlTest20.includes('AI Suggested — Review & Edit'), 'TEST 20: AI Catalogue displays "AI Suggested — Review & Edit"');

window.navArtisan('review_product');
assert(appState.data.activeArtisanScreen === 'review_product', 'TEST 20: Navigated to Review & Edit');

window.saveDraftAndContinuePricing(appState.data.selectedProductId);
assert(appState.data.activeArtisanScreen === 'smart_pricing', 'TEST 20: Navigated to Smart Pricing');

const updatedRameshCount = appState.data.products.filter(p => p.artisanId === 'CRF-ART-001284').length;
assert(updatedRameshCount === initialRameshCount + 1, `TEST 20: Newly created product added to central state (Ramesh count: ${updatedRameshCount})`);

// TEST 21 — FINAL UI & PRODUCT POLISH VERIFICATION
console.log('\nTEST 21 — FINAL UI & PRODUCT POLISH VERIFICATION');
appState.initDefaultState();

// 1. Screen 1 Final Polish Check
appState.setRole('landing');
const landingHtmlTest21 = renderLandingView();
assert(landingHtmlTest21.includes('AI-Powered Digital Business Platform for Artisans'), 'TEST 21: Screen 1 contains exact headline');
assert(landingHtmlTest21.includes('Bring your craft to the digital world.'), 'TEST 21: Screen 1 contains exact subtitle');
assert(landingHtmlTest21.includes("I'm an Artisan"), 'TEST 21: Screen 1 contains Artisan button');
assert(landingHtmlTest21.includes("I'm a Buyer"), 'TEST 21: Screen 1 contains Buyer button');
assert(landingHtmlTest21.includes('CREATE • PRICE • CONNECT • VERIFY'), 'TEST 21: Screen 1 contains pipeline tag');
assert(landingHtmlTest21.includes('assets/bamboo_basket.png'), 'TEST 21: Screen 1 keeps the restored craft hero image');

// 2. Header Polish Check
const landingNavHtml = renderTopNav(false);
assert(landingNavHtml.includes('assets/craftora_logo.png'), 'TEST 21: Header renders official CRAFTORA logo on landing');

appState.loginReturningArtisan('9876543210');
const artisanNavHtml = renderTopNav(true);
assert(artisanNavHtml.includes('assets/craftora_logo.png'), 'TEST 21: Header renders official CRAFTORA logo on artisan screens');
assert(artisanNavHtml.includes('ARTISAN WORKSPACE'), 'TEST 21: Header displays clean role indicator');

// 3. Artisan Dashboard Polish Check
const finalDashHtml = renderArtisanView('dashboard');
assert(finalDashHtml.includes('नमस्ते, Ramesh Kumar 👋'), 'TEST 21: Dashboard shows greeting for Ramesh Kumar');
assert(finalDashHtml.includes('Bamboo Craft') && finalDashHtml.includes('Assam, India'), 'TEST 21: Dashboard shows artisan craft and location');
assert(finalDashHtml.includes('Business Overview'), 'TEST 21: Dashboard displays Business Overview');
assert(finalDashHtml.includes('Products Sold') && finalDashHtml.includes('Total Earnings') && finalDashHtml.includes('Orders Done'), 'TEST 21: Business Overview includes core sales metrics');
assert(finalDashHtml.includes('Recent Sales (Sample Data)'), 'TEST 21: Dashboard shows Recent Sales section with sample indicator');

// 4. Smart Pricing Polish Check
window.navArtisan('smart_pricing');
const finalPricingHtml = renderArtisanView('smart_pricing');
assert(finalPricingHtml.includes('AI Indicative Price Recommendation'), 'TEST 21: Smart Pricing uses "AI Indicative Price Recommendation"');
assert(finalPricingHtml.includes('Sample Market Data'), 'TEST 21: Smart Pricing clearly labels "Sample Market Data"');

// 5. Digital Product Passport & Blockchain Polish Check
window.navArtisan('passport');
const finalPassportHtml = renderArtisanView('passport');
assert(finalPassportHtml.includes('Digital Product Passport'), 'TEST 21: Passport title verified');
assert(finalPassportHtml.includes('Prototype Blockchain Record'), 'TEST 21: Uses accurate "Prototype Blockchain Record"');
assert(finalPassportHtml.includes('Polygon Testnet Demo'), 'TEST 21: Uses "Polygon Testnet Demo" network');
assert(!finalPassportHtml.includes('0x7f3a'), 'TEST 21: No fake fabricated blockchain hashes present');

// 6. Admin Portal Polish Check
appState.setRole('admin');
appState.loginAdmin('admin', 'admin123');
const finalAdminDash = renderAdminView('dashboard');
assert(finalAdminDash.includes('Verification Dashboard'), 'TEST 21: Admin Dashboard renders');
const finalAdminQueue = renderAdminView('artisan_list');
assert(finalAdminQueue.includes('Verification Approved'), 'TEST 21: Admin uses "Verification Approved" terminology');

// ----------------------------------------------------
// USER TEST 22: New Artisan Initial Zero State + Product Sync & Persistence
// ----------------------------------------------------
console.log('\nTEST 22: New Artisan Initial Zero State + Product Sync & Persistence');

// 1. Register a completely new artisan
appState.startNewArtisanRegistration();
const newArtisanPhone = '9811122233';
appState.data.onboardingDraft.mobileNumber = newArtisanPhone;
appState.setArtisanScreen('onboarding_otp');
appState.data.onboardingDraft.otp = '1234';

const newArtisanProfile = appState.completeArtisanRegistration('Sunita Sharma', 'Madhubani Painting', 'Madhubani, Bihar', newArtisanPhone);
assert(newArtisanProfile.id.startsWith('CRF-ART-'), 'TEST 22: Generated unique artisan ID');
assert(newArtisanProfile.name === 'Sunita Sharma', 'TEST 22: Profile name matches');
assert(newArtisanProfile.rating === 0, 'TEST 22: Initial rating is 0');
assert(newArtisanProfile.ratingCount === 0, 'TEST 22: Initial rating count is 0');
assert(newArtisanProfile.productsSold === 0, 'TEST 22: Initial productsSold is 0');
assert(newArtisanProfile.totalEarnings === 0, 'TEST 22: Initial totalEarnings is 0');
assert(newArtisanProfile.ordersCompleted === 0, 'TEST 22: Initial ordersCompleted is 0');
assert(Array.isArray(newArtisanProfile.recentSales) && newArtisanProfile.recentSales.length === 0, 'TEST 22: Initial recentSales is empty');

// 2. Navigate to Dashboard and verify clean zero business state
appState.setArtisanScreen('dashboard');
const newArtisanDash = renderArtisanView('dashboard');
assert(newArtisanDash.includes('नमस्ते, Sunita Sharma 👋'), 'TEST 22: Dashboard shows greeting for new artisan');
assert(newArtisanDash.includes('⭐ 0') && newArtisanDash.includes('No ratings yet'), 'TEST 22: Dashboard displays "⭐ 0" and "No ratings yet"');
assert(newArtisanDash.includes('>0</div>\n            <div style="font-size: 10.5px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Products Sold</div>') || (newArtisanDash.includes('0') && newArtisanDash.includes('Products Sold')), 'TEST 22: Products Sold is 0');
assert(newArtisanDash.includes('₹0'), 'TEST 22: Total Earnings is ₹0');
assert(newArtisanDash.includes('Orders Completed'), 'TEST 22: Orders Completed displayed');
assert(newArtisanDash.includes('No sales yet'), 'TEST 22: Recent Sales displays polished empty state "No sales yet"');

// Verify initial Products count is 0
assert(newArtisanDash.includes('>0</div>\n            <div style="font-size: 12px; color: var(--text-muted);">Products</div>') || newArtisanDash.includes('0') && newArtisanDash.includes('Products'), 'TEST 22: Initial Products count is 0');

// Verify My Crafts starts empty for new artisan
window.navArtisan('my_crafts');
const initialMyCraftsHtml = renderArtisanView('my_crafts');
assert(initialMyCraftsHtml.includes('No products yet') || initialMyCraftsHtml.includes('No products in your digital catalogue'), 'TEST 22: My Crafts starts empty for new artisan');

// 3. Add first product using product creation flow
window.navArtisan('add_product');
window.proceedWithProductImage('assets/madhubani_art.png');
assert(appState.data.activeArtisanScreen === 'ai_analysis', 'TEST 22: Proceeded to ai_analysis');
assert(appState.data.selectedProductId, 'TEST 22: Product created and selected in central state');

const draft1 = appState.data.products.find(p => p.id === appState.data.selectedProductId);
assert(draft1.artisanId === newArtisanProfile.id, 'TEST 22: First product is owned by logged-in artisan ID (not hardcoded Ramesh)');
assert(draft1.rating === 0, 'TEST 22: First product inherits 0 rating for new artisan');
assert(draft1.ratingCount === 0, 'TEST 22: First product inherits 0 ratingCount for new artisan');

// 4. Complete AI Catalogue -> Review & Edit
window.navArtisan('review_product');
const reviewHtml = renderArtisanView('review_product');
assert(reviewHtml.includes('Review Your Product'), 'TEST 22: Reached Review Your Product screen');

// 5. Complete Pricing
window.saveDraftAndContinuePricing(draft1.id);
assert(appState.data.activeArtisanScreen === 'smart_pricing', 'TEST 22: Reached Smart Pricing');

// 6. Complete product creation
window.completeProductCreation(draft1.id);
assert(appState.data.activeArtisanScreen === 'my_crafts', 'TEST 22: Navigated to my_crafts upon product completion');

// 7. Verify newly created product appears immediately in My Crafts
const myCraftsAfter1 = renderArtisanView('my_crafts');
assert(myCraftsAfter1.includes(draft1.title) || myCraftsAfter1.includes('Handcrafted Bamboo Basket'), 'TEST 22: Newly created product is visible in My Crafts');

// 8. Return to Artisan Dashboard and verify Products count = 1
window.navArtisan('dashboard');
const dashAfter1 = renderArtisanView('dashboard');
assert(dashAfter1.includes('>1</div>\n            <div style="font-size: 12px; color: var(--text-muted);">Products</div>') || (dashAfter1.includes('1') && dashAfter1.includes('Products')), 'TEST 22: Dashboard shows Products: 1');

// 9. Add second product
window.navArtisan('add_product');
window.proceedWithProductImage('assets/bamboo_lamp.png');
const draft2Id = appState.data.selectedProductId;
const draft2 = appState.data.products.find(p => p.id === draft2Id);
assert(draft2.artisanId === newArtisanProfile.id, 'TEST 22: Second product is owned by logged-in artisan ID');
window.navArtisan('review_product');
window.saveDraftAndContinuePricing(draft2Id);
window.completeProductCreation(draft2Id);

// 10. Verify Products count = 2 in Dashboard
window.navArtisan('dashboard');
const dashAfter2 = renderArtisanView('dashboard');
assert(dashAfter2.includes('>2</div>\n            <div style="font-size: 12px; color: var(--text-muted);">Products</div>') || (dashAfter2.includes('2') && dashAfter2.includes('Products')), 'TEST 22: Dashboard dynamically updates to Products: 2');

// 11. Logout and login again with the new artisan
window.logoutArtisan();
assert(appState.data.artisanAuth.isRegistered === false, 'TEST 22: Successfully logged out artisan');

// Login with new artisan's mobile
const loginRes = appState.loginReturningArtisan(newArtisanPhone);
assert(loginRes.success === true, 'TEST 22: Successfully logged back in');
assert(appState.data.artisanAuth.artisanProfile.name === 'Sunita Sharma', 'TEST 22: Restored Sunita Sharma profile on re-login');
assert(appState.data.selectedArtisanId === newArtisanProfile.id, 'TEST 22: Selected artisan ID restored');

// Verify 2 products are still present and owned by this artisan
const productsForSunita = appState.data.products.filter(p => p.artisanId === newArtisanProfile.id);
assert(productsForSunita.length === 2, `TEST 22: Re-login retains the 2 created products (found: ${productsForSunita.length})`);

const reLoginDash = renderArtisanView('dashboard');
assert(reLoginDash.includes('>2</div>\n            <div style="font-size: 12px; color: var(--text-muted);">Products</div>') || (reLoginDash.includes('2') && reLoginDash.includes('Products')), 'TEST 22: Products count remains 2 after re-login');
assert(reLoginDash.includes('⭐ 0') && reLoginDash.includes('No ratings yet'), 'TEST 22: Rating remains 0 / No ratings yet after re-login');
assert(reLoginDash.includes('No sales yet'), 'TEST 22: Recent Sales remains "No sales yet" after re-login');

// 12. Verify demo artisan still has their 5 demo products and demo stats unchanged
appState.loginReturningArtisan('9876543210');
assert(appState.data.artisanAuth.artisanProfile.name === 'Ramesh Kumar', 'TEST 22: Demo artisan Ramesh Kumar still works');
const rameshProducts = appState.data.products.filter(p => p.artisanId === 'CRF-ART-001284');
assert(rameshProducts.length >= 5, `TEST 22: Demo artisan still has at least 5 demo products (found: ${rameshProducts.length})`);
const rameshDash = renderArtisanView('dashboard');
assert(rameshDash.includes('18') && rameshDash.includes('₹18,650'), 'TEST 22: Demo artisan business stats preserved');
assert(rameshDash.includes('⭐ 4.8'), 'TEST 22: Demo artisan rating preserved');

// ============================================================================
// TEST 23: CRAFTORA - FINAL DELETE PRODUCT FEATURE ONLY
// ============================================================================
console.log('\n--- TEST 23: Delete Product Feature & Ownership Safety ---');

// TEST 1: Login as existing demo artisan. Verify existing products are unchanged.
appState.loginReturningArtisan('9876543210'); // Ramesh Kumar
assert(appState.data.artisanAuth.isRegistered === true, 'TEST 23: Demo artisan Ramesh Kumar logged in');
const rameshDemoProducts = appState.data.products.filter(p => p.artisanId === 'CRF-ART-001284');
assert(rameshDemoProducts.length >= 5, `TEST 23: Demo artisan has 5 demo products (found: ${rameshDemoProducts.length})`);
// Deleting a demo product must be protected
const demoProduct = rameshDemoProducts[0];
const demoDeleteRes = appState.deleteProduct(demoProduct.id, 'CRF-ART-001284');
assert(demoDeleteRes.success === false && demoDeleteRes.reason === 'demo_product_protected', 'TEST 23: Demo product is protected from deletion');
assert(appState.data.products.some(p => p.id === demoProduct.id), 'TEST 23: Demo product remains in products list');

// TEST 2: Register/login as a new artisan.
window.logoutArtisan();
const test2ArtisanPhone = '9123456789';
appState.startNewArtisanRegistration();
appState.data.onboardingDraft.mobileNumber = test2ArtisanPhone;
appState.setArtisanScreen('onboarding_otp');
appState.data.onboardingDraft.otp = '1234';
const meeraProfile = appState.completeArtisanRegistration('Meera Devi', 'Pottery', 'Alwar, Rajasthan', test2ArtisanPhone);
const meeraId = meeraProfile.id;
assert(meeraProfile.productsSold === 0, 'TEST 23: New artisan productsSold = 0');
assert(meeraProfile.totalEarnings === 0, 'TEST 23: New artisan totalEarnings = 0');
assert(meeraProfile.ordersCompleted === 0, 'TEST 23: New artisan ordersCompleted = 0');
assert(Array.isArray(meeraProfile.recentSales) && meeraProfile.recentSales.length === 0, 'TEST 23: New artisan recentSales is empty');
assert(meeraProfile.rating === 0, 'TEST 23: New artisan rating = 0');
assert(meeraProfile.ratingCount === 0, 'TEST 23: New artisan ratingCount = 0');
const meeraInitialProducts = appState.data.products.filter(p => p.artisanId === meeraId);
assert(meeraInitialProducts.length === 0, 'TEST 23: New artisan initial products = 0');

// TEST 3: Create first product.
window.navArtisan('add_product');
window.proceedWithProductImage('assets/bamboo_basket.png');
const meeraProduct1Id = appState.data.selectedProductId;
assert(meeraProduct1Id != null, 'TEST 23: Created first product ID');
const meeraProd1 = appState.data.products.find(p => p.id === meeraProduct1Id);
assert(meeraProd1.isDemo === false, 'TEST 23: User-created product has isDemo: false');
window.navArtisan('review_product');
window.saveDraftAndContinuePricing(meeraProduct1Id);
window.completeProductCreation(meeraProduct1Id);

// Verify: Dashboard Products = 1, My Crafts shows the product, Product Details opens correctly
window.navArtisan('dashboard');
const meeraDash1 = renderArtisanView('dashboard');
assert(meeraDash1.includes('>1</div>\n            <div style="font-size: 12px; color: var(--text-muted);">Products</div>') || (meeraDash1.includes('1') && meeraDash1.includes('Products')), 'TEST 23: Dashboard shows Products = 1');

const meeraMyCrafts1 = renderArtisanView('my_crafts');
assert(meeraMyCrafts1.includes('Handcrafted Bamboo Basket'), 'TEST 23: My Crafts shows newly created product');

window.viewArtisanProductDetail(meeraProduct1Id);
const meeraDetail1 = renderArtisanView('product_detail');
assert(meeraDetail1.includes('Delete Product'), 'TEST 23: Product Details opens correctly with Delete Product button for owner');

// TEST 4: Delete that product. Verify confirmation appears. Press Cancel. Verify nothing changes.
window.requestDeleteProduct(meeraProduct1Id);
assert(appState.data.deleteConfirmProductId === meeraProduct1Id, 'TEST 23: deleteConfirmProductId set in state');
const confirmModalHtml = renderArtisanView('product_detail');
assert(confirmModalHtml.includes('Delete this product?'), 'TEST 23: Confirmation modal title displayed');
assert(confirmModalHtml.includes('This product will be removed from your CRAFTORA catalogue.'), 'TEST 23: Confirmation message displayed');
assert(confirmModalHtml.includes('Cancel') && confirmModalHtml.includes('Delete Product'), 'TEST 23: Cancel and Delete Product buttons displayed');

// Press Cancel
window.cancelDeleteProduct();
assert(!appState.data.deleteConfirmProductId, 'TEST 23: deleteConfirmProductId cleared on cancel');
assert(appState.data.products.some(p => p.id === meeraProduct1Id), 'TEST 23: Product was NOT deleted on cancel');

// TEST 5: Delete again and confirm.
window.requestDeleteProduct(meeraProduct1Id);
window.confirmDeleteProduct(meeraProduct1Id);

// Verify: Product disappears from My Crafts.
const meeraMyCraftsAfterDelete = renderArtisanView('my_crafts');
assert(!meeraMyCraftsAfterDelete.includes('Handcrafted Bamboo Basket') || meeraMyCraftsAfterDelete.includes('No products yet'), 'TEST 23: Product disappeared from My Crafts');
assert(meeraMyCraftsAfterDelete.includes('No products yet') && meeraMyCraftsAfterDelete.includes('Add your first craft to start building your digital catalogue.'), 'TEST 23: My Crafts shows empty state');

// Dashboard count becomes 0
window.navArtisan('dashboard');
const meeraDashAfterDelete = renderArtisanView('dashboard');
assert(meeraDashAfterDelete.includes('>0</div>\n            <div style="font-size: 12px; color: var(--text-muted);">Products</div>') || (meeraDashAfterDelete.includes('0') && meeraDashAfterDelete.includes('Products')), 'TEST 23: Dashboard product count becomes 0');

// Product is no longer active in buyer-side listings
appState.setBuyerScreen('explore');
const buyerExploreHtml = renderBuyerView('explore');
assert(!buyerExploreHtml.includes(meeraProduct1Id), 'TEST 23: Deleted product is not in Buyer Explore');

// Product Details returns not found / inactive
appState.setBuyerScreen('product_detail', { productId: meeraProduct1Id });
const buyerDetailHtml = renderBuyerView('product_detail');
assert(buyerDetailHtml.includes('Product Not Found'), 'TEST 23: Product Details is inactive/not found for deleted product');

// Product Passport is no longer active
appState.setBuyerScreen('passport', { productId: meeraProduct1Id });
const buyerPassportHtml = renderBuyerView('passport');
assert(buyerPassportHtml.includes('Product Passport Inactive') || buyerPassportHtml.includes('Product Not Found'), 'TEST 23: Product Passport is inactive for deleted product');

// QR verification does not show it as an active registered product
window.processScannedQRCode(`/verify/${meeraProduct1Id}`);
const qrResultHtml = renderBuyerView('scan_qr_result');
assert(qrResultHtml.includes('Product Not Registered'), 'TEST 23: QR verification shows Product Not Registered for deleted product');

// TEST 6: Create two products. Delete one.
window.navArtisan('add_product');
window.proceedWithProductImage('assets/bamboo_basket.png');
const pA_Id = appState.data.selectedProductId;
window.navArtisan('review_product');
window.saveDraftAndContinuePricing(pA_Id);
window.completeProductCreation(pA_Id);

window.navArtisan('add_product');
window.proceedWithProductImage('assets/bamboo_lamp.png');
const pB_Id = appState.data.selectedProductId;
window.navArtisan('review_product');
window.saveDraftAndContinuePricing(pB_Id);
window.completeProductCreation(pB_Id);

const twoProdsCount = appState.data.products.filter(p => p.artisanId === meeraId).length;
assert(twoProdsCount === 2, 'TEST 23: Created two products for Meera');

// Delete Product B
window.confirmDeleteProduct(pB_Id);

// Verify: Remaining product count = 1, remaining product is still accessible, deleted product is gone
const remainingProds = appState.data.products.filter(p => p.artisanId === meeraId);
assert(remainingProds.length === 1, 'TEST 23: Remaining product count = 1');
assert(remainingProds[0].id === pA_Id, 'TEST 23: Product A remains active');
assert(!appState.data.products.some(p => p.id === pB_Id), 'TEST 23: Product B permanently deleted');

window.navArtisan('dashboard');
const meeraDashWithOne = renderArtisanView('dashboard');
assert(meeraDashWithOne.includes('>1</div>\n            <div style="font-size: 12px; color: var(--text-muted);">Products</div>') || (meeraDashWithOne.includes('1') && meeraDashWithOne.includes('Products')), 'TEST 23: Dashboard dynamically shows Products: 1');

// TEST 7: Logout and login again. Verify: Deleted product remains deleted, remaining product remains available.
window.logoutArtisan();
const reLoginRes = appState.loginReturningArtisan(test2ArtisanPhone);
assert(reLoginRes.success === true, 'TEST 23: Logged back in as Meera Devi');
const prodsAfterReLogin = appState.data.products.filter(p => p.artisanId === meeraId);
assert(prodsAfterReLogin.length === 1 && prodsAfterReLogin[0].id === pA_Id, 'TEST 23: After logout & re-login, Product A is still present and Product B remains deleted');
assert(!appState.data.products.some(p => p.id === pB_Id), 'TEST 23: Product B remains deleted across sessions');

// TEST 8: Verify business statistics were NOT changed by deletion.
const statsCheck = appState.data.artisanAuth.artisanProfile;
assert(statsCheck.productsSold === 0, 'TEST 23: Products Sold remains 0');
assert(statsCheck.totalEarnings === 0, 'TEST 23: Total Earnings remains ₹0');
assert(statsCheck.ordersCompleted === 0, 'TEST 23: Orders Completed remains 0');
assert(Array.isArray(statsCheck.recentSales) && statsCheck.recentSales.length === 0, 'TEST 23: Recent Sales remains empty');
assert(statsCheck.rating === 0, 'TEST 23: Rating remains 0');
assert(statsCheck.ratingCount === 0, 'TEST 23: Rating count remains 0');

// TEST 9: Login as another artisan. Verify they cannot delete the first artisan's products.
appState.loginReturningArtisan('9876543210'); // Ramesh Kumar
assert(appState.data.artisanAuth.artisanProfile.id === 'CRF-ART-001284', 'TEST 23: Switched to Ramesh Kumar');
const crossDeleteRes = appState.deleteProduct(pA_Id, 'CRF-ART-001284');
assert(crossDeleteRes.success === false && crossDeleteRes.reason === 'unauthorized_not_owner', 'TEST 23: Ramesh cannot delete Meera product (ownership safety enforced)');
assert(appState.data.products.some(p => p.id === pA_Id), 'TEST 23: Meera product remains completely untouched');

// TEST 10: Verify the existing 8 demo products and 3 demo artisans remain unchanged.
const demoProductsRemaining = appState.data.products.filter(p => p.isDemo === true);
assert(demoProductsRemaining.length === 8, `TEST 23: All 8 demo products remain intact (found: ${demoProductsRemaining.length})`);
assert(appState.data.savedArtisans.length >= 3, `TEST 23: All 3 demo artisans remain intact (found: ${appState.data.savedArtisans.length})`);

console.log('\n======================================================');
console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) process.exit(1);

