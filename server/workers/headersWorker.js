const Result = require('../models/Result');

const HEADERS_CONFIG = {
  'content-security-policy': {
    title: 'Missing Content-Security-Policy Header',
    severity: 'high',
    explanation: 'CSP tells the browser which sources are trusted to load scripts, styles, and other content. Without it, attackers can inject and run malicious scripts on your page (XSS attacks).',
    remediation: "Add to your server: Content-Security-Policy: default-src 'self'. Customize to allow your CDN/fonts as needed.",
  },
  'strict-transport-security': {
    title: 'Missing Strict-Transport-Security (HSTS) Header',
    severity: 'high',
    explanation: 'HSTS forces browsers to always use HTTPS when visiting your site. Without it, users can be silently downgraded to HTTP and have their traffic intercepted (man-in-the-middle attacks).',
    remediation: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
  },
  'x-frame-options': {
    title: 'Missing X-Frame-Options Header',
    severity: 'medium',
    explanation: "Without this header, attackers can embed your website inside an invisible iframe on a malicious page, tricking users into clicking things they didn't intend to (clickjacking).",
    remediation: 'Add: X-Frame-Options: DENY (or SAMEORIGIN if you need iframes on your own domain).',
  },
  'x-content-type-options': {
    title: 'Missing X-Content-Type-Options Header',
    severity: 'low',
    explanation: 'Without this, some browsers try to guess the file type (MIME sniffing), which can lead to executing files as the wrong type — a potential attack vector.',
    remediation: 'Add: X-Content-Type-Options: nosniff',
  },
  'referrer-policy': {
    title: 'Missing Referrer-Policy Header',
    severity: 'low',
    explanation: 'Without a Referrer-Policy, your full page URLs (including sensitive paths or query parameters) may be sent to third-party sites via the Referer header.',
    remediation: 'Add: Referrer-Policy: strict-origin-when-cross-origin',
  },
  'permissions-policy': {
    title: 'Missing Permissions-Policy Header',
    severity: 'info',
    explanation: "This header lets you control which browser APIs (camera, microphone, geolocation) your page can access. Without it, any injected script could potentially access these features.",
    remediation: 'Add a Permissions-Policy header disabling features your site does not use. E.g.: Permissions-Policy: camera=(), microphone=(), geolocation=()',
  },
};

module.exports = async function headersWorker(scanId, url, emit) {
  const results = [];
  emit('scan:log', { message: '[ HDR  ] Fetching response headers...' });

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    const headers = response.headers;
    emit('scan:log', { message: `[ HDR  ] Got response: HTTP ${response.status}` });

    // Check required security headers
    for (const [headerName, config] of Object.entries(HEADERS_CONFIG)) {
      if (!headers.get(headerName)) {
        emit('scan:log', { message: `[ HDR  ] ⚠ Missing: ${headerName}` });
        const result = await Result.create({
          scanId,
          category: 'headers',
          severity: config.severity,
          title: config.title,
          description: `The "${headerName}" header was not present in the server's HTTP response.`,
          explanation: config.explanation,
          remediation: config.remediation,
          rawData: { checkedHeader: headerName, responseStatus: response.status },
        });
        results.push(result);
      } else {
        emit('scan:log', { message: `[ HDR  ] ✓ Found: ${headerName}` });
      }
    }

    // Check for server version disclosure
    const serverHeader = headers.get('server');
    if (serverHeader && /[\d.]/.test(serverHeader)) {
      emit('scan:log', { message: `[ HDR  ] ⚠ Server version exposed: ${serverHeader}` });
      const result = await Result.create({
        scanId,
        category: 'headers',
        severity: 'low',
        title: 'Server Header Discloses Software Version',
        description: `The Server response header reveals: "${serverHeader}"`,
        explanation: 'Disclosing your web server name and version helps attackers quickly find and target known vulnerabilities for that specific version.',
        remediation: 'Configure your web server to remove or replace the Server header. In nginx: server_tokens off; In Apache: ServerTokens Prod',
        rawData: { serverHeader },
      });
      results.push(result);
    }

    // Check for X-Powered-By leak
    const poweredBy = headers.get('x-powered-by');
    if (poweredBy) {
      emit('scan:log', { message: `[ HDR  ] ⚠ X-Powered-By exposed: ${poweredBy}` });
      const result = await Result.create({
        scanId,
        category: 'headers',
        severity: 'low',
        title: 'X-Powered-By Header Leaks Technology Stack',
        description: `The X-Powered-By header reveals: "${poweredBy}"`,
        explanation: 'Exposing your backend technology helps attackers target framework-specific vulnerabilities.',
        remediation: 'Remove the X-Powered-By header. In Express.js: app.disable("x-powered-by")',
        rawData: { poweredBy },
      });
      results.push(result);
    }

    emit('scan:log', { message: `[ HDR  ] ✅ Headers audit complete. ${results.length} issues found.` });
  } catch (err) {
    emit('scan:log', { message: `[ HDR  ] ❌ Error: ${err.message}` });
    console.error('[headersWorker error]', err.message);
  }

  return results;
};
