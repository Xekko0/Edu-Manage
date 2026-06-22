const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const controller = require('../controllers/ews.controller');

router.use(auth);

router.get('/student/:student_id', controller.getStudentRisk);
router.get('/class/:class_id', role('admin', 'subject'), controller.getClassRisks);
router.get('/dashboard', role('admin', 'subject'), controller.getDashboardSummary);
router.post('/recompute', role('admin'), controller.recompute);

module.exports = router;
