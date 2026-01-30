const Redis = require('ioredis');

const connection = {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
};

if (process.env.REDIS_URL) {
    // Parse URL if needed, but ioredis handles it or we can pass it directly 
    // However, BullMQ expects connection object
    // Simple parsing for docker-compose service name resolution
    const url = new URL(process.env.REDIS_URL);
    connection.host = url.hostname;
    connection.port = url.port;
}

module.exports = connection;
