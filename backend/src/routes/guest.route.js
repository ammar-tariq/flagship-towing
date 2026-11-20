const express = require('express')
const router = express.Router()

const guestController = require('../controllers/guest.controller')
const { AuthVerifier, RestrictAccess } = require('../middlewares/auth.middleware')
const { ROLES } = require('../utils')

router.post('/create', AuthVerifier, RestrictAccess([ROLES.USER]), guestController.createGuest)

router.get('/get', AuthVerifier, guestController.getGuest)

router.get('/get/:id', AuthVerifier, guestController.getGuestById)

router.patch('/update/:id', AuthVerifier, RestrictAccess([ROLES.USER]), guestController.updateGuest)

router.delete('/delete/:id', AuthVerifier, RestrictAccess([ROLES.USER]), guestController.deleteGuest)

module.exports = router