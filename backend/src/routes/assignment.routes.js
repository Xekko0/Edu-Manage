const express = require('express');
const ctrl = require('../controllers/assignment.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const router = express.Router();

router.use(auth);

router.get('/', role('admin'), ctrl.list);
router.post('/', role('admin'), ctrl.create);
router.delete('/:id', role('admin'), ctrl.remove);
router.get('/me', role('subject'), ctrl.myAssignments);

module.exports = router;
