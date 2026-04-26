import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

const STATUS_CONFIG = {
  done:    { label: 'Done',    color: 'text-teal-400',   bg: 'bg-teal-500/10'  },
  running: { label: 'Running', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  queued:  { label: 'Queued',  color: 'text-gray-400',   bg: 'bg-gray-500/10'  },
  failed:  { label: 'Failed',  color: 'text-red-400',    bg: 'bg-red-500/10'   },
}

function ScorePill({ score }) {
  if (score === null || score === undefined) return <span className="text-gray-600 text-sm">—</span>
  const color =
    score >= 80 ? 'text-teal-400' :
    score >= 60 ? 'text-yellow-400' :
    score >= 40 ? 'text-orange-400' : 'text-red-400'
  return <span className={`font-bold font-mono text-sm ${color}`}>{score}/100</span>
}

export default function History() {
  const [scans, setScans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get('/scans')
      .then(res => setScans(res.data))
      .catch(() => setError('Failed to load scan history.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-label mb-1">Scan history</p>
          <h1 className="text-2xl font-bold text-white">Past Scans</h1>
        </div>
        <Link to="/" className="btn-primary text-sm">+ New Scan</Link>
      </div>

      {error && (
        <div className="card border-red-500/30 text-red-400 text-sm mb-6">{error}</div>
      )}

      {scans.length === 0 && !error ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-white font-semibold mb-2">No scans yet</p>
          <p className="text-gray-500 text-sm mb-6">Run your first scan to see results here.</p>
          <Link to="/" className="btn-primary inline-block">Scan a URL</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map(scan => {
            const cfg = STATUS_CONFIG[scan.status] || STATUS_CONFIG.queued
            const date = new Date(scan.startedAt).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })
            return (
              <div
                key={scan._id}
                className="card flex items-center justify-between gap-4 hover:border-gray-700 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-white font-mono text-sm truncate">{scan.url}</p>
                  <p className="text-gray-600 text-xs mt-1">{date}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <ScorePill score={scan.score} />

                  <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>

                  {scan.status === 'done' && (
                    <Link
                      to={`/report/${scan._id}`}
                      className="text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors"
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
