const express = require('express');
const ctrl = require('../controllers/attendance.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const homeroom = require('../middleware/homeroom.middleware');
const parentLink = require('../middleware/parent-link.middleware');

const router = express.Router();

router.use(auth);

// Tất cả giáo viên đều role=subject; chỉ GVCN (homeroom middleware) được điểm danh.
router.post('/mark', role('admin', 'subject'), homeroom, ctrl.mark);
router.patch('/:id/late', role('admin', 'subject'), homeroom, ctrl.markLate);
router.get('/class/:class_id', role('admin', 'subject'), homeroom, ctrl.listByClass);
router.get('/student/:student_id', parentLink, ctrl.listByStudent);

module.exports = router;
