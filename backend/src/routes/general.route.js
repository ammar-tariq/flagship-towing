const express = require('express')
const rateLimit = require('express-rate-limit')
const router = express.Router()

const generalController = require('../controllers/general.controller')
const appSettingsController = require('../controllers/appSettings.controller')
const upload = require('../middlewares/upload.middleware')
const { AuthVerifier, RestrictAccess } = require('../middlewares/auth.middleware')
const { ROLES } = require('../utils')

const signupUploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many uploads. Please try again later.' },
})

/** Public (rate-limited) — used during signup before the user has a token. */
router.post(
    '/upload-signup-image',
    signupUploadLimiter,
    upload('images').single('image'),
    generalController.upload
)

router.post('/upload-image', AuthVerifier, upload("images").single("image"), generalController.upload)

router.post('/upload-quiz-media', AuthVerifier, RestrictAccess([ROLES.ADMIN, ROLES.SUPER_ADMIN]), upload("quiz").single("media"), generalController.upload)

router.post('/upload-document', AuthVerifier, upload("documents").single("document"), generalController.upload)

router.post('/upload-chat-media', AuthVerifier, upload("chat").single("media"), generalController.upload)

router.get('/get-data', generalController.getData)

router.get('/get-content', generalController.getContent)

router.get('/get-dashboard', AuthVerifier, RestrictAccess([ROLES.ADMIN, ROLES.SUPER_ADMIN]), generalController.getDashboardData)

router.get('/boating-locations', generalController.getBoatingLocations)

router.get(
    '/app-settings',
    AuthVerifier,
    RestrictAccess([ROLES.SUPER_ADMIN]),
    appSettingsController.getAppSettings
)
router.patch(
    '/app-settings',
    AuthVerifier,
    RestrictAccess([ROLES.SUPER_ADMIN]),
    appSettingsController.patchAppSettings
)

module.exports = router
