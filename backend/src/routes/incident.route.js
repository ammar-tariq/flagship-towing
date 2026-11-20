const express = require('express')
const router = express.Router()

const incidentController = require('../controllers/incident.controller')
const { AuthVerifier, RestrictAccess } = require('../middlewares/auth.middleware')
const { ROLES } = require('../utils')

router.post('/create', AuthVerifier, RestrictAccess([ROLES.ADMIN]), incidentController.createIncident)

router.patch('/update/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), incidentController.updateIncident)

router.get('/get', AuthVerifier, incidentController.getIncidents)

router.get('/get/:id', AuthVerifier, incidentController.getIncidentById)

router.delete('/delete/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), incidentController.deleteIncident)

module.exports = router
