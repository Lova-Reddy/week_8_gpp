import React from 'react';

const ApiDocs = () => {
    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" data-testid="api-docs">
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate mb-6">Integration Guide</h2>

                <section className="mb-8" data-testid="section-create-order">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">1. Create Order</h3>
                    <p className="mb-2 text-gray-600">Create an order on your backend.</p>
                    <pre className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto" data-testid="code-snippet-create-order">
                        <code>
                            {`curl -X POST http://localhost:8000/api/v1/payments \\
  -H "X-Api-Key: key_test_abc123" \\
  -H "X-Api-Secret: secret_test_xyz789" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "currency": "INR",
    "method": "upi",
    "order_id": "order_123",
    "vpa": "test@upi"
  }'`}
                        </code>
                    </pre>
                </section>

                <section className="mb-8" data-testid="section-sdk-integration">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">2. SDK Integration</h3>
                    <p className="mb-2 text-gray-600">Include the SDK in your checkout page.</p>
                    <pre className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto" data-testid="code-snippet-sdk">
                        <code>
                            {`<script src="http://localhost:3001/checkout.js"></script>
<script>
  const checkout = new PaymentGateway({
    key: 'key_test_abc123',
    orderId: 'order_123',
    onSuccess: (response) => {
      console.log('Payment ID:', response.paymentId);
    },
    onFailure: (error) => {
        console.error('Payment Failed:', error);
    }
  });
  checkout.open();
</script>`}
                        </code>
                    </pre>
                </section>

                <section data-testid="section-webhook-verification">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">3. Verify Webhook Signature</h3>
                    <p className="mb-2 text-gray-600">Verify the signature sent in `X-Webhook-Signature` header.</p>
                    <pre className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto" data-testid="code-snippet-webhook">
                        <code>
                            {`const crypto = require('crypto');
function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}`}
                        </code>
                    </pre>
                </section>
            </div>
        </div>
    );
};

export default ApiDocs;
