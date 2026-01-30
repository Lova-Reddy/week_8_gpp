const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const { v4: uuidv4 } = require('uuid');
const redisConfig = require('../config/redis');

const prisma = new PrismaClient();
const paymentQueue = new Queue('payment-queue', { connection: redisConfig });
const refundQueue = new Queue('refund-queue', { connection: redisConfig });

// Helper to generate IDs
const generateId = (prefix) => `${prefix}_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

exports.createPayment = async (req, res) => {
    const { amount, currency, method, vpa, order_id } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];
    const merchantId = req.merchant.id;

    // Idempotency Check
    if (idempotencyKey) {
        const keyRecord = await prisma.idempotencyKey.findUnique({
            where: { key_merchant_id: { key: idempotencyKey, merchant_id: merchantId } }
        });

        if (keyRecord) {
            if (new Date() < keyRecord.expires_at) {
                return res.status(keyRecord.response.statusCode || 201).json(keyRecord.response.body);
            } else {
                await prisma.idempotencyKey.delete({ where: { key_merchant_id: { key: idempotencyKey, merchant_id: merchantId } } });
            }
        }
    }

    // Validation
    if (!amount || !currency || !method || !order_id) {
        return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Missing required fields' } });
    }

    const id = generateId('pay');
    const payment = await prisma.payment.create({
        data: {
            id,
            merchant_id: merchantId,
            amount,
            currency,
            method,
            vpa,
            order_id,
            status: 'pending'
        }
    });

    await paymentQueue.add('process-payment', { paymentId: id });

    const responseBody = {
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        vpa: payment.vpa,
        status: payment.status,
        created_at: payment.created_at
    };

    // Save Idempotency
    if (idempotencyKey) {
        await prisma.idempotencyKey.create({
            data: {
                key: idempotencyKey,
                merchant_id: merchantId,
                response: { statusCode: 201, body: responseBody },
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        });
    }

    res.status(201).json(responseBody);
};

exports.capturePayment = async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;
    const merchantId = req.merchant.id;

    const payment = await prisma.payment.findUnique({ where: { id } });

    if (!payment || payment.merchant_id !== merchantId) {
        return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Payment not found' } });
    }

    if (payment.status !== 'success') {
        return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Payment not in capturable state' } });
    }

    if (payment.captured) {
        return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Payment already captured' } });
    }

    // For simplicity, we assume capture amount matches authorized amount or logic allows partial, but specs say just update captured field
    await prisma.payment.update({
        where: { id },
        data: { captured: true, updated_at: new Date() }
    });

    res.json({
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        captured: true,
        created_at: payment.created_at,
        updated_at: new Date() // Ideally from DB result
    });
};

exports.createRefund = async (req, res) => {
    const { id: paymentId } = req.params;
    const { amount, reason } = req.body;
    const merchantId = req.merchant.id;

    const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { refunds: true } });

    if (!payment || payment.merchant_id !== merchantId) {
        return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Payment not found' } });
    }

    if (payment.status !== 'success') {
        return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Payment not successful' } });
    }

    const alreadyRefunded = payment.refunds.reduce((acc, r) => acc + r.amount, 0);
    if (amount > (payment.amount - alreadyRefunded)) {
        return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Refund amount exceeds available amount' } });
    }

    const refundId = generateId('rfnd');
    const refund = await prisma.refund.create({
        data: {
            id: refundId,
            payment_id: paymentId,
            merchant_id: merchantId,
            amount,
            reason,
            status: 'pending'
        }
    });

    await refundQueue.add('process-refund', { refundId });

    res.status(201).json({
        id: refund.id,
        payment_id: refund.payment_id,
        amount: refund.amount,
        reason: refund.reason,
        status: refund.status,
        created_at: refund.created_at
    });
};

exports.getRefund = async (req, res) => {
    const { id } = req.params;
    const merchantId = req.merchant.id;

    const refund = await prisma.refund.findUnique({ where: { id } });
    if (!refund || refund.merchant_id !== merchantId) {
        return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Refund not found' } });
    }

    res.json({
        id: refund.id,
        payment_id: refund.payment_id,
        amount: refund.amount,
        reason: refund.reason,
        status: refund.status,
        created_at: refund.created_at,
        processed_at: refund.processed_at
    });
};
