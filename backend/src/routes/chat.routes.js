const express = require('express');
const ctrl = require('../controllers/chat.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const router = express.Router();

router.use(auth);
router.use(role('parent', 'student')); // Widget chỉ cho PH/HS

router.post('/message', ctrl.sendMessage);
router.post('/end-session', ctrl.endSession);

module.exports = router;
