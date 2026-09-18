# SIH_Repo

# CRAFTORA — AI-Powered Digital Business Platform for Artisans
**Smart India Hackathon (SIH 2026)**

CRAFTORA bridges traditional Indian craftsmanship with modern technology, empowering master artisans to create digital product catalogs, compute fair pricing, issue Digital Product Passports, and connect directly with domestic and international buyers.

---

## 🌟 Key Features

### 1. 🧑‍🎨 Master Artisan Experience
- **Voice-First & Multilingual Onboarding**: Real browser Web Speech API support for **English (`en-IN`)** and **Hindi (`hi-IN`)** with live dictation and automatic form population.
- **AI Craft Cataloguing**: Turn photos and spoken descriptions into structured product listings.
- **Smart Cost & Pricing Engine**: Itemizes raw materials, labor wages, production days, and packaging to calculate fair market pricing with artisan profit margins.
- **Digital Product Passport (DPP)**: Immutable identity card capturing craft specs, artisan origin, materials, and production history.
- **Scannable QR Code Generation**: Instant on-canvas forest-green QR code generation with high-resolution PNG downloads for physical tagging.

### 2. 🛍️ Buyer & Marketplace Experience
- **Guest Browsing & Discoverability**: Explore authentic handicrafts by category (Bamboo, Pottery, Weaving, Painting).
- **Provenance Verification**: Scan or upload QR codes to verify authenticity and inspect registered Digital Product Passports.
- **Direct Connect**: Inquiry flow for retail, custom orders, and bulk orders directly to artisans.

### 3. 🛡️ Verification & Admin Portal
- **Compliance & Audit Queue**: Review pending artisan credentials and AI product classification confidence scores.
- **Prototype Blockchain Provenance Ledger**: Tamper-evident record of registered provenance events (simulating Polygon Testnet records with full technical honesty and compliance disclaimers).

---

## 🎨 Design System
- **Palette**: Warm ivory canvas (`#F7F3ED`), deep forest green (`#215036`), rich terracotta (`#BC4E2F`), and muted copper/gold accents (`#A0714F`).
- **Typography**: Clean, accessible charcoal typography (`#1C1917`) paired with Google Fonts (Inter, Outfit, Playfair Display).
- **Demo Control Bar**: Collapsible top evaluator toolbar to seamlessly switch between Artisan, Buyer, and Admin roles during presentations.

---

## 🚀 Getting Started

### Prerequisites
- Any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox).
- Node.js (optional, for local HTTP serving).

### Running Locally

```bash
# Clone the repository
git clone https://github.com/ohhparagg/SIH_Repo.git
cd SIH_Repo

# Serve locally using Node.js
node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{let fp=path.join(process.cwd(),req.url==='/'?'/index.html':decodeURIComponent(req.url));const ext=path.extname(fp);const mime={'html':'text/html','css':'text/css','js':'application/javascript','png':'image/png','jpg':'image/jpeg','webp':'image/webp','svg':'image/svg+xml'};fs.readFile(fp,(e,d)=>{if(e){res.writeHead(404);res.end('Not found');}else{res.writeHead(200,{'Content-Type':mime[ext.slice(1)]||'text/plain','Cache-Control':'no-cache'});res.end(d);}});}).listen(3456,'127.0.0.1',()=>console.log('CRAFTORA running at http://127.0.0.1:3456/'));"
```

Open `http://127.0.0.1:3456/` in your browser.

---

## 📂 Project Structure

```
c:\crafto_sih\
├── assets/                  # Product imagery & artisan photos
├── css/
│   └── index.css            # Complete design system & light theme styling
├── js/
│   ├── app.js               # Central application router & view assembler
│   ├── state.js             # Reactive state management with localStorage persistence
│   ├── components/
│   │   ├── TopNav.js        # Navigation header with role and language toggles
│   │   ├── BottomNav.js     # Role-specific tab navigation
│   │   ├── DemoControlBar.js# Hackathon evaluation switcher
│   │   ├── VoiceModal.js    # Web Speech API voice assistant
│   │   ├── QRScannerModal.js# QR code generator and verification scanner
│   │   ├── DigitalProductPassportCard.js # DPP identity & provenance card
│   │   ├── SmartPricingCalculator.js     # Cost calculation engine
│   │   ├── AIChecklist.js   # AI status checklist
│   │   └── Icons.js         # SVG icon system
│   ├── data/
│   │   └── mockData.js      # Seed datasets for artisans, crafts, and buyer requests
│   ├── lib/
│   │   └── qrcode.min.js    # Local offline QR code generation engine
│   └── views/
│       ├── shared/LandingView.js
│       ├── artisan/ArtisanViews.js
│       ├── buyer/BuyerViews.js
│       └── admin/AdminViews.js
├── index.html               # Main HTML entry point
└── README.md
```
