const express = require('express');
const ctrl = require('../controllers/schedule.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const router = express.Router();

router.use(auth);

router.get('/mine', role('subject'), ctrl.listMine);
router.get('/my-class', role('student', 'parent'), ctrl.myClass);
router.get('/validation', role('admin'), ctrl.validation);
router.get('/validation-school', role('admin'), ctrl.validationSchool);
router.get('/', role('admin', 'subject', 'parent', 'student'), ctrl.list);

router.post('/generate-school', role('admin'), ctrl.generateSchool);
router.post('/generate', role('admin'), ctrl.generate);
router.post('/repack-school', role('admin'), ctrl.repackSchool);
router.post('/repack', role('admin'), ctrl.repack);
router.post('/resolve-conflicts', role('admin'), ctrl.resolveConflicts);

router.post('/auto-arrange-school', role('admin'), ctrl.autoArrangeSchool);
router.post('/auto-arrange', role('admin'), ctrl.autoArrange);

router.post('/', role('admin', 'subject'), ctrl.create);
router.put('/:id', role('admin', 'subject'), ctrl.update);
router.patch('/:id/lesson', role('admin', 'subject'), ctrl.patchLesson);
router.patch('/:id/move', role('admin', 'subject'), ctrl.move);
router.delete('/:id', role('admin', 'subject'), ctrl.remove);

module.exports = router;
