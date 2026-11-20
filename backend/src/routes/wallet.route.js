const express = require('express');
const router = express.Router();
const { AuthVerifier } = require('../middlewares/auth.middleware');
const { generateApplePass, generateGooglePass } = require('../controllers/wallet.controller');

/**
 * Wallet routes for Apple Wallet (iOS) and Google Wallet (Android)
 * All routes require authentication via AuthVerifier middleware
 */

// iOS: Generate Apple Wallet pass (.pkpass file)
router.post('/apple', AuthVerifier, generateApplePass);

// Android: Generate Google Wallet pass (save URL)
router.post('/google', AuthVerifier, generateGooglePass);

module.exports = router;

