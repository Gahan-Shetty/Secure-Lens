const Result = require('../models/Result');

module.exports = async function breachWorker(scanId, url, emit) {
  const results = [];
  emit('scan:log', { message: '[ BREACH] Checking breach & reputation databases...' });

  try {
    const hostname = new URL(url).hostname;
    const domain = hostname.replace(/^www\./, '');

    // ── HaveIBeenPwned domain search ───────────────────────────────────────
    if (process.env.HIBP_API_KEY) {
      emit('scan:log', { message: `[ BREACH] Querying HaveIBeenPwned for ${domain}...` });
      try {
        const hibpRes = await fetch(
          `https://haveibeenpwned.com/api/v3/breaches?domain=${domain}`,
          {
            headers: {
              'hibp-api-key': process.env.HIBP_API_KEY,
              'user-agent': 'SecureLens-Scanner',
            },
            signal: AbortSignal.timeout(10000),
          }
        );

        if (hibpRes.ok) {
          const breaches = await hibpRes.json();
          if (breaches.length > 0) {
            emit('scan:log', { message: `[ BREACH] ⚠ ${breaches.length} breach(es) found for ${domain}` });
            const breachNames = breaches.map(b => b.Name).join(', ');
            const latestBreach = breaches.sort((a, b) => new Date(b.BreachDate) - new Date(a.BreachDate))[0];

            const result = await Result.create({
              scanId,
              category: 'breach',
              severity: breaches.length >= 3 ? 'critical' : 'high',
              title: `Domain Found in ${breaches.length} Data Breach(es)`,
              description: `${domain} appears in the following known data breaches: ${breachNames}. Most recent: ${latestBreach.Name} (${latestBreach.BreachDate}).`,
              explanation: 'Data breaches expose user credentials (emails, passwords) that attackers use for credential stuffing — trying leaked passwords across other services. Even old breaches remain dangerous.',
              remediation: 'Force password resets for all users. Enable MFA. Review and patch the vulnerability that caused the breach. Notify affected users per data protection regulations (GDPR etc.).',
              rawData: {
                breachCount: breaches.length,
                breaches: breaches.map(b => ({
                  name: b.Name,
                  date: b.BreachDate,
                  dataClasses: b.DataClasses,
                  pwnCount: b.PwnCount,
                })),
              },
            });
            results.push(result);
          } else {
            emit('scan:log', { message: `[ BREACH] ✓ No breaches found for ${domain}` });
          }
        } else if (hibpRes.status === 404) {
          emit('scan:log', { message: `[ BREACH] ✓ No breaches found for ${domain}` });
        } else {
          emit('scan:log', { message: `[ BREACH] HIBP returned status ${hibpRes.status}` });
        }
      } catch (hibpErr) {
        emit('scan:log', { message: `[ BREACH] HIBP error: ${hibpErr.message}` });
      }
    } else {
      emit('scan:log', { message: '[ BREACH] ⚠ No HIBP API key — skipping breach check.' });
    }

    // ── Google Safe Browsing ───────────────────────────────────────────────
    if (process.env.GOOGLE_SAFE_BROWSING_KEY) {
      emit('scan:log', { message: `[ BREACH] Checking Google Safe Browsing...` });
      try {
        const gsbRes = await fetch(
          `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client: { clientId: 'securelens', clientVersion: '1.0.0' },
              threatInfo: {
                threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
                platformTypes: ['ANY_PLATFORM'],
                threatEntryTypes: ['URL'],
                threatEntries: [{ url }],
              },
            }),
            signal: AbortSignal.timeout(10000),
          }
        );

        const gsbData = await gsbRes.json();
        if (gsbData.matches && gsbData.matches.length > 0) {
          const threatTypes = [...new Set(gsbData.matches.map(m => m.threatType))].join(', ');
          emit('scan:log', { message: `[ BREACH] ⚠ FLAGGED by Google Safe Browsing: ${threatTypes}` });

          const result = await Result.create({
            scanId,
            category: 'breach',
            severity: 'critical',
            title: `Site Flagged by Google Safe Browsing`,
            description: `Google Safe Browsing has flagged this URL for: ${threatTypes}`,
            explanation: 'Google Safe Browsing protects billions of users. Being flagged means Chrome, Firefox, and Safari will warn visitors before loading your site, causing massive traffic loss and reputational damage.',
            remediation: 'Remove all malware/phishing content immediately. Submit a review request via Google Search Console. Ensure your CMS and plugins are up to date.',
            rawData: { matches: gsbData.matches },
          });
          results.push(result);
        } else {
          emit('scan:log', { message: '[ BREACH] ✓ Not flagged by Google Safe Browsing.' });
        }
      } catch (gsbErr) {
        emit('scan:log', { message: `[ BREACH] GSB error: ${gsbErr.message}` });
      }
    } else {
      emit('scan:log', { message: '[ BREACH] ⚠ No Google Safe Browsing key — skipping.' });
    }

    emit('scan:log', { message: `[ BREACH] ✅ Breach check complete. ${results.length} issues found.` });
  } catch (err) {
    emit('scan:log', { message: `[ BREACH] ❌ Error: ${err.message}` });
    console.error('[breachWorker error]', err.message);
  }

  return results;
};
