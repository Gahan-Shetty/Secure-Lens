import { useState } from 'react'

export default function ScanInput({ onScan, loading }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const validate = (value) => {
    if (!value.trim()) return 'Please enter a URL'
    try {
      const u = value.startsWith('http') ? value : `https://${value}`
      new URL(u)
      return ''
    } catch {
      return 'Please enter a valid URL (e.g. example.com)'
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const err = validate(url)
    if (err) { setError(err); return }
    setError('')
    onScan(url.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError('') }}
            placeholder="https://example.com"
            className="input-field font-mono"
            disabled={loading}
            autoFocus
          />
          {error && <p className="text-red-400 text-xs mt-1 ml-1">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary flex items-center gap-2 justify-center sm:w-40"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
              Scanning...
            </>
          ) : (
            <>🔍 Scan</>
          )}
        </button>
      </div>
    </form>
  )
}
