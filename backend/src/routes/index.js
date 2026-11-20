const express = require('express')
const router = express.Router()

const userRoutes = require('./user.route')
const authRoutes = require('./authentication.route')
const feedbackRoutes = require('./feedback.route')
const generalRoutes = require('./general.route')
const notificationRoutes = require('./notification.route')
const packageRoutes = require('./package.route')
const familyRoutes = require('./family.route')
const serviceRoutes = require('./service.route')
const vesselRoutes = require('./vessel.route')
const incidentRoutes = require('./incident.route')
const representativeRoutes = require('./representative.route')
const promoRoutes = require('./promo.route')
const walletRoutes = require('./wallet.route')
const redirectRoutes = require('./redirect.route')
const oauthRoutes = require('./oauth.route')
const weatherRoutes = require('./weather.route')
const activityLogRoutes = require('./activityLog.route')

router.use('/user', userRoutes)

router.use('/auth', authRoutes)

router.use('/feedback', feedbackRoutes)

router.use('/general', generalRoutes)

router.use('/notification', notificationRoutes)

router.use('/package', packageRoutes)

router.use('/family', familyRoutes)

router.use('/service', serviceRoutes)

router.use('/vessel', vesselRoutes)

router.use('/incident', incidentRoutes)

router.use('/representative', representativeRoutes)

router.use('/promo', promoRoutes)

router.use('/wallet', walletRoutes)

router.use('/redirect', redirectRoutes)

router.use('/oauth', oauthRoutes)

router.use('/weather', weatherRoutes)

router.use('/activity-log', activityLogRoutes)

module.exports = router