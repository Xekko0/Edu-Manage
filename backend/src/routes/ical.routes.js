const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/ical.controller');

// Public feeds (không cần auth — calendar apps cần truy cập trực tiếp)
router.get('/teacher/:teacher_id', controller.teacherFeed);
router.get('/student/:student_id', controller.studentFeed);
router.get('/class/:class_id', controller.classFeed);

// Authenticated: lấy link cá nhân
router.get('/link', auth, controller.getMyLink);

module.exports = router;
