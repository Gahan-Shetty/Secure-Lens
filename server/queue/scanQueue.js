const Bull = require('bull');

const scanQueue = new Bull('scan-queue', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
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
