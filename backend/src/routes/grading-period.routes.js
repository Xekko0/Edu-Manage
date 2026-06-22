const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const controller = require('../controllers/grading-period.controller');

router.use(auth);

router.get('/', controller.list);
router.post('/', role('admin'), controller.create);
router.put('/:id', role('admin'), controller.update);
router.delete('/:id', role('admin'), controller.remove);
router.post('/:id/lock', role('admin'), controller.lock);

module.exports = router;
