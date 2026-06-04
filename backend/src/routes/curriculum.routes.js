const express = require('express');
const ctrl = require('../controllers/curriculum.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const router = express.Router();

router.use(auth);
router.get('/', role('admin'), ctrl.list);
router.get('/lookup', role('admin'), ctrl.lookupForClass);
router.put('/', role('admin'), ctrl.upsert);
router.delete('/:id', role('admin'), ctrl.remove);

module.exports = router;
