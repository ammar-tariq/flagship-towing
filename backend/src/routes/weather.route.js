const express = require('express')
const router = express.Router()
const weatherController = require('../controllers/weather.controller')

/** Public — home weather card is shown to guests. */
router.get('/summary', weatherController.getSummary)
router.get('/forecast', weatherController.getForecast)
router.get('/tides', weatherController.getTides)
router.get('/service-areas', weatherController.getServiceAreas)
router.get('/wind-field', weatherController.getWindField)
router.get('/radar', weatherController.getRadar)

module.exports = router
