import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useScanSocket } from '../hooks/useScanSocket'
import LiveTerminal from '../components/LiveTerminal'
import ScoreGauge  from '../components/ScoreGauge'
import VulnCard    from '../components/VulnCard'
import api         from '../utils/api'

const CATEGORIES = [
  { key: 'ssl',     label: '🔒 SSL/TLS',       desc: 'Certificate & encryption checks' },
  { key: 'headers', label: '📋 HTTP Headers',  desc: 'Security response header audit' },
  { key: 'recon',   label: '🌐 Recon',          desc: 'DNS, WHOIS & port exposure' },
  { key: 'breach',  label: '🚨 Breach',         desc: 'Data breach & reputation check' },
]

export default function Report() {
  const { scanId } = useParams()
  const { logs, status, score } = useScanSocket(scanId)

  const [results, setResults]   = useState(null)
  const [grouped, setGrouped]   = useState(null)
  const [scan, setScan]         = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
  // Fetch scan status first on page load
  const fetchScanAndResults = async () => {
    try {
      const scanRes = await api.get(`/scans/${scanId}`)
      const scanData = scanRes.data

      // If already done, fetch results immediately
      if (scanData.status === 'done' || scanData.status === 'failed') {
        setFetching(true)
        const res = await api.get(`/results/${scanId}`)
        setResults(res.data.results)
        setGrouped(res.data.grouped)
        setScan(res.data.scan)
        setFetching(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  fetchScanAndResults()
}, [scanId])


  // Fetch results when scan completes
  useEffect(() => {
    if (status === 'done' && !results) {
      setFetching(true)
      api.get(`/results/${scanId}`)
        .then(res => {
          setResults(res.data.results)
          setGrouped(res.data.grouped)
          setScan(res.data.scan)
        })
        .catch(console.error)
        .finally(() => setFetching(false))
    }
  }, [status, scanId, results])

  const displayResults =
    activeTab === 'all' ? results :
    grouped?.[activeTab] ?? []

  const severityCounts = results ? {
    critical: results.filter(r => r.severity === 'critical').length,
    high:     results.filter(r => r.severity === 'high').length,
    medium:   results.filter(r => r.severity === 'medium').length,
    low:      results.filter(r => r.severity === 'low').length,
    info:     results.filter(r => r.severity === 'info').length,
  } : null

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">

      {/* Back link */}
      <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1 mb-8 w-fit">
        ← New scan
      </Link>

      {/* Target URL */}
      {scan && (
        <div className="mb-6">
          <p className="section-label mb-1">Scanning target</p>
          <p className="text-white font-mono text-lg">{scan.url}</p>
        </div>
      )}

      {/* Live terminal — show while running */}
      {(status === 'running' || status === 'queued' || status === 'done' || logs.length > 0) && (
        <div className="mb-8">
          <p className="section-label mb-3">Live output</p>
          <LiveTerminal logs={logs} status={status} />
        </div>
      )}

      {/* Loading results */}
      {fetching && (
        <div className="flex items-center gap-3 text-gray-400 py-8 justify-center">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          Loading results...
        </div>
      )}

      {/* Results section */}
      {results && (
        <>
          {/* Score + summary row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Score gauge */}
            <div className="card flex items-center justify-center py-6">
              <ScoreGauge score={score ?? scan?.score ?? 0} />
            </div>

            {/* Severity breakdown */}
            <div className="card md:col-span-2">
              <p className="section-label mb-4">Findings by severity</p>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { key: 'critical', label: 'Critical', color: 'text-red-400',    bg: 'bg-red-500/10' },
                  { key: 'high',     label: 'High',     color: 'text-orange-400', bg: 'bg-orange-500/10' },
                  { key: 'medium',   label: 'Medium',   color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                  { key: 'low',      label: 'Low',      color: 'text-blue-400',   bg: 'bg-blue-500/10' },
                  { key: 'info',     label: 'Info',     color: 'text-gray-400',   bg: 'bg-gray-500/10' },
                ].map(s => (
                  <div key={s.key} className={`rounded-lg p-3 text-center ${s.bg}`}>
                    <p className={`text-2xl font-bold ${s.color}`}>{severityCounts[s.key]}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-gray-500 text-sm">
                  <span className="text-white font-bold">{results.length}</span> total findings across{' '}
                  <span className="text-white font-bold">4</span> scan categories.
                  {severityCounts.critical > 0 && (
                    <span className="text-red-400"> {severityCounts.critical} critical issue{severityCounts.critical > 1 ? 's' : ''} require immediate attention.</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-teal-500 text-gray-950'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              All ({results.length})
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === cat.key
                    ? 'bg-teal-500 text-gray-950'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {cat.label} ({grouped?.[cat.key]?.length ?? 0})
              </button>
            ))}
          </div>

          {/* Finding cards */}
          <div>
            {displayResults?.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <p className="text-3xl mb-2">✅</p>
                <p>No issues found in this category.</p>
              </div>
            ) : (
              displayResults?.map(result => (
                <VulnCard key={result._id} result={result} />
              ))
            )}
          </div>
        </>
      )}

      {/* Failed state */}
      {status === 'failed' && !results && (
        <div className="card border-red-500/30 text-center py-12">
          <p className="text-3xl mb-3">❌</p>
          <p className="text-red-400 font-semibold mb-2">Scan failed</p>
          <p className="text-gray-500 text-sm mb-6">The scan could not complete. The target may be unreachable.</p>
          <Link to="/" className="btn-secondary inline-block">Try another URL</Link>
        </div>
      )}
    </main>
  )
}
