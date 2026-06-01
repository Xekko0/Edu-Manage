const express = require('express');
const ctrl = require('../controllers/notification.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const homeroom = require('../middleware/homeroom.middleware');

const router = express.Router();

router.use(auth);

router.get('/me', ctrl.myList);
router.patch('/:id/read', ctrl.markRead);
// Thông báo chỉ Admin/GVCN. Endpoint này không mang class_id/student_id nên không thể dùng homeroom middleware ở đây.
// Nếu cần GVCN tạo thông báo theo lớp, nên bổ sung endpoint riêng /notifications/class/:class_id.
router.post('/', role('admin'), ctrl.create);

module.exports = router;
