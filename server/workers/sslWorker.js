const Result = require('../models/Result');

module.exports = async function sslWorker(scanId, url, emit) {
  const results = [];
  emit('scan:log', { message: '[ SSL  ] Starting SSL/TLS check...' });

  try {
    const hostname = new URL(url).hostname;

    // Quick SSL check using a faster alternative to SSL Labs
    emit('scan:log', { message: `[ SSL  ] Checking SSL certificate for ${hostname}...` });

    // Check if site uses HTTPS at all
    const isHttps = url.startsWith('https://');
    if (!isHttps) {
      const result = await Result.create({
        scanId,
        category: 'ssl',
        severity: 'critical',
        title: 'Site Not Using HTTPS',
        description: `${hostname} is served over HTTP, not HTTPS.`,
        explanation: 'HTTP connections are unencrypted. Anyone between the user and server can read and modify the traffic. Browsers now flag HTTP sites as "Not Secure".',
        remediation: 'Install an SSL certificate and redirect all HTTP traffic to HTTPS. Free certificates are available via Let\'s Encrypt (https://letsencrypt.org).',
        rawData: { hostname, protocol: 'http' },
      });
      results.push(result);
      emit('scan:log', { message: '[ SSL  ] ⚠ Site is not using HTTPS!' });
      return results;
    }

    // Try to fetch the site and check basic SSL
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);

      emit('scan:log', { message: `[ SSL  ] ✓ HTTPS connection successful (HTTP ${res.status})` });

      // Check if it redirects from http to https
      const httpUrl = url.replace('https://', 'http://');
      try {
        const httpRes = await fetch(httpUrl, {
          method: 'HEAD',
          redirect: 'manual',
          signal: AbortSignal.timeout(5000),
        });

        if (httpRes.status !== 301 && httpRes.status !== 302) {
          const result = await Result.create({
            scanId,
            category: 'ssl',
            severity: 'medium',
            title: 'HTTP to HTTPS Redirect Not Configured',
            description: `Visiting http://${hostname} does not automatically redirect to HTTPS.`,
            explanation: 'Users who type the URL without https:// will land on an insecure connection. Automatic redirects ensure all traffic is encrypted.',
            remediation: 'Configure your server to redirect all HTTP (port 80) traffic to HTTPS (port 443) with a 301 permanent redirect.',
            rawData: { httpStatus: httpRes.status },
          });
          results.push(result);
          emit('scan:log', { message: '[ SSL  ] ⚠ No HTTP→HTTPS redirect found' });
        } else {
          emit('scan:log', { message: '[ SSL  ] ✓ HTTP redirects to HTTPS correctly' });
        }
      } catch {
        emit('scan:log', { message: '[ SSL  ] ✓ HTTP not accessible (HTTPS only - good!)' });
      }

    } catch (fetchErr) {
      clearTimeout(timeout);
      if (fetchErr.name === 'AbortError') {
        emit('scan:log', { message: '[ SSL  ] ⚠ SSL check timed out' });
      } else {
        throw fetchErr;
      }
    }

    emit('scan:log', { message: `[ SSL  ] ✅ SSL check complete. ${results.length} issues found.` });

  } catch (err) {
    emit('scan:log', { message: `[ SSL  ] ❌ Error: ${err.message}` });
    console.error('[sslWorker error]', err.message);
  }

  return results;
};