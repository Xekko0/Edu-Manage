const express = require('express');
const ctrl = require('../controllers/journal.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const router = express.Router();
router.use(auth);

router.get('/class/:class_id', ctrl.listByClass);
router.post('/', role('admin', 'homeroom', 'subject'), ctrl.create);
router.put('/:id', role('admin', 'homeroom', 'subject'), ctrl.update);
router.delete('/:id', role('admin', 'homeroom', 'subject'), ctrl.remove);

module.exports = router;
