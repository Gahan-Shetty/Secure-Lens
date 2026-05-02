const { scanQueue } = require('../queue/scanQueue');
const { getIO } = require('../utils/socket');
const Scan = require('../models/Scan');
const scoreEngine = require('../utils/scoreEngine');

const sslWorker     = require('./sslWorker');
const headersWorker = require('./headersWorker');
const reconWorker   = require('./reconWorker');
const breachWorker  = require('./breachWorker');

scanQueue.process(async (job) => {
  const { scanId, url } = job.data;
  const io = getIO();
  const emit = (event, data) => io.to(scanId).emit(event, data);

  console.log(`🔍 Processing scan ${scanId} for ${url}`);

  try {
    await Scan.findByIdAndUpdate(scanId, { status: 'running' });
    emit('scan:status', { status: 'running' });
    emit('scan:log', { message: `Target locked: ${url}` });
    emit('scan:log', { message: '─────────────────────────────────' });
    emit('scan:log', { message: '[ SSL  ] Checking SSL/TLS certificate...' });
    emit('scan:log', { message: '[ HDR  ] Auditing HTTP security headers...' });
    emit('scan:log', { message: '[ RECON] Running DNS & WHOIS lookup...' });
    emit('scan:log', { message: '[ BREACH] Checking breach exposure...' });
    emit('scan:log', { message: '─────────────────────────────────' });
const scanPromise = Promise.all([
  sslWorker(scanId, url, emit),
  headersWorker(scanId, url, emit),
  reconWorker(scanId, url, emit),
  breachWorker(scanId, url, emit),
]);

const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Scan timed out after 25 seconds')), 25000)
);

const [sslResults, headerResults, reconResults, breachResults] = await Promise.race([
  scanPromise,
  timeoutPromise,
]);
    const allResults = [...sslResults, ...headerResults, ...reconResults, ...breachResults];
    const score = scoreEngine(allResults);

    await Scan.findByIdAndUpdate(scanId, {
      status: 'done',
      score,
      completedAt: new Date(),
    });

    emit('scan:log', { message: `✅ Scan complete. ${allResults.length} findings. Score: ${score}/100` });
    emit('scan:done', { score, resultCount: allResults.length });
    console.log(`✅ Scan ${scanId} complete. Score: ${score}`);

  } catch (err) {
    console.error(`❌ Scan ${scanId} failed:`, err.message);
    await Scan.findByIdAndUpdate(scanId, { status: 'failed' });
    emit('scan:log', { message: `❌ ERROR: ${err.message}` });
    emit('scan:error', { message: err.message });
    throw err; // Let Bull handle retries
  }
});

scanQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed after all retries:`, err.message);
});

console.log('🚀 Scan queue workers are listening...');
