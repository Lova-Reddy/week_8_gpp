const { Worker } = require('bullmq');
const { processPayment } = require('./jobs/processPayment');
const { deliverWebhook } = require('./jobs/deliverWebhook');
const { processRefund } = require('./jobs/processRefund');
const redisConfig = require('./config/redis');

console.log('Starting workers...');

const paymentWorker = new Worker('payment-queue', async (job) => {
    console.log(`Processing payment job ${job.id}`);
    await processPayment(job);
}, { connection: redisConfig });

const webhookWorker = new Worker('webhook-queue', async (job) => {
    console.log(`Processing webhook job ${job.id}`);
    await deliverWebhook(job);
}, { connection: redisConfig });

const refundWorker = new Worker('refund-queue', async (job) => {
    console.log(`Processing refund job ${job.id}`);
    await processRefund(job);
}, { connection: redisConfig });

paymentWorker.on('completed', (job) => {
    console.log(`Payment job ${job.id} completed`);
});

paymentWorker.on('failed', (job, err) => {
    console.log(`Payment job ${job.id} failed with ${err.message}`);
});

webhookWorker.on('completed', (job) => {
    console.log(`Webhook job ${job.id} completed`);
});

webhookWorker.on('failed', (job, err) => {
    console.log(`Webhook job ${job.id} failed with ${err.message}`);
});

refundWorker.on('completed', (job) => {
    console.log(`Refund job ${job.id} completed`);
});

refundWorker.on('failed', (job, err) => {
    console.log(`Refund job ${job.id} failed with ${err.message}`);
});
