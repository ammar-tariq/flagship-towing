const express = require('express')
const router = express.Router()

const conversationController = require('../controllers/conversation.controller')
const { AuthVerifier, RestrictAccess } = require('../middlewares/auth.middleware')
const { ROLES } = require('../utils')

router.post('/create', AuthVerifier, RestrictAccess([ROLES.VENDOR, ROLES.USER]), conversationController.createConversation)

router.get('/get', AuthVerifier, RestrictAccess([ROLES.VENDOR, ROLES.USER]), conversationController.getConversation)

router.get('/get/:id', AuthVerifier, RestrictAccess([ROLES.VENDOR, ROLES.USER]), conversationController.getConversationById)

router.post('/message', AuthVerifier, RestrictAccess([ROLES.VENDOR, ROLES.USER]), conversationController.sendMessage)

module.exports = router