'use client'
import { useEffect, useRef, useState } from 'react'

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export default function Timer({ todayMinutes, dailyTargetMinutes, onLogMinutes }) {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  function logSession() {
    const minutes = Math.round(seconds / 60)
    if (minutes > 0) onLogMinutes(minutes)
    setRunning(false)
    setSeconds(0)
  }

  const metTarget = todayMinutes >= dailyTargetMinutes

  return (
    <div className="card">
      <div className="card-head">
        <h3>Study timer</h3>
        <span className={`pill ${metTarget ? 'pill-good' : ''}`}>
          {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m / {dailyTargetMinutes / 60}h today
        </span>
      </div>

      <div className="timer-display">{formatDuration(seconds)}</div>

      <div className="timer-btn-row">
        <button onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : seconds > 0 ? 'Resume' : 'Start'}
        </button>
        <button className="ghost" onClick={logSession} disabled={seconds === 0}>
          Log &amp; reset
        </button>
      </div>
      <p className="hint">
        Sessions log to today's total. Hit {dailyTargetMinutes / 60}h in a day to keep your streak alive.
      </p>
    </div>
  )
}
