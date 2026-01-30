const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const apiSecret = req.headers['x-api-secret'];

    if (!apiKey || !apiSecret) {
        return res.status(401).json({ error: { code: 'AUTHENTICATION_ERROR', description: 'Missing API credentials' } });
    }

    try {
        const merchant = await prisma.merchant.findUnique({
            where: { api_key: apiKey },
        });

        if (!merchant || merchant.api_secret !== apiSecret) {
            return res.status(401).json({ error: { code: 'AUTHENTICATION_ERROR', description: 'Invalid API credentials' } });
        }

        req.merchant = merchant;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Internal Server Error' } });
    }
};

module.exports = authenticate;
