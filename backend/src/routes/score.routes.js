const express = require('express');
const ctrl = require('../controllers/score.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const assignment = require('../middleware/assignment.middleware');
const parentLink = require('../middleware/parent-link.middleware');

const router = express.Router();
router.use(auth);

// Ghi điểm — GV phải qua assignment.middleware
router.post('/', role('admin', 'subject'), assignment, ctrl.enter);
router.post('/bulk', role('admin', 'subject'), assignment, ctrl.bulkEnter);
router.put('/:id', role('admin', 'subject'), ctrl.update);

// Xem điểm theo HS — PH/HS phải pass parent-link
router.get('/student/:student_id', parentLink, ctrl.listByStudent);
router.get('/student/:student_id/pdf', parentLink, ctrl.exportGradebookPDF);

// Xem toàn bộ điểm theo LỚP — GVCN lớp đó, hoặc GVBM dạy lớp đó (chỉ môn mình)
router.get('/class/:class_id', role('admin', 'subject'), ctrl.listByClass);

module.exports = router;
