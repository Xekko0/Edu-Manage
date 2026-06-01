const express = require('express');
const ctrl = require('../controllers/user.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const homeroom = require('../middleware/homeroom.middleware');

const router = express.Router();
router.use(auth);

// Admin toàn quyền
// Admin: xem tất cả. Giáo viên: chỉ được xem phụ huynh/học sinh lớp mình chủ nhiệm (enforce ở controller).
router.get('/', role('admin', 'subject'), ctrl.list);
router.post('/', role('admin'), ctrl.create);
router.put('/:id', role('admin', 'subject'), ctrl.update);
router.delete('/:id', role('admin'), ctrl.remove);
router.patch('/:id/toggle-active', role('admin'), ctrl.toggleActive);
router.post('/import-csv', role('admin'), ctrl.importCSV);

// Admin + GVCN
// Tất cả giáo viên đều role=subject; các tác vụ GVCN cần qua homeroom middleware (suy ra class_id từ student_id).
router.post('/parent-for-student', role('admin', 'subject'), homeroom, ctrl.createParentForStudent);
router.post('/link-parent-child', role('admin', 'subject'), homeroom, ctrl.linkParentChild);
router.post('/unlink-parent-child', role('admin', 'subject'), homeroom, ctrl.unlinkParentChild);
router.patch('/:id/reset-password', role('admin', 'subject'), ctrl.resetPassword);

module.exports = router;
