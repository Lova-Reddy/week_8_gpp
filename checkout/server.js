const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.static('dist')); // Serve checkout.js
app.use(express.static('src/iframe')); // Serve index.html

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Simple in-memory or direct DB access? 
// Instructions: "Checkout service... Port 3001".
// It matches "Build the SDK into a single checkout.js... Serve it as a static file...".
// It doesn't explicitly say Checkout Service has backend logic, but to be secure it must.
// Using 'pg' to query DB directly for simplicity.

const { Client } = require('pg');
const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://gateway_user:gateway_password@postgres:5432/payment_gateway'
});
client.connect().catch(e => console.error('DB Connect Error', e.stack));

app.use(express.json());

app.post('/api/pay', async (req, res) => {
    const { key, order_id, amount, currency, method, vpa } = req.body;

    try {
        const result = await client.query('SELECT * FROM merchants WHERE api_key = $1', [key]);
        const merchant = result.rows[0];

        if (!merchant) {
            return res.status(401).json({ error: 'Invalid API Key' });
        }

        // Call Core API
        // In docker-compose, 'api' service is at 'http://api:8000'
        const coreApiUrl = process.env.CORE_API_URL || 'http://api:8000/api/v1';

        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

        const apiRes = await fetch(`${coreApiUrl}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': key,
                'X-Api-Secret': merchant.api_secret
            },
            body: JSON.stringify({
                amount,
                currency,
                method,
                vpa,
                order_id
            })
        });

        const data = await apiRes.json();
        res.status(apiRes.status).json(data);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Checkout service running on port ${PORT}`);
});
