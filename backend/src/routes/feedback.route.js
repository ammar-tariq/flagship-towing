const express = require('express')
const router = express.Router()

const feedbackController = require('../controllers/feedback.controller')
const { AuthVerifier, OptionalAuth, RestrictAccess } = require('../middlewares/auth.middleware')
const { ROLES } = require('../utils')

// Public + app: if called from app with token, user is attached; if not, feedback is still saved anonymously.
router.post('/create', OptionalAuth, feedbackController.createFeedback)

router.get('/get', AuthVerifier, RestrictAccess([ROLES.ADMIN]), feedbackController.getFeedback)

router.get('/get/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), feedbackController.getFeedbackById)

router.patch('/resolve/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), feedbackController.resolveFeedback)

module.exports = router
