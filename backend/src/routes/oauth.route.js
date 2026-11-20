const express = require('express')
const router = express.Router()
const oauthController = require('../controllers/oauth.controller')

router.get('/gmail-callback', oauthController.gmailCallback)

module.exports = router
