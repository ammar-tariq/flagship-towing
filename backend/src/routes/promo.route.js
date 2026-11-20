const express = require('express')
const router = express.Router()

const promoController = require('../controllers/promo.controller')
const { AuthVerifier, RestrictAccess } = require('../middlewares/auth.middleware')
const { ROLES } = require('../utils')

router.post('/create', AuthVerifier, RestrictAccess([ROLES.ADMIN]), promoController.createPromo)

router.patch('/update/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), promoController.updatePromo)

router.patch('/handle-status/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), promoController.handleStatus)

router.get('/get', AuthVerifier, RestrictAccess([ROLES.ADMIN]), promoController.getPromo)

router.get('/get/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), promoController.getPromoById)

module.exports = router