const express = require('express');
const ctrl = require('../controllers/extracurricular.controller');
const auth = require('../middleware/auth.middleware');
const parentLink = require('../middleware/parent-link.middleware');

const router = express.Router();
router.use(auth);

router.get('/', ctrl.list);
router.get('/student/:student_id', parentLink, ctrl.listByStudent);

module.exports = router;
