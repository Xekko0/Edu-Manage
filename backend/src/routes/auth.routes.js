const express = require('express');
const ctrl = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);
router.patch('/change-password', auth, ctrl.changePassword);
router.get('/me', auth, ctrl.me);

module.exports = router;
