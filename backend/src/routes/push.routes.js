const express = require('express');
const ctrl = require('../controllers/push.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const router = express.Router();

router.get('/vapid-public-key', ctrl.vapidPublicKey);
router.use(auth);
router.post('/subscribe', role('student', 'parent', 'subject', 'admin'), ctrl.subscribe);
router.delete('/subscribe', role('student', 'parent', 'subject', 'admin'), ctrl.unsubscribe);

module.exports = router;
