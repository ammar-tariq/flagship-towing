const express = require('express')
const router = express.Router()

const vesselController = require('../controllers/vessel.controller')
const { AuthVerifier } = require('../middlewares/auth.middleware')

router.post('/create/:id', AuthVerifier, vesselController.createVessel)

router.get('/get', AuthVerifier, vesselController.getVessel)

router.get('/get/:id', AuthVerifier, vesselController.getVesselById)

router.get('/payment-status/:id', AuthVerifier, vesselController.getVesselPaymentStatus)

router.patch('/update/:id', AuthVerifier, vesselController.updateVessel)

router.delete('/delete/:id', AuthVerifier, vesselController.deleteVessel)

module.exports = router