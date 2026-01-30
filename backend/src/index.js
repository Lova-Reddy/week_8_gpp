const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhooks');
const testRoutes = require('./routes/test');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/refunds', require('./routes/refunds'));
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/test', testRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
