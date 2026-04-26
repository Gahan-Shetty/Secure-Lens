import { useState } from 'react'
import SeverityBadge from './SeverityBadge'

export default function VulnCard({ result }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg mb-3 hover:border-gray-700 transition-colors">
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <SeverityBadge severity={result.severity} />
          <span className="text-white text-sm font-medium truncate">{result.title}</span>
        </div>
        <span className="text-gray-600 text-xs shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {/* Expanded details */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-4">
          {/* What was found */}
          <div>
            <p className="section-label mb-1">What was found</p>
            <p className="text-gray-300 text-sm leading-relaxed">{result.description}</p>
          </div>

          {/* Why it matters */}
          <div>
            <p className="section-label mb-1">Why it matters</p>
            <p className="text-gray-300 text-sm leading-relaxed">{result.explanation}</p>
          </div>

          {/* How to fix */}
          <div className="bg-teal-950/40 border border-teal-500/20 rounded-lg p-3">
            <p className="text-teal-400 text-xs uppercase tracking-wider font-bold mb-1">How to fix it</p>
            <p className="text-teal-200 font-mono text-xs leading-relaxed">{result.remediation}</p>
          </div>

          {/* Category tag */}
          <div className="flex justify-end">
            <span className="text-xs text-gray-600 font-mono uppercase">[{result.category}]</span>
          </div>
        </div>
      )}
    </div>
  )
}
