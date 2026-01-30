const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const redisConfig = require('../config/redis');

const prisma = new PrismaClient();
const webhookQueue = new Queue('webhook-queue', { connection: redisConfig });

const processPayment = async (job) => {
    const { paymentId } = job.data;
    const isTestMode = process.env.TEST_MODE === 'true';

    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { merchant: true }
    });

    if (!payment) {
        throw new Error('Payment not found');
    }

    // Simulate delay
    const delay = isTestMode ? 1000 : Math.random() * 5000 + 5000; // 5-10s
    await new Promise(resolve => setTimeout(resolve, delay));

    // Determine outcome
    let success = true;
    if (!isTestMode) {
        if (payment.method === 'upi') success = Math.random() < 0.9;
        else success = Math.random() < 0.95;
    }
    // isTestMode ensures success by default unless specified otherwise, simpler for checking "success" flow

    const status = success ? 'success' : 'failed';

    await prisma.payment.update({
        where: { id: paymentId },
        data: {
            status,
            error_code: success ? null : 'PAYMENT_FAILED',
            error_description: success ? null : 'Payment processing failed'
        }
    });

    // Enqueue webhook
    const event = success ? 'payment.success' : 'payment.failed';
    if (payment.merchant.webhook_url) {
        await webhookQueue.add('deliver-webhook', {
            merchantId: payment.merchant_id,
            event,
            payload: {
                payment: {
                    id: payment.id,
                    amount: payment.amount,
                    status: status,
                    // ... add other fields
                    order_id: payment.order_id,
                    currency: payment.currency,
                    method: payment.method,
                    vpa: payment.vpa,
                    created_at: payment.created_at
                }
            }
        });
    }
};

module.exports = { processPayment };
