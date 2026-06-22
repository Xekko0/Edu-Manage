const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const parentLink = require('../middleware/parent-link.middleware');
const controller = require('../controllers/exam.controller');

router.use(auth);

// Transcripts
router.post('/transcripts/compute', role('admin', 'subject'), controller.computeTranscript);
router.post('/transcripts/compute-class', role('admin', 'subject'), controller.computeClassTranscripts);
router.get('/transcripts/student/:student_id', parentLink, controller.getStudentTranscript);

// Exam Periods
router.get('/periods', controller.listExamPeriods);
router.post('/periods', role('admin'), controller.createExamPeriod);
router.put('/periods/:id', role('admin'), controller.updateExamPeriod);

module.exports = router;
