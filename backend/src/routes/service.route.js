const express = require('express')
const router = express.Router()

const serviceController = require('../controllers/service.controller')
const { AuthVerifier, RestrictAccess } = require('../middlewares/auth.middleware')
const { ROLES } = require('../utils')

router.post('/create', AuthVerifier, RestrictAccess([ROLES.ADMIN]), serviceController.createService)

router.get('/get', serviceController.getService)

router.get('/get/:id', serviceController.getServiceById)

router.patch('/update/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), serviceController.updateService)

router.delete('/delete/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), serviceController.deleteService)

module.exports = router