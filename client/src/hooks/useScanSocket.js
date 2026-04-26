import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export function useScanSocket(scanId) {
  const [logs, setLogs]     = useState([])
  const [status, setStatus] = useState('queued')
  const [score, setScore]   = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!scanId) return

    const socket = io('http://localhost:5000', { transports: ['websocket'] })

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join:scan', scanId)
    })

    socket.on('scan:status', ({ status }) => setStatus(status))

    socket.on('scan:log', ({ message }) =>
      setLogs(prev => [...prev, { message, time: new Date().toLocaleTimeString() }])
    )

    socket.on('scan:done', ({ score }) => {
      setStatus('done')
      setScore(score)
    })

    socket.on('scan:error', ({ message }) => {
      setStatus('failed')
      setLogs(prev => [...prev, { message: `❌ ${message}`, time: new Date().toLocaleTimeString() }])
    })

    socket.on('disconnect', () => setConnected(false))

    return () => socket.disconnect()
  }, [scanId])

  return { logs, status, score, connected }
}
