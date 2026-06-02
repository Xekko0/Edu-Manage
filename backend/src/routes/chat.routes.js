const express = require('express');
const ctrl = require('../controllers/chat.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { chatRateLimit } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.use(auth);
router.use(role('parent', 'student', 'admin', 'subject', 'homeroom'));

router.get('/status', ctrl.getAiStatus);
router.get('/sessions', ctrl.listSessions);
router.get('/sessions/:token', ctrl.getSessionHistory);
router.delete('/sessions/:token', ctrl.deleteSession);

router.post('/message', chatRateLimit, ctrl.sendMessage);
router.post('/end-session', ctrl.endSession);

module.exports = router;
