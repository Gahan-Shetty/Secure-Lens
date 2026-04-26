const Result = require('../models/Result');

module.exports = async function reconWorker(scanId, url, emit) {
  const results = [];
  emit('scan:log', { message: '[ RECON] Starting DNS & WHOIS reconnaissance...' });

  try {
    const hostname = new URL(url).hostname;

    // ── Shodan lookup ──────────────────────────────────────────────────────
    if (process.env.SHODAN_API_KEY) {
      emit('scan:log', { message: `[ RECON] Querying Shodan for ${hostname}...` });
      try {
        const shodanRes = await fetch(
          `https://api.shodan.io/dns/resolve?hostnames=${hostname}&key=${process.env.SHODAN_API_KEY}`,
          { signal: AbortSignal.timeout(10000) }
        );
        const shodanDns = await shodanRes.json();
        const ip = shodanDns[hostname];

        if (ip) {
          emit('scan:log', { message: `[ RECON] Resolved IP: ${ip}` });

          // Get host info from Shodan
          const hostRes = await fetch(
            `https://api.shodan.io/shodan/host/${ip}?key=${process.env.SHODAN_API_KEY}`,
            { signal: AbortSignal.timeout(10000) }
          );

          if (hostRes.ok) {
            const hostData = await hostRes.json();
            const openPorts = hostData.ports || [];

            emit('scan:log', { message: `[ RECON] Open ports: ${openPorts.join(', ') || 'none found'}` });

            // Flag sensitive open ports
            const sensitivePorts = openPorts.filter(p => [21, 22, 23, 3306, 5432, 27017, 6379, 8080, 8443].includes(p));
            if (sensitivePorts.length > 0) {
              const result = await Result.create({
                scanId,
                category: 'recon',
                severity: 'medium',
                title: `Sensitive Ports Exposed: ${sensitivePorts.join(', ')}`,
                description: `Shodan detected these potentially sensitive ports open on ${ip}: ${sensitivePorts.join(', ')}`,
                explanation: 'Exposed database ports (MySQL: 3306, MongoDB: 27017, Redis: 6379) or admin ports can be brute-forced or exploited if not properly firewalled.',
                remediation: 'Use a firewall (e.g. ufw, AWS Security Groups) to restrict access to sensitive ports. Only expose ports that need to be public (80, 443).',
                rawData: { ip, openPorts, sensitivePorts, org: hostData.org },
              });
              results.push(result);
            }

            // Check for running services/vulnerabilities from Shodan
            if (hostData.vulns && Object.keys(hostData.vulns).length > 0) {
              const vulnList = Object.keys(hostData.vulns).slice(0, 5);
              const result = await Result.create({
                scanId,
                category: 'recon',
                severity: 'critical',
                title: `Known CVEs Detected by Shodan`,
                description: `Shodan identified these CVEs associated with services on ${ip}: ${vulnList.join(', ')}`,
                explanation: 'These are publicly known vulnerabilities in the software versions running on this server. Attackers actively scan for and exploit these.',
                remediation: 'Update all server software to the latest patched versions immediately. Run: apt upgrade or equivalent for your OS.',
                rawData: { vulns: hostData.vulns, ip },
              });
              results.push(result);
            }
          }
        }
      } catch (shodanErr) {
        emit('scan:log', { message: `[ RECON] Shodan error: ${shodanErr.message}` });
      }
    } else {
      emit('scan:log', { message: '[ RECON] ⚠ No Shodan API key — skipping port scan.' });
    }

    // ── DNS over HTTPS lookup ──────────────────────────────────────────────
    emit('scan:log', { message: '[ RECON] Checking DNS records...' });
    try {
      const dnsRes = await fetch(
        `https://dns.google/resolve?name=${hostname}&type=ANY`,
        { signal: AbortSignal.timeout(8000) }
      );
      const dnsData = await dnsRes.json();
      const answers = dnsData.Answer || [];

      // Check for SPF record
      const hasSPF = answers.some(a => a.data?.includes('v=spf1'));
      if (!hasSPF) {
        emit('scan:log', { message: '[ RECON] ⚠ No SPF record found' });
        const result = await Result.create({
          scanId,
          category: 'recon',
          severity: 'medium',
          title: 'Missing SPF DNS Record',
          description: `No SPF (Sender Policy Framework) record was found for ${hostname}.`,
          explanation: 'Without an SPF record, attackers can send emails that appear to come from your domain (email spoofing), damaging your reputation and enabling phishing attacks.',
          remediation: 'Add a TXT record to your DNS: v=spf1 include:your-mail-provider.com ~all',
          rawData: { hostname, dnsAnswers: answers.slice(0, 10) },
        });
        results.push(result);
      }

      // Check for DMARC
      const dmarcRes = await fetch(
        `https://dns.google/resolve?name=_dmarc.${hostname}&type=TXT`,
        { signal: AbortSignal.timeout(8000) }
      );
      const dmarcData = await dmarcRes.json();
      const hasDMARC = (dmarcData.Answer || []).some(a => a.data?.includes('v=DMARC1'));

      if (!hasDMARC) {
        emit('scan:log', { message: '[ RECON] ⚠ No DMARC record found' });
        const result = await Result.create({
          scanId,
          category: 'recon',
          severity: 'medium',
          title: 'Missing DMARC DNS Record',
          description: `No DMARC record was found at _dmarc.${hostname}.`,
          explanation: 'DMARC tells mail servers what to do when they receive email that fails SPF/DKIM checks. Without it, spoofed emails may reach inboxes.',
          remediation: 'Add a TXT record at _dmarc.yourdomain.com: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com',
          rawData: { hostname },
        });
        results.push(result);
      }

      emit('scan:log', { message: '[ RECON] DNS check complete.' });
    } catch (dnsErr) {
      emit('scan:log', { message: `[ RECON] DNS error: ${dnsErr.message}` });
    }

    emit('scan:log', { message: `[ RECON] ✅ Recon complete. ${results.length} issues found.` });
  } catch (err) {
    emit('scan:log', { message: `[ RECON] ❌ Error: ${err.message}` });
    console.error('[reconWorker error]', err.message);
  }

  return results;
};
