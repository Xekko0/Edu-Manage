const express = require('express');
const ctrl = require('../controllers/room.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const router = express.Router();

router.use(auth);
router.get('/', role('admin', 'subject'), ctrl.list);
router.post('/', role('admin'), ctrl.create);
router.put('/:id', role('admin'), ctrl.update);
router.delete('/:id', role('admin'), ctrl.remove);

module.exports = router;
