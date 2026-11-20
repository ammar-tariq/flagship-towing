const express = require('express')
const router = express.Router()

const familyController = require('../controllers/family.controller')
const { AuthVerifier, RestrictAccess } = require('../middlewares/auth.middleware')
const { ROLES } = require('../utils')

router.post('/create', AuthVerifier, RestrictAccess([ROLES.USER]), familyController.createFamily)

router.get('/get', AuthVerifier, RestrictAccess([ROLES.ADMIN, ROLES.USER]), familyController.getFamily)

router.get('/get/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN, ROLES.USER]), familyController.getFamilyById)

router.patch('/update/:id', AuthVerifier, RestrictAccess([ROLES.USER]), familyController.updateFamily)

router.delete('/delete/:id', AuthVerifier, RestrictAccess([ROLES.USER]), familyController.deleteFamily)

router.patch('/handle-status/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), familyController.handleStatus)

router.get('/get-count/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), familyController.getFamilyCount)

module.exports = router