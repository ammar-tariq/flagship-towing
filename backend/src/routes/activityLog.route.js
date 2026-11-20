const express = require('express')
const router = express.Router()

const activityLogController = require('../controllers/activityLog.controller')
const { AuthVerifier, RestrictAccess } = require('../middlewares/auth.middleware')
const { ROLES } = require('../utils')

router.get(
    '/',
    AuthVerifier,
    RestrictAccess([ROLES.SUPER_ADMIN]),
    activityLogController.getActivityLogs,
)

module.exports = router
