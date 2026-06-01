const express = require('express');
const ctrl = require('../controllers/tuition.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const parentLink = require('../middleware/parent-link.middleware');
const homeroom = require('../middleware/homeroom.middleware');

const router = express.Router();
router.use(auth);

// Admin: CRUD cấu hình học phí
router.get('/', ctrl.listTuitions);
router.post('/', role('admin'), ctrl.createTuition);
router.put('/:id', role('admin'), ctrl.updateTuition);
router.delete('/:id', role('admin'), ctrl.removeTuition);

// HS/PH/GV xem theo HS (PH/HS phải pass parent-link)
router.get('/student/:student_id', parentLink, ctrl.listByStudent);

// Admin / GVCN ghi nhận đóng học phí
router.post('/payments', role('admin', 'subject'), homeroom, ctrl.recordPayment);

module.exports = router;
