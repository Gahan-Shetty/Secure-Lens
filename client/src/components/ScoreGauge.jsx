export default function ScoreGauge({ score }) {
  const color =
    score >= 80 ? '#2dd4bf' :
    score >= 60 ? '#facc15' :
    score >= 40 ? '#f97316' :
                  '#ef4444'

  const label =
    score >= 80 ? 'Good' :
    score >= 60 ? 'Moderate' :
    score >= 40 ? 'Poor' : 'Critical'

  const circumference = 2 * Math.PI * 42
  const dash = (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="50" cy="50" r="42" fill="none" stroke="#1f2937" strokeWidth="10" />
          {/* Progress */}
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s ease' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white">{score}</span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-base font-bold" style={{ color }}>{label}</span>
        <p className="text-gray-600 text-xs mt-0.5">Security Score</p>
      </div>
    </div>
  )
}
