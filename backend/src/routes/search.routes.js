const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/search.controller');

router.use(auth);
router.get('/', controller.globalSearch);

module.exports = router;
