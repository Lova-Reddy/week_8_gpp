const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const redisConfig = require('../config/redis');

const prisma = new PrismaClient();
const webhookQueue = new Queue('webhook-queue', { connection: redisConfig });

const processRefund = async (job) => {
    const { refundId } = job.data;

    const refund = await prisma.refund.findUnique({
        where: { id: refundId },
        include: { payment: true, merchant: true }
    });

    if (!refund) return;

    // Simulate delay 3-5s
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 3000));

    await prisma.refund.update({
        where: { id: refundId },
        data: {
            status: 'processed',
            processed_at: new Date()
        }
    });

    // Webhook
    if (refund.merchant.webhook_url) {
        await webhookQueue.add('deliver-webhook', {
            merchantId: refund.merchant_id,
            event: 'refund.processed',
            payload: {
                refund: {
                    id: refund.id,
                    payment_id: refund.payment_id,
                    amount: refund.amount,
                    status: 'processed',
                    reason: refund.reason,
                    created_at: refund.created_at,
                    processed_at: new Date()
                }
            }
        });
    }
};

module.exports = { processRefund };
