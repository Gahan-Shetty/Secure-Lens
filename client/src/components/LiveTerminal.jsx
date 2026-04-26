import { useEffect, useRef } from 'react'

export default function LiveTerminal({ logs, status }) {
  const bottomRef = useRef(null)

  // Auto-scroll to latest log
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const statusColor =
    status === 'done'    ? 'text-teal-400' :
    status === 'failed'  ? 'text-red-400'  :
    status === 'running' ? 'text-yellow-400' : 'text-gray-400'

  const statusLabel =
    status === 'done'    ? '■ SCAN COMPLETE' :
    status === 'failed'  ? '■ SCAN FAILED'   :
    status === 'running' ? '▶ SCANNING...'   : '○ QUEUED'

  return (
    <div className="bg-gray-950 border border-teal-500/20 rounded-lg overflow-hidden">
      {/* Terminal header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className={`text-xs font-mono font-bold tracking-widest ${statusColor}`}>
          {statusLabel}
        </span>
        <span className="text-xs text-gray-600 font-mono">securelens@scanner</span>
      </div>

      {/* Log output */}
      <div className="h-64 overflow-y-auto p-4 font-mono text-sm space-y-1">
        {logs.length === 0 && (
          <p className="text-gray-600">Waiting for scan to start...</p>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-gray-700 shrink-0 text-xs mt-0.5">{log.time}</span>
            <p className={`leading-6 break-all ${
              log.message.includes('❌') ? 'text-red-400' :
              log.message.includes('⚠')  ? 'text-yellow-400' :
              log.message.includes('✓') || log.message.includes('✅') ? 'text-teal-400' :
              'text-green-400'
            }`}>
              {log.message}
            </p>
          </div>
        ))}
        {status === 'running' && (
          <p className="text-teal-400 animate-pulse">█</p>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
