const express = require('express');
const ctrl = require('../controllers/report.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const homeroom = require('../middleware/homeroom.middleware');

const router = express.Router();

router.use(auth);

router.get('/class/:class_id/overview', role('admin', 'subject'), homeroom, ctrl.classOverview);
router.get('/promotion-forecast', role('admin'), ctrl.promotionForecast);

module.exports = router;
