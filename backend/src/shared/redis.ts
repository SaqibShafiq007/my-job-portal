// src/shared/redis.ts
import { createClient } from 'redis';
import { config } from './config';

const redis = createClient({
  url: config.REDIS_URL,
  RESP: 2, // force RESP2 protocol, avoids HELLO handshake issues
});

redis.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redis.connect().catch((err) => {
  console.error('Failed to connect to Redis', err);
  process.exit(1);
});

export default redis;