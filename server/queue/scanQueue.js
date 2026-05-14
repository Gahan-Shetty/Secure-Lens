const Bull = require('bull');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse the redis URL manually for Upstash TLS support
function getRedisConfig(url) {
  if (url.startsWith('rediss://')) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 6379,
      password: parsed.password,
      username: parsed.username || 'default',
      tls: {
        rejectUnauthorized: false,
      },
    };
  }
  return url; // local redis — just pass the string
}

const scanQueue = new Bull('scan-queue', {
  redis: getRedisConfig(redisUrl),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

async function addScanJob(data) {
  const job = await scanQueue.add(data);
  console.log(`📋 Scan job added: ${job.id} for ${data.url}`);
  return job;
}

module.exports = { scanQueue, addScanJob };