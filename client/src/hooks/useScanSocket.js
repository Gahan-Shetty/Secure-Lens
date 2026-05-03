import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export function useScanSocket(scanId) {
  const [logs, setLogs]     = useState([])
  const [status, setStatus] = useState('queued')
  const [score, setScore]   = useState(null)
  const [connected, setConnected] = useState(false)

useEffect(() => {
    if (!scanId) return

    // Connect immediately and aggressively
    const socket = io('https://secure-lens-production.up.railway.app', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 500,
      timeout: 5000,
    })

    socket.on('connect', () => {
      setConnected(true)
      // Join room immediately on connect
      socket.emit('join:scan', scanId)
      console.log('Socket connected and joined scan room:', scanId)
    })

    // Re-join on reconnect
    socket.on('reconnect', () => {
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