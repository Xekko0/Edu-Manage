const express = require('express');
const ctrl = require('../controllers/evaluation.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const parentLink = require('../middleware/parent-link.middleware');

const router = express.Router();
router.use(auth);

router.get('/student/:student_id', parentLink, ctrl.listByStudent);
router.post('/', role('admin', 'homeroom', 'subject'), ctrl.create);
router.put('/:id', role('admin', 'homeroom', 'subject'), ctrl.update);
router.delete('/:id', role('admin', 'homeroom', 'subject'), ctrl.remove);

module.exports = router;
