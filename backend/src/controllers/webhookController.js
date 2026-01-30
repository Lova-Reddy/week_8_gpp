const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const redisConfig = require('../config/redis');
const crypto = require('crypto');

const prisma = new PrismaClient();
const webhookQueue = new Queue('webhook-queue', { connection: redisConfig });

exports.listWebhooks = async (req, res) => {
    const { limit = 10, offset = 0 } = req.query;
    const merchantId = req.merchant.id;

    const logs = await prisma.webhookLog.findMany({
        where: { merchant_id: merchantId },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { created_at: 'desc' }
    });

    const total = await prisma.webhookLog.count({ where: { merchant_id: merchantId } });

    res.json({
        data: logs,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
    });
};

exports.retryWebhook = async (req, res) => {
    const { id } = req.params;
    const merchantId = req.merchant.id;

    const log = await prisma.webhookLog.findUnique({ where: { id } });

    if (!log || log.merchant_id !== merchantId) {
        return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Log not found' } });
    }

    await prisma.webhookLog.update({
        where: { id },
        data: { status: 'pending', attempts: 0 } // Reset attempts to 0 or keep history? Instructions say "Reset attempts to 0"
    });

    await webhookQueue.add('deliver-webhook', {
        merchantId,
        event: log.event,
        payload: log.payload,
        logId: log.id,
        retryCount: 0
    });

    res.json({
        id: log.id,
        status: 'pending',
        message: 'Webhook retry scheduled'
    });
};

exports.updateConfig = async (req, res) => {
    const { webhook_url } = req.body;
    const regenerate_secret = req.body.regenerate_secret;
    const merchantId = req.merchant.id;

    const data = {};
    if (webhook_url !== undefined) data.webhook_url = webhook_url;
    if (regenerate_secret) {
        data.webhook_secret = 'whsec_' + crypto.randomBytes(12).toString('hex');
    }

    const merchant = await prisma.merchant.update({
        where: { id: merchantId },
        data
    });

    res.json({
        webhook_url: merchant.webhook_url,
        webhook_secret: merchant.webhook_secret
    });
};

exports.getConfig = async (req, res) => {
    const merchantId = req.merchant.id;
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });

    res.json({
        webhook_url: merchant.webhook_url,
        webhook_secret: merchant.webhook_secret
    });
};

exports.testWebhook = async (req, res) => {
    // Send a test 'ping' event
    const merchantId = req.merchant.id;

    await webhookQueue.add('deliver-webhook', {
        merchantId,
        event: 'ping',
        payload: {
            message: 'This is a test webhook',
            timestamp: new Date().toISOString()
        }
    });

    res.json({ message: 'Test webhook scheduled' });
};
