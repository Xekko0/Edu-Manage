const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const parentLink = require('../middleware/parent-link.middleware');
const controller = require('../controllers/finance.controller');

router.use(auth);

router.get('/summary', role('admin'), controller.getFinanceSummary);
router.post('/invoices', role('admin'), controller.createInvoice);
router.post('/payments', role('admin'), controller.recordPayment);
router.get('/student/:student_id', parentLink, controller.getStudentInvoices);

module.exports = router;
