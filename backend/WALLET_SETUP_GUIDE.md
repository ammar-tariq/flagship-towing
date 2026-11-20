# 🎫 Apple Wallet & Google Wallet Integration Guide

**Complete setup guide for adding membership cards to Apple Wallet (iOS) and Google Wallet (Android)**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Apple Wallet Setup (iOS)](#apple-wallet-setup-ios)
4. [Google Wallet Setup (Android)](#google-wallet-setup-android)
5. [Customization Guide](#customization-guide)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Future Improvements](#future-improvements)

---

## 🎯 Overview

This integration allows users to add their membership cards to:
- **Apple Wallet** (iOS) - Generates `.pkpass` files
- **Google Wallet** (Android) - Generates save URLs with JWT tokens

### Architecture
```
Mobile App → API Request → Backend Generates Pass → Mobile Displays in Wallet
```

---

## ✅ Prerequisites

### Backend
- Node.js v14+
- Express.js server running
- MongoDB database
- Active Apple Developer Account ($99/year)
- Google Cloud Console account (free)

### Mobile
- React Native app
- iOS: Physical iPhone (Simulator doesn't support Wallet)
- Android: Physical Android device or emulator

---

## 🍎 Apple Wallet Setup (iOS)

### Step 1: Create Pass Type ID in Apple Developer Portal

1. **Visit:** https://developer.apple.com/account/resources/identifiers/list/passTypeId

2. **Click** the **"+"** button (top left)

3. **Select** "Pass Type IDs" → Click **Continue**

4. **Fill in:**
   - Description: `Flagship Towing Membership Pass`
   - Identifier: `pass.com.flagshiptowing.membership`

5. **Click** Continue → Register

6. **Copy** your Pass Type ID (you'll need it for `.env`)

---

### Step 2: Generate Certificate Signing Request (CSR)

**Open Terminal and run:**

```bash
cd /Users/ammar/Desktop/workspace/pg/flagshipNoah/backendFlagship/certs

# Generate RSA private key and CSR (IMPORTANT: Must be RSA, not ECC)
openssl req -new -newkey rsa:2048 -nodes \
  -keyout signerKey.pem \
  -out CertificateSigningRequest.certSigningRequest \
  -subj "/emailAddress=dev@flagshiptowing.com, CN=Flagship Towing Pass RSA, C=US"

# Verify it's RSA (should say "RSA PRIVATE KEY")
head -1 signerKey.pem
```

**Expected output:** `-----BEGIN RSA PRIVATE KEY-----`

**⚠️ IMPORTANT:** The key MUST be RSA (not ECC). The library `passkit-generator` only supports RSA.

---

### Step 3: Create Certificate in Apple Developer Portal

1. **Go back** to: https://developer.apple.com/account/resources/identifiers/list/passTypeId

2. **Click** on your Pass Type ID: `pass.com.flagshiptowing.membership`

3. **Click** "Create Certificate" button

4. **Upload** the file: `CertificateSigningRequest.certSigningRequest`

5. **Click** Continue → **Download** the certificate

6. **Save** as `pass.cer` in your Downloads folder

---

### Step 4: Convert Certificate to PEM Format

**Run in Terminal:**

```bash
cd /Users/ammar/Desktop/workspace/pg/flagshipNoah/backendFlagship/certs

# Convert downloaded certificate to PEM
openssl x509 -inform DER -in ~/Downloads/pass.cer -out signerCert.pem

# Clean up
rm ~/Downloads/pass.cer

# Verify certificate is RSA (should say "rsaEncryption")
openssl x509 -in signerCert.pem -text -noout | grep "Public Key Algorithm"
```

**Expected output:** `Public Key Algorithm: rsaEncryption`

---

### Step 5: Download Apple WWDR Certificate

**Run in Terminal:**

```bash
cd /Users/ammar/Desktop/workspace/pg/flagshipNoah/backendFlagship/certs

# Download WWDR G4 (RSA-based, required for passkit-generator)
curl -o wwdr.cer https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer

# Convert to PEM
openssl x509 -inform DER -in wwdr.cer -out wwdr.pem

# Clean up
rm wwdr.cer

# Verify it's RSA
openssl x509 -in wwdr.pem -text -noout | grep "Public Key Algorithm"
```

**Expected output:** `Public Key Algorithm: rsaEncryption`

**⚠️ NOTE:** Use WWDR G4, not G6. G6 is ECC-based and won't work with `passkit-generator`.

---

### Step 6: Get Your Team ID

1. **Visit:** https://developer.apple.com/account

2. **Look** for "Team ID" under your account name (top right)

3. **Copy** the 10-character Team ID (e.g., `A1B2C3D4E5`)

---

### Step 7: Add Apple Wallet Icons

**Icon Requirements:**
- Format: PNG (with transparency)
- Required sizes:
  - `icon.png` - 29x29px
  - `icon@2x.png` - 58x58px
  - `icon@3x.png` - 87x87px
  - `logo.png` - 160x160px
  - `logo@2x.png` - 320x320px
  - `logo@3x.png` - 480x480px

**Location:** `backendFlagship/assets/pass-icons/`

**Create icons using:**
- Design tool (Figma, Photoshop, etc.)
- Or online tool: https://appicon.co
- Or use existing icons (already present in the project)

**⚠️ IMPORTANT:** Icons must exist or pass generation will show a warning.

---

### Step 8: Configure Environment Variables

**Edit:** `backendFlagship/.env`

**Add:**
```env
# Apple Wallet Configuration
APPLE_PASS_TYPE_ID=pass.com.flagshiptowing.membership
APPLE_TEAM_ID=A1B2C3D4E5
APPLE_PASS_KEY_PASSPHRASE=
```

**Notes:**
- Replace `A1B2C3D4E5` with your actual Team ID
- Leave `APPLE_PASS_KEY_PASSPHRASE` empty if your key is not encrypted
- If you encrypted your private key during CSR generation, add the passphrase here

---

### Step 9: Verify Certificate Setup

**Run in Terminal:**

```bash
cd /Users/ammar/Desktop/workspace/pg/flagshipNoah/backendFlagship/certs

# List all certificates
ls -lh *.pem

# Should show:
# - wwdr.pem (1-2 KB)
# - signerCert.pem (1-2 KB)
# - signerKey.pem (1-2 KB)
```

**All files should be > 1000 bytes**

---

### Step 10: Test Apple Wallet

**Start Backend:**
```bash
cd /Users/ammar/Desktop/workspace/pg/flagshipNoah/backendFlagship
yarn server:dev
```

**Run Mobile App (on physical iPhone):**
```bash
cd /Users/ammar/Desktop/workspace/pg/flagshipNoah/mobileFlagship
cd ios && pod install && cd ..
yarn ios
```

**Test:**
1. Navigate to Membership Card screen
2. Tap "Add to Apple Wallet"
3. Apple Wallet should open
4. Pass should be added

**⚠️ MUST TEST ON PHYSICAL DEVICE:** iOS Simulator does not support Apple Wallet.

---

## 🤖 Google Wallet Setup (Android)

### Step 1: Create Google Cloud Project

1. **Visit:** https://console.cloud.google.com

2. **Click** "Select a project" → "New Project"

3. **Fill in:**
   - Project name: `Flagship Towing Wallet`
   - Click **Create**

4. **Wait** for project to be created

5. **Select** your new project from the dropdown

---

### Step 2: Enable Google Wallet API

1. **Visit:** https://console.cloud.google.com/apis/library

2. **Search** for: `Google Wallet API`

3. **Click** on "Google Wallet API"

4. **Click** "Enable"

5. **Wait** for API to be enabled (~1 minute)

---

### Step 3: Create Service Account

1. **Visit:** https://console.cloud.google.com/iam-admin/serviceaccounts

2. **Click** "Create Service Account"

3. **Fill in:**
   - Service account name: `wallet-api`
   - Service account ID: `wallet-api` (auto-filled)
   - Description: `Service account for Google Wallet API`

4. **Click** Create and Continue

5. **Grant Role:**
   - Select: `Service Account User`
   - Click Continue

6. **Click** Done

---

### Step 4: Download Service Account Key

1. **On the Service Accounts page**, find your `wallet-api` account

2. **Click** on the service account email

3. **Go to** "Keys" tab

4. **Click** "Add Key" → "Create new key"

5. **Select** "JSON" format

6. **Click** Create

7. **Save** the downloaded JSON file as:
   ```
   backendFlagship/certs/google-wallet-service-account.json
   ```

**⚠️ IMPORTANT:** Keep this file secure! It contains sensitive credentials.

---

### Step 5: Create Google Wallet Issuer Account

1. **Visit:** https://pay.google.com/business/console

2. **Click** "Get Started" or "Google Wallet API"

3. **Fill in** business information:
   - Business name: `Flagship Towing`
   - Website: `https://flagshiptowing.com`
   - Customer support email
   - Customer support phone

4. **Submit** for review (may take 1-2 days)

5. **Once approved**, go to "API access" section

6. **Copy** your Issuer ID (format: `3388000000022XXXXXX`)

---

### Step 6: Grant Service Account Access

1. **In Google Pay & Wallet Console**, go to "API access"

2. **Find** "Service accounts" section

3. **Click** "Add service account"

4. **Paste** your service account email from Step 3:
   ```
   wallet-api@flagship-towing-wallet.iam.gserviceaccount.com
   ```

5. **Select Role:** Developer or Admin

6. **Click** Save

**⚠️ CRITICAL:** Without this step, you'll get "Service account email did not have edit access" error.

---

### Step 7: Create Generic Pass Class

1. **Visit:** https://pay.google.com/business/console

2. **Go to:** "Google Wallet API" → "Pass classes"

3. **Click** "Create a class"

4. **Select:** "Generic Pass"

5. **Fill in:**
   - Class ID: `flagship_towing_membership`
   - Class name: `Flagship Towing Membership`
   - Issuer name: `Flagship Towing`

6. **Click** Save

7. **Copy** the full Class ID (format: `3388000000022XXXXXX.flagship_towing_membership`)

**⚠️ NOTE:** The Class ID must include your Issuer ID prefix!

---

### Step 8: Configure Environment Variables

**Edit:** `backendFlagship/.env`

**Add:**
```env
# Google Wallet Configuration
GOOGLE_WALLET_ISSUER_ID=3388000000022XXXXXX
```

**Notes:**
- Replace `3388000000022XXXXXX` with your actual Issuer ID
- Make sure service account JSON is in `/certs/` directory

---

### Step 9: Verify Google Wallet Setup

**Check files:**
```bash
cd /Users/ammar/Desktop/workspace/pg/flagshipNoah/backendFlagship

# Verify service account JSON exists
ls -lh certs/google-wallet-service-account.json

# Should show file size (2-3 KB)
```

**Verify environment variable:**
```bash
grep GOOGLE_WALLET_ISSUER_ID .env
```

---

### Step 10: Test Google Wallet

**Start Backend:**
```bash
cd /Users/ammar/Desktop/workspace/pg/flagshipNoah/backendFlagship
yarn server:dev
```

**Run Mobile App (on Android device or emulator):**
```bash
cd /Users/ammar/Desktop/workspace/pg/flagshipNoah/mobileFlagship
yarn android
```

**Test:**
1. Navigate to Membership Card screen
2. Tap "Add to Google Wallet"
3. Google Wallet should open in browser/app
4. Pass should be added

---

## 🎨 Customization Guide

### Change Pass Colors

**File:** `backendFlagship/src/helpers/wallet.js`

**Apple Wallet:**
```javascript
// Line 38-40
backgroundColor: "rgb(0, 51, 102)",    // Navy blue background
foregroundColor: "rgb(255, 255, 255)", // White text
labelColor: "rgb(255, 255, 255)",     // White labels
```

**Google Wallet:**
```javascript
// Line 284
hexBackgroundColor: "#003366"  // Navy blue
```

**Color Format:**
- Apple: RGB format `rgb(R, G, B)`
- Google: Hex format `#RRGGBB`

---

### Change Pass Content/Fields

**File:** `backendFlagship/src/helpers/wallet.js`

#### Apple Wallet Fields

**Primary Field (Large, centered):**
```javascript
// Line 51-55
primaryFields: [{
    key: "member",
    label: "MEMBER",
    value: `${userData.first_name} ${userData.last_name}`
}]
```

**Secondary Field (Below primary):**
```javascript
// Line 56-60
secondaryFields: [{
    key: "membership",
    label: "MEMBERSHIP TYPE",
    value: membershipData.name
}]
```

**Auxiliary Fields (Bottom row, 2 columns):**
```javascript
// Line 61-72
auxiliaryFields: [
    {
        key: "phone",
        label: "EMERGENCY TOWING",
        value: "1-888-BOAT-TOW"
    },
    {
        key: "expires",
        label: "EXPIRES",
        value: new Date(membershipData.current_period_end * 1000).toLocaleDateString()
    }
]
```

**Back Fields (Flip side of pass):**
```javascript
// Line 73-105
backFields: [
    { key: "membershipId", label: "Membership ID", value: membershipData.id },
    { key: "memberName", label: "Member Name", value: `${userData.first_name} ${userData.last_name}` },
    { key: "email", label: "Email", value: userData.email || 'N/A' },
    { key: "phone", label: "Phone", value: userData.phone || 'N/A' },
    { key: "vessel", label: "Vessel", value: membershipData.vessel ? membershipData.vessel.name : 'N/A' },
    { key: "terms", label: "Terms & Conditions", value: "For full terms and conditions, visit flagshiptowing.com" }
]
```

#### Google Wallet Fields

**Header (Top, bold):**
```javascript
// Line 239-243
header: {
    defaultValue: {
        language: "en-US",
        value: membershipData.name
    }
}
```

**Subheader (Below header):**
```javascript
// Line 244-250
subheader: {
    defaultValue: {
        language: "en-US",
        value: `${userData.first_name} ${userData.last_name}`
    }
}
```

**Text Modules (Details section):**
```javascript
// Line 260-280
textModulesData: [
    {
        header: "EMERGENCY TOWING",
        body: "1-888-BOAT-TOW",
        id: "phone"
    },
    {
        header: "MEMBERSHIP ID",
        body: membershipData.id || 'N/A',
        id: "membershipId"
    },
    {
        header: "EXPIRES",
        body: new Date(membershipData.current_period_end * 1000).toLocaleDateString(),
        id: "expires"
    },
    {
        header: "VESSEL",
        body: membershipData.vessel ? membershipData.vessel.name : 'N/A',
        id: "vessel"
    }
]
```

---

### Change QR Code Content

**File:** `backendFlagship/src/helpers/wallet.js`

**Apple Wallet:**
```javascript
// Line 43-47
barcodes: [{
    format: "PKBarcodeFormatQR",
    message: membershipData.id,  // ← Change this to any string
    messageEncoding: "iso-8859-1"
}]
```

**Google Wallet:**
```javascript
// Line 253-257
barcode: {
    type: "QR_CODE",
    value: membershipData.id,  // ← Change this to any string
    alternateText: membershipData.id
}
```

**Common QR Code Content Ideas:**
- Membership ID only: `membershipData.id`
- URL: `https://flagshiptowing.com/verify/${membershipData.id}`
- JSON: `JSON.stringify({ id: membershipData.id, user: userData.email })`
- Verification code: `MEMBER-${membershipData.id}-${Date.now()}`

---

### Change Pass Organization Name

**File:** `backendFlagship/src/helpers/wallet.js`

**Apple Wallet:**
```javascript
// Line 32
organizationName: "Flagship Towing",  // ← Change here
```

**Google Wallet:**
```javascript
// Line 233-237
cardTitle: {
    defaultValue: {
        language: "en-US",
        value: "Flagship Towing Membership"  // ← Change here
    }
}
```

---

### Update Icons/Logos

#### Apple Wallet Icons

**Location:** `backendFlagship/assets/pass-icons/`

**Required files:**
- `icon.png` (29x29) - Shows in notifications, Wallet list
- `icon@2x.png` (58x58) - Retina version
- `icon@3x.png` (87x87) - iPhone X and newer
- `logo.png` (160x160) - Shows on pass front
- `logo@2x.png` (320x320) - Retina version
- `logo@3x.png` (480x480) - iPhone X and newer

**Requirements:**
- Format: PNG with transparency
- Square dimensions
- High contrast (shows on colored background)

**Replace existing icons:**
```bash
cd /Users/ammar/Desktop/workspace/pg/flagshipNoah/backendFlagship/assets/pass-icons/

# Copy your new icons here (must match exact filenames)
cp /path/to/your/icon-29.png icon.png
cp /path/to/your/icon-58.png icon@2x.png
cp /path/to/your/icon-87.png icon@3x.png
cp /path/to/your/logo-160.png logo.png
cp /path/to/your/logo-320.png logo@2x.png
cp /path/to/your/logo-480.png logo@3x.png
```

#### Google Wallet Logo

**Google Wallet uses remote image URLs** (not local files).

**File:** `backendFlagship/src/helpers/wallet.js`

**Add logo to pass object:**
```javascript
// After line 285, add:
logo: {
    sourceUri: {
        uri: "https://yourdomain.com/images/logo.png"
    },
    contentDescription: {
        defaultValue: {
            language: "en-US",
            value: "Flagship Towing Logo"
        }
    }
},
heroImage: {
    sourceUri: {
        uri: "https://yourdomain.com/images/hero.png"
    },
    contentDescription: {
        defaultValue: {
            language: "en-US",
            value: "Membership Card"
        }
    }
}
```

**Image Requirements:**
- Format: PNG or JPG
- Logo: Recommended 1032x336 pixels
- Hero: Recommended 1032x336 pixels
- Must be publicly accessible URL
- HTTPS required

---

### Change Pass Expiration Behavior

**File:** `backendFlagship/src/helpers/wallet.js`

**Apple Wallet:**
```javascript
// Line 70-71
label: "EXPIRES",
value: new Date(membershipData.current_period_end * 1000).toLocaleDateString()
```

**Options:**
- Show date: `.toLocaleDateString()`
- Show date and time: `.toLocaleString()`
- Custom format: Use a date formatting library
- Never expires: Use `"Never"` instead of date

**Google Wallet:**
```javascript
// Line 313-318
{
    header: "EXPIRES",
    body: new Date(membershipData.current_period_end * 1000).toLocaleDateString(),
    id: "expires"
}
```

---

### Add Location-Based Notifications

**File:** `backendFlagship/src/helpers/wallet.js`

**Apple Wallet:**
```javascript
// Line 108-114
locations: [
    {
        latitude: 37.7749,      // ← Your marina/office coordinates
        longitude: -122.4194,
        relevantText: "Welcome! Show your membership card for assistance."
    }
]
```

**Add multiple locations:**
```javascript
locations: [
    {
        latitude: 37.7749,
        longitude: -122.4194,
        relevantText: "San Francisco Marina - Show your membership card"
    },
    {
        latitude: 34.0522,
        longitude: -118.2437,
        relevantText: "Los Angeles Harbor - Show your membership card"
    }
]
```

**How it works:**
- Pass appears on lock screen when user is near the location
- Trigger radius: ~250 meters
- User must have location services enabled

---

## 🧪 Testing

### Test Checklist

#### Backend
- [ ] Server starts without errors
- [ ] Environment variables loaded correctly
- [ ] Certificates exist and are valid
- [ ] Icons exist in correct location

#### Apple Wallet
- [ ] `.pkpass` file generates successfully
- [ ] No certificate errors in logs
- [ ] Icons display correctly
- [ ] All fields show correct data
- [ ] QR code scans properly
- [ ] Location notifications work (if configured)
- [ ] Pass updates when membership changes

#### Google Wallet
- [ ] JWT generates successfully
- [ ] Save URL opens Google Wallet
- [ ] All fields show correct data
- [ ] QR code scans properly
- [ ] Pass displays in Google Wallet app
- [ ] Colors match brand

### Testing Commands

**Backend Logs:**
```bash
cd /Users/ammar/Desktop/workspace/pg/flagshipNoah/backendFlagship
yarn server:dev

# Watch for:
# "🍎 Generating Apple Wallet pass..."
# "✅ Apple Wallet .pkpass generated successfully"
# "🔵 Generating Google Wallet pass..."
# "✅ Google Wallet JWT generated successfully"
```

**Test API Endpoints (with Postman or cURL):**

**Apple Wallet:**
```bash
curl -X POST https://your-api.com/flagship-towing/v1/api/wallet/apple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subscription": {"id": "sub_123", "name": "Gold Plan", "current_period_end": 1735689600}}' \
  --output membership.pkpass

# Open the downloaded .pkpass file
open membership.pkpass
```

**Google Wallet:**
```bash
curl -X POST https://your-api.com/flagship-towing/v1/api/wallet/google \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subscription": {"id": "sub_123", "name": "Gold Plan", "current_period_end": 1735689600}}'

# Copy the "url" from response and open in browser
```

---

## 🐛 Troubleshooting

### Apple Wallet Issues

#### Error: "Cannot read public key. OID is not RSA"
**Cause:** Certificate is ECC-based, not RSA  
**Solution:**
```bash
# Check certificate type
openssl x509 -in certs/signerCert.pem -text -noout | grep "Public Key Algorithm"

# If it shows "ecPublicKey", recreate with RSA:
# 1. Revoke certificate in Apple Developer Portal
# 2. Generate new RSA-based CSR (see Step 2)
# 3. Create new certificate
```

#### Error: "At least one icon file is missing"
**Cause:** Icon files not found  
**Solution:**
```bash
# Check if icons exist
ls -lh backendFlagship/assets/pass-icons/*.png

# All 6 files must exist and be > 0 bytes
```

#### Error: "Signer certificate file is empty"
**Cause:** Certificate file is corrupted or empty  
**Solution:**
```bash
# Check file size
ls -lh certs/*.pem

# All should be > 1000 bytes

# If empty, re-download from Apple Developer Portal
```

#### Pass doesn't open on iPhone
**Cause:** Device restrictions or invalid pass  
**Solution:**
- Test on physical device (not simulator)
- Check device has storage space
- Verify pass is not expired
- Check backend logs for generation errors

---

### Google Wallet Issues

#### Error: "Service account email did not have edit access"
**Cause:** Service account not granted access in Google Pay Console  
**Solution:**
1. Go to: https://pay.google.com/business/console
2. API access → Service accounts
3. Add your service account email
4. Grant "Developer" or "Admin" role

#### Error: "Something went wrong" when opening URL
**Cause:** Invalid JWT or incorrect Issuer ID  
**Solution:**
```bash
# Verify Issuer ID in .env
grep GOOGLE_WALLET_ISSUER_ID .env

# Check backend logs for JWT generation errors
# Verify pass object ID includes Issuer ID prefix
```

#### Pass class not found
**Cause:** Class ID mismatch or not created  
**Solution:**
1. Go to: https://pay.google.com/business/console
2. Google Wallet API → Pass classes
3. Verify class ID: `{ISSUER_ID}.flagship_towing_membership`
4. If missing, create new class

---

## 🚀 Future Improvements

### Recommended Enhancements

#### 1. **Dynamic Pass Updates**
**Current:** Passes are static after generation  
**Improvement:** Implement pass updates when membership changes

**Implementation:**
- Add webhook endpoint to receive membership updates
- Generate new pass with updated data
- Use Apple Push Notification service to update passes
- For Google Wallet, update pass via API

**Files to modify:**
- `backendFlagship/src/controllers/wallet.controller.js`
- Add new route: `/wallet/update`

---

#### 2. **Pass Expiration Handling**
**Current:** Expiration date shown but no automatic removal  
**Improvement:** Automatically remove expired passes

**Apple Wallet:**
```javascript
// Add to pass model in wallet.js
expirationDate: new Date(membershipData.current_period_end * 1000).toISOString(),
voided: false  // Set to true when membership expires
```

**Google Wallet:**
```javascript
// Add to generic object
validTimeInterval: {
    end: {
        date: new Date(membershipData.current_period_end * 1000).toISOString()
    }
}
```

---

#### 3. **Better Logo/Image Handling**
**Current:** Local files for Apple, hardcoded URLs for Google  
**Improvement:** Host images on CDN

**Implementation:**
1. Upload logos to CDN (AWS S3, Cloudinary, etc.)
2. Update icon paths to use CDN URLs
3. Implement image resizing service

**Benefits:**
- Consistent branding across platforms
- Easy logo updates without redeploying
- Better performance

---

#### 4. **Multi-Language Support**
**Current:** English only  
**Improvement:** Support multiple languages

**Implementation:**
```javascript
// Add language detection based on user preferences
const language = userData.language || 'en-US';

// Update pass fields
cardTitle: {
    defaultValue: {
        language: language,
        value: language === 'es-ES' ? "Membresía de Remolque Flagship" : "Flagship Towing Membership"
    }
}
```

---

#### 5. **Analytics and Tracking**
**Current:** No tracking of pass usage  
**Improvement:** Track pass generation and usage

**Metrics to track:**
- Number of passes generated (by platform)
- Pass add success/failure rate
- Pass scanning events
- Pass expiration reminders sent

**Implementation:**
- Add analytics service (Google Analytics, Mixpanel)
- Log events in `wallet.controller.js`
- Create dashboard for metrics

---

#### 6. **Pass Personalization**
**Current:** Same design for all users  
**Improvement:** Customize based on membership tier

**Implementation:**
```javascript
// In wallet.js
const getPassColors = (membershipTier) => {
    switch(membershipTier) {
        case 'gold':
            return { bg: 'rgb(255, 215, 0)', fg: 'rgb(0, 0, 0)' };
        case 'silver':
            return { bg: 'rgb(192, 192, 192)', fg: 'rgb(0, 0, 0)' };
        default:
            return { bg: 'rgb(0, 51, 102)', fg: 'rgb(255, 255, 255)' };
    }
};

const colors = getPassColors(membershipData.tier);
// Use colors in pass model
```

---

#### 7. **Email Pass Delivery**
**Current:** Only in-app delivery  
**Improvement:** Send pass via email

**Implementation:**
- Generate pass on backend
- Attach .pkpass file to email
- For Android, include Google Wallet save link
- Use email service (SendGrid, AWS SES)

---

#### 8. **Pass Backup and Recovery**
**Current:** If user loses device, must re-add pass  
**Improvement:** Allow pass re-download

**Implementation:**
- Store generated passes in database
- Add endpoint: `/wallet/download/:membershipId`
- Allow users to download pass from web portal

---

#### 9. **Offline QR Code Validation**
**Current:** QR code just contains membership ID  
**Improvement:** Add validation data

**Implementation:**
```javascript
// Generate signed QR code content
const qrData = {
    id: membershipData.id,
    expires: membershipData.current_period_end,
    signature: generateHMAC(membershipData.id + membershipData.current_period_end)
};

barcodes: [{
    format: "PKBarcodeFormatQR",
    message: JSON.stringify(qrData),
    messageEncoding: "iso-8859-1"
}]
```

---

#### 10. **Better Error Handling and User Feedback**
**Current:** Generic error messages  
**Improvement:** Specific, actionable error messages

**Files to modify:**
- `mobileFlagship/src/Hooks/useAddToWallet.ts`
- Add detailed error codes and messages
- Show troubleshooting tips in error alerts

---

### Performance Optimizations

#### 1. **Cache Generated Passes**
Store generated passes in Redis/memory cache to avoid regenerating

#### 2. **Async Pass Generation**
Use job queue (Bull, BullMQ) for pass generation if it takes >2 seconds

#### 3. **CDN for Static Assets**
Host icons and images on CDN for faster loading

#### 4. **Compress Pass Files**
Optimize .pkpass file size by compressing images

---

### Security Enhancements

#### 1. **Rate Limiting**
Prevent abuse by limiting pass generation requests

```javascript
// Add to wallet.route.js
const rateLimit = require('express-rate-limit');

const walletRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // limit each user to 10 requests per windowMs
});

router.post('/apple', AuthVerifier, walletRateLimit, generateApplePass);
```

#### 2. **Pass Validation**
Add HMAC signature to passes for verification

#### 3. **Certificate Rotation**
Regularly rotate Apple certificates (before 1-year expiration)

#### 4. **Secure Service Account**
Use Google Secret Manager instead of JSON file

---

## 📚 Additional Resources

### Official Documentation
- **Apple PassKit:** https://developer.apple.com/documentation/passkit
- **Google Wallet API:** https://developers.google.com/wallet/generic
- **passkit-generator:** https://github.com/alexandercerutti/passkit-generator

### Useful Tools
- **Pass Validator (Apple):** https://pkpassvalidator.com
- **QR Code Generator:** https://www.qr-code-generator.com
- **Image Resizer:** https://www.iloveimg.com/resize-image
- **JSON Formatter:** https://jsonformatter.org

### Support
- **Apple Developer Forums:** https://developer.apple.com/forums
- **Google Wallet Support:** https://support.google.com/pay
- **Stack Overflow:** Tag with `apple-wallet` or `google-wallet`

---

## ✅ Final Checklist

### Before Going to Production

- [ ] All certificates properly configured and backed up
- [ ] Environment variables set correctly
- [ ] Icons meet size and format requirements
- [ ] Tested on physical iOS device
- [ ] Tested on physical Android device
- [ ] Pass displays correctly in both wallets
- [ ] QR codes scan properly
- [ ] Error handling tested
- [ ] Backend logs reviewed
- [ ] Rate limiting configured
- [ ] Certificates added to `.gitignore`
- [ ] Documentation updated with team-specific info
- [ ] Monitoring/analytics configured

---

**Setup Complete! 🎉**

Your Apple Wallet and Google Wallet integration is now ready for production use.

For questions or issues, refer to the Troubleshooting section or contact the development team.

