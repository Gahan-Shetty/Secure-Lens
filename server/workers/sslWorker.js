const Result = require('../models/Result');

module.exports = async function sslWorker(scanId, url, emit) {
  const results = [];
  emit('scan:log', { message: '[ SSL  ] Starting SSL Labs analysis (this may take ~60s)...' });

  try {
    const hostname = new URL(url).hostname;

    // SSL Labs API — free, no key required, but slow
    const apiUrl = `https://api.ssllabs.com/api/v3/analyze?host=${hostname}&all=done&ignoreMismatch=on`;

    let data;
    let attempts = 0;
    const maxAttempts = 18; // 18 × 10s = 3 min max

    while (attempts < maxAttempts) {
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
      data = await res.json();
      attempts++;

      emit('scan:log', { message: `[ SSL  ] Status: ${data.status} (attempt ${attempts}/${maxAttempts})` });

      if (data.status === 'READY' || data.status === 'ERROR') break;
      await new Promise(r => setTimeout(r, 10000));
    }

    if (!data || data.status === 'ERROR' || !data.endpoints?.length) {
      emit('scan:log', { message: '[ SSL  ] ⚠ SSL Labs scan could not complete.' });
      return results;
    }

    for (const endpoint of data.endpoints) {
      const grade = endpoint.grade || 'Unknown';
      emit('scan:log', { message: `[ SSL  ] Grade for ${endpoint.ipAddress}: ${grade}` });

      const severity =
        ['A+', 'A'].includes(grade) ? 'info' :
        grade === 'B'               ? 'low'  :
        grade === 'C'               ? 'medium' :
        ['D', 'E'].includes(grade) ? 'high' : 'critical';

      const explanation =
        grade === 'A+' ? 'Outstanding SSL configuration. Certificate, protocols, and ciphers are all best-practice.' :
        grade === 'A'  ? 'Good SSL configuration. Minor improvements possible (e.g. enabling HSTS preload).' :
        grade === 'B'  ? 'Acceptable but improvable. May be using older TLS versions or weaker cipher suites.' :
        grade === 'C'  ? 'Weak SSL configuration. Likely supporting outdated protocols like TLS 1.0 or 1.1.' :
        'Poor or broken SSL configuration. Vulnerable to known attacks. Immediate action required.';

      const result = await Result.create({
        scanId,
        category: 'ssl',
        severity,
        title: `SSL/TLS Grade: ${grade} — ${endpoint.ipAddress}`,
        description: `The SSL Labs scan assigned a grade of ${grade} to this endpoint.`,
        explanation,
        remediation: 'Disable TLS 1.0 and 1.1. Use only TLS 1.2 and 1.3. Disable RC4, 3DES, and NULL ciphers. Enable HSTS. Ensure your certificate chain is complete and not expired.',
        rawData: {
          grade,
          ipAddress: endpoint.ipAddress,
          hasWarnings: endpoint.hasWarnings,
          isExceptional: endpoint.isExceptional,
        },
      });
      results.push(result);
    }

    emit('scan:log', { message: `[ SSL  ] ✅ SSL check complete.` });
  } catch (err) {
    emit('scan:log', { message: `[ SSL  ] ❌ Error: ${err.message}` });
    console.error('[sslWorker error]', err.message);
  }

  return results;
};
