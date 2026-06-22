const express = require('express');
const ctrl = require('../controllers/assignment.controller');
const unavailCtrl = require('../controllers/teacher-unavailability.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const router = express.Router();

router.use(auth);

router.get('/', role('admin'), ctrl.list);
router.post('/', role('admin'), ctrl.create);
router.post('/sync-curriculum', role('admin'), ctrl.syncCurriculum);
router.delete('/:id', role('admin'), ctrl.remove);
router.get('/me', role('subject'), ctrl.myAssignments);

router.get('/unavailability', role('admin'), unavailCtrl.list);
router.post('/unavailability', role('admin'), unavailCtrl.create);
router.delete('/unavailability/:id', role('admin'), unavailCtrl.remove);

module.exports = router;
