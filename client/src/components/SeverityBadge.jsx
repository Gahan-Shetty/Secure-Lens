const CONFIG = {
  critical: { label: 'Critical', className: 'bg-red-500/20 text-red-400 border-red-500/40' },
  high:     { label: 'High',     className: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  medium:   { label: 'Medium',   className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' },
  low:      { label: 'Low',      className: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  info:     { label: 'Info',     className: 'bg-gray-500/20 text-gray-400 border-gray-500/40' },
}

export default function SeverityBadge({ severity }) {
  const cfg = CONFIG[severity] || CONFIG.info
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
