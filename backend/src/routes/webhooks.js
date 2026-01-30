const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', webhookController.listWebhooks);
router.post('/:id/retry', webhookController.retryWebhook);
router.get('/config', webhookController.getConfig); // Custom endpoint for dashboard
router.post('/config', webhookController.updateConfig); // Custom endpoint for dashboard
router.post('/test', webhookController.testWebhook);

module.exports = router;
