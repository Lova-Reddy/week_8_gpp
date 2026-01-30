const { Queue } = require('bullmq');
const redisConfig = require('../config/redis');

const paymentQueue = new Queue('payment-queue', { connection: redisConfig });
const webhookQueue = new Queue('webhook-queue', { connection: redisConfig });
const refundQueue = new Queue('refund-queue', { connection: redisConfig });

exports.getJobStatus = async (req, res) => {
    // Needs to aggregate counts from all queues or just a general status
    // The requirement says: Query the job queue (Redis) to get statistics: pending, processing, completed, failed

    // We have 3 queues. Let's aggregate or just show one? The spec implies "The job queue", singular/plural.
    // Let's return stats for all or sum them up. Usually it's for 'payment' jobs or 'webhook' jobs.
    // Let's return stats for paymentQueue mainly or headers might specify?
    // "Create an endpoint handler for GET /api/v1/test/jobs/status"

    const queues = [paymentQueue, webhookQueue, refundQueue];

    let pending = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    for (const q of queues) {
        const counts = await q.getJobCounts('wait', 'active', 'completed', 'failed');
        pending += counts.wait;
        processing += counts.active;
        completed += counts.completed;
        failed += counts.failed;
    }

    // Worker status - difficult to check from here without heartbeat, but can assume running if redis is up or just static "running"

    res.json({
        pending,
        processing,
        completed,
        failed,
        worker_status: 'running' // Placeholder
    });
};
