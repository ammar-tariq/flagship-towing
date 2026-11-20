const express = require('express')
const multer = require('multer')
const router = express.Router()

const userController = require('../controllers/user.controller')
const { AuthVerifier, RestrictAccess } = require('../middlewares/auth.middleware')
const { ROLES } = require('../utils')
const upload = require('../middlewares/upload.middleware')

const sheetUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
})

router.get('/get', AuthVerifier, RestrictAccess([ROLES.ADMIN]), userController.getUser)

router.get('/check-email', userController.checkEmailExists)

router.get('/get/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), userController.getUserById)

router.get('/export', AuthVerifier, RestrictAccess([ROLES.ADMIN]), userController.exportUsers)

router.post(
    '/import-sheet',
    AuthVerifier,
    RestrictAccess([ROLES.ADMIN]),
    sheetUpload.single('file'),
    userController.importSheetUsers
)

router.post('/create', AuthVerifier, RestrictAccess([ROLES.ADMIN]), upload("images").single("picture"), userController.createUser)

router.post('/create-form-user', userController.createFormUser)

router.put('/update', AuthVerifier, userController.updateUser)

router.patch(
    '/admin-update/:id',
    AuthVerifier,
    RestrictAccess([ROLES.ADMIN]),
    upload('images').single('picture'),
    userController.adminUpdateUser
)

router.patch('/handle-status/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), userController.handleStatus)

router.get(
    '/deleted-accounts',
    AuthVerifier,
    RestrictAccess([ROLES.SUPER_ADMIN]),
    userController.getDeletedAccounts
)

router.get('/delete-preview', AuthVerifier, userController.getDeletePreview)

router.post('/delete', AuthVerifier, userController.deleteUser)

router.delete('/delete', AuthVerifier, userController.deleteUser)

router.delete('/delete/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), userController.deleteUser)

router.post('/change-password', AuthVerifier, userController.changePassword)

router.get('/my-profile', AuthVerifier, userController.getMyProfile)

router.get('/home', AuthVerifier, userController.getHome)

router.post('/logout', AuthVerifier, userController.logout)

module.exports = router