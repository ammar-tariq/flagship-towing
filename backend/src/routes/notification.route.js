const express = require('express')
const router = express.Router()

const notificationController = require('../controllers/notification.controller')
const { AuthVerifier } = require('../middlewares/auth.middleware')

router.get('/get', AuthVerifier, notificationController.getNotification)
router.get('/unread-count', AuthVerifier, notificationController.getUnreadCount)
router.patch('/read-all', AuthVerifier, notificationController.markAllAsRead)
router.patch('/read/:id', AuthVerifier, notificationController.markAsRead)

module.exports = router