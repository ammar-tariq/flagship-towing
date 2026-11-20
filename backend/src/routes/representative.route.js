const express = require('express')
const router = express.Router()

const representativeController = require('../controllers/representative.controller')
const { AuthVerifier, RestrictAccess } = require('../middlewares/auth.middleware')
const { ROLES } = require('../utils')

router.post('/create', AuthVerifier, RestrictAccess([ROLES.ADMIN]), representativeController.createRepresentative)

router.patch('/handle-status/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), representativeController.handleStatus)

router.patch('/update/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), representativeController.updateRepresentative)

router.delete('/delete/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), representativeController.deleteRepresentative)

router.get('/get', AuthVerifier, RestrictAccess([ROLES.ADMIN]), representativeController.getRepresentative)

router.get('/get/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), representativeController.getRepresentativeById)

module.exports = router