# Payment Gateway Project

## Setup

1. **Prerequisites**: Docker and Docker Compose.
2. **Build and Run**:
   ```bash
   docker-compose up --build -d
   ```
3. **Initialize DB**:
   ```bash
   docker-compose exec api npx prisma migrate deploy
   docker-compose exec api npx prisma db seed
   ```

## Services

- **API**: `http://localhost:8000`
- **Dashboard**: `http://localhost:3000`
- **Checkout**: `http://localhost:3001`
- **Redis**: `localhost:6379`
- **Postgres**: `localhost:5432`

## Documentation

- **API Docs**: Visit `http://localhost:3000/docs`
- **Webhook Config**: Visit `http://localhost:3000/webhooks`

## Architecture

- **Backend**: Node.js/Express with BullMQ for queues.
- **Worker**: Separate process consuming Redis queues.
- **Frontend**: React Dashboard.
- **Checkout**: Serves SDK and secure Iframe.

## Credentials

Test Merchant seeded with:
- **API Key**: `key_test_abc123`
- **API Secret**: `secret_test_xyz789`
- **Webhook Secret**: `whsec_test_abc123`
