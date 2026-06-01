const express = require('express');
const ctrl = require('../controllers/student.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const router = express.Router();
router.use(auth);

// Đọc: Admin/GV xem theo phạm vi, HS/PH xem chính mình
router.get('/', ctrl.list);
router.get('/me', role('parent', 'student'), ctrl.myContext);
router.get('/:id', ctrl.detail);

// Ghi:
// Tất cả giáo viên đều role=subject; quyền "GVCN" được quyết định theo classes.homeroom_teacher_id trong controller.
router.post('/', role('admin', 'subject'), ctrl.create);
router.put('/:id', role('admin', 'subject'), ctrl.update);
router.patch('/:id/reset-password', role('admin', 'subject'), ctrl.resetPassword);
router.delete('/:id', role('admin'), ctrl.remove);

module.exports = router;
