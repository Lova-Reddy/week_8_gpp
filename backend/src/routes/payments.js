const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.post('/', paymentController.createPayment);
router.post('/:id/capture', paymentController.capturePayment);
router.post('/:id/refunds', paymentController.createRefund);
router.get('/refunds/:id', paymentController.getRefund); // Note: Original spec said GET /api/v1/refunds/{id}, so this might be mounted under /api/v1/refunds or payments?
// Spec: GET /api/v1/refunds/{refund_id}
// My mounting in index.js: app.use('/api/v1/payments', paymentRoutes);
// So this would be /api/v1/payments/refunds/:id if I put it here.
// I should adjust index.js or create a new route file for refunds. 
// OR simpler: just add another route in index.js for refunds.

module.exports = router;
