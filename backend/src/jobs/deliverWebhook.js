const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const calculateNextRetry = (attempt) => {
    // 1m, 5m, 30m, 2h
    // Test mode: 0s, 5s, 10s, 15s, 20s
    if (process.env.WEBHOOK_RETRY_INTERVALS_TEST === 'true') {
        const delays = [0, 5, 10, 15, 20];
        const delaySec = delays[attempt - 1] || 20;
        return new Date(Date.now() + delaySec * 1000);
    } else {
        const delays = [0, 60, 300, 1800, 7200];
        const delaySec = delays[attempt - 1] || 7200;
        return new Date(Date.now() + delaySec * 1000);
    }
};

const deliverWebhook = async (job) => {
    const { merchantId, event, payload, retryCount = 0, logId } = job.data;

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant || !merchant.webhook_url) return;

    // Create or Update Log
    let log;
    if (logId) {
        log = await prisma.webhookLog.findUnique({ where: { id: logId } });
    } else {
        log = await prisma.webhookLog.create({
            data: {
                merchant_id: merchantId,
                event,
                payload,
                status: 'pending',
                attempts: 0
            }
        });
    }

    const signature = crypto
        .createHmac('sha256', merchant.webhook_secret || '')
        .update(JSON.stringify(payload))
        .digest('hex');

    let responseCode = null;
    let responseBody = null;
    let success = false;

    try {
        const res = await fetch(merchant.webhook_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000) // 5s timeout
        });

        responseCode = res.status;
        responseBody = await res.text();
        success = res.ok;

    } catch (error) {
        responseBody = error.message;
        responseCode = 500; // Client error or timeout
    }

    const currentAttempts = log.attempts + 1;
    const status = success ? 'success' : (currentAttempts >= 5 ? 'failed' : 'pending');
    const nextRetry = (status === 'pending') ? calculateNextRetry(currentAttempts + 1) : null;

    await prisma.webhookLog.update({
        where: { id: log.id },
        data: {
            status,
            attempts: currentAttempts,
            last_attempt_at: new Date(),
            response_code: responseCode,
            response_body: responseBody ? responseBody.substring(0, 1000) : null, // Truncate
            next_retry_at: nextRetry
        }
    });

    if (status === 'pending') {
        // Re-queue
        const delay = nextRetry.getTime() - Date.now();
        await job.queue.add('deliver-webhook', {
            ...job.data,
            logId: log.id,
            retryCount: currentAttempts
        }, { delay: Math.max(0, delay) });
    }
};

module.exports = { deliverWebhook };
