const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const controller = require('../controllers/invite.controller');

router.use(auth);

router.post('/generate', role('admin', 'subject'), controller.generateCode);
router.post('/redeem', role('parent'), controller.redeemCode);
router.get('/my-code', role('student'), controller.getMyCode);

module.exports = router;
