import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScanInput from '../components/ScanInput'
import api from '../utils/api'

const FEATURES = [
  { icon: '🔒', label: 'SSL/TLS Audit',     desc: 'Certificate grade, expiry & cipher strength via SSL Labs' },
  { icon: '📋', label: 'Headers Analysis',  desc: 'CSP, HSTS, X-Frame-Options, Referrer-Policy & more' },
  { icon: '🌐', label: 'DNS Recon',         desc: 'WHOIS, DNS records, SPF/DMARC & Shodan port scan' },
  { icon: '🚨', label: 'Breach Check',      desc: 'HaveIBeenPwned + Google Safe Browsing lookup' },
]

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const navigate = useNavigate()

const handleScan = async (url) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/scans', { url })
      // Navigate immediately — socket will connect on report page
      // while scan is still queued/starting
      navigate(`/report/${res.data.scanId}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start scan. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">

      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
          <span className="text-teal-400 text-xs font-mono font-bold tracking-widest uppercase">Passive Scanner — Read Only</span>
        </div>

        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
          Know your site's <span className="text-teal-400">security posture</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
          Enter any URL and get a full vulnerability report with severity ratings,
          plain-language explanations, and exactly how to fix each issue.
        </p>
      </div>

      {/* Scan input */}
      <div className="card mb-4">
        <p className="section-label mb-3">Target URL</p>
        <ScanInput onScan={handleScan} loading={loading} />
        {error && (
          <p className="text-red-400 text-sm mt-3 bg-red-500/10 border border-red-500/20 rounded p-3">
            {error}
          </p>
        )}
      </div>

      <p className="text-center text-gray-600 text-xs mb-16">
        By scanning a URL you confirm you have permission to test it or it is your own domain.
      </p>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((f) => (
          <div key={f.label} className="card flex items-start gap-4 hover:border-gray-700 transition-colors">
            <span className="text-2xl">{f.icon}</span>
            <div>
              <p className="text-white font-semibold text-sm mb-1">{f.label}</p>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
