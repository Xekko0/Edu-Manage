const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const controller = require('../controllers/course-registration.controller');

router.use(auth);

router.get('/electives', controller.listElectives);
router.post('/register', role('student'), controller.register);
router.post('/drop', role('student'), controller.drop);

module.exports = router;
