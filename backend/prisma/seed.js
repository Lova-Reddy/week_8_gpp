const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const testEmail = 'test@example.com';

    // Upsert test merchant
    const merchant = await prisma.merchant.upsert({
        where: { email: testEmail },
        update: {
            api_key: 'key_test_abc123',
            api_secret: 'secret_test_xyz789',
            webhook_secret: 'whsec_test_abc123'
        },
        create: {
            email: testEmail,
            password: 'hashed_password_placeholder', // hashing omitted for simplicity/test
            name: 'Test Merchant',
            api_key: 'key_test_abc123',
            api_secret: 'secret_test_xyz789',
            webhook_secret: 'whsec_test_abc123'
        },
    });

    console.log({ merchant });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
