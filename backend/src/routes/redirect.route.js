const express = require('express');
const router = express.Router();
const redirectController = require('../controllers/redirect.controller');

// Stripe redirects the user's browser to these URLs with GET after checkout
router.get('/success', redirectController.success);
router.get('/cancel', redirectController.cancel);

module.exports = router;
