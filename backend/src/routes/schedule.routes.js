const express = require('express');
const ctrl = require('../controllers/schedule.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const router = express.Router();

router.use(auth);

router.get('/mine', role('subject'), ctrl.listMine);
router.get('/', role('admin', 'subject', 'parent', 'student'), ctrl.list);
router.post('/auto-arrange', role('admin'), ctrl.autoArrange);
router.post('/', role('admin', 'subject'), ctrl.create);
router.put('/:id', role('admin', 'subject'), ctrl.update);
router.patch('/:id/move', role('admin', 'subject'), ctrl.move);
router.delete('/:id', role('admin', 'subject'), ctrl.remove);

module.exports = router;
