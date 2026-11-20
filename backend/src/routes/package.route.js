const express = require('express')
const router = express.Router()

const packageController = require('../controllers/package.controller')
const { AuthVerifier, RestrictAccess, OptionalAuth } = require('../middlewares/auth.middleware')
const upload = require('../middlewares/upload.middleware')
const { ROLES } = require('../utils')

router.post('/create', AuthVerifier, RestrictAccess([ROLES.ADMIN]), upload("packages").single("image"), packageController.createPackage)

router.put('/update/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), upload("packages").single("image"), packageController.updatePackage)

router.put('/handle-status/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), packageController.handleStatus)

router.get('/get', OptionalAuth, packageController.getPackages)

router.get('/get/:id', OptionalAuth, packageController.getPackageById)

router.post('/subscribe/:id', AuthVerifier, packageController.subscribe)

router.get('/payment-logs', AuthVerifier, packageController.getPaymentLogs)

router.post('/cancel', AuthVerifier, packageController.cancelSubscription)

module.exports = router