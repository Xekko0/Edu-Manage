const express = require('express');
const ctrl = require('../controllers/class.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const router = express.Router();
router.use(auth);

router.get('/grade-levels', ctrl.gradeLevels);
router.get('/school-years', ctrl.schoolYears);
router.get('/', ctrl.list);
router.get('/:id', ctrl.detail);
router.post('/', role('admin'), ctrl.create);
router.put('/:id', role('admin'), ctrl.update);
router.delete('/:id', role('admin'), ctrl.remove);

module.exports = router;
