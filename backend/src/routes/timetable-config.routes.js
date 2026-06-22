const express = require('express');
const ctrl = require('../controllers/timetable-config.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const router = express.Router();

router.use(auth);
router.get('/calendar', role('admin', 'subject', 'parent', 'student', 'homeroom'), ctrl.getCalendar);
router.get('/', role('admin', 'subject', 'parent', 'student', 'homeroom'), ctrl.get);
router.put('/', role('admin'), ctrl.update);

module.exports = router;
