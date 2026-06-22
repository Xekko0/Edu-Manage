const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/competency.controller');

router.use(auth);

router.get('/', controller.list);
router.get('/student/:student_id', controller.getStudentProfile);

module.exports = router;
