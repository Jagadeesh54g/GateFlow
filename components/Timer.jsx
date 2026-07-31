'use client'
import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'gateflow_timer_state'

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { seconds: 0, running: false }
    const saved = JSON.parse(raw)
    if (saved.running && saved.lastSavedAt) {
      // account for time that passed while the tab/app was closed or backgrounded
      const elapsedSincesSave = Math.floor((Date.now() - saved.lastSavedAt) / 1000)
      return { seconds: saved.seconds + Math.max(elapsedSincesSave, 0), running: true }
    }
    return { seconds: saved.seconds || 0, running: false }
  } catch {
    return { seconds: 0, running: false }
  }
}

function persist(seconds, running) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ seconds, running, lastSavedAt: Date.now() }))
  } catch {
    // storage unavailable — timer still works in-memory for this session
  }
}

export default function Timer({ todayMinutes, dailyTargetMinutes, onLogMinutes }) {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const intervalRef = useRef(null)

  // restore any unsaved session on first mount, so a refresh never loses today's progress
  useEffect(() => {
    const restored = loadPersisted()
    setSeconds(restored.seconds)
    setRunning(restored.running)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1
          persist(next, true)
          return next
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, hydrated])

  // warn on tab close/refresh if there's unlogged time, as a backstop on top of persistence
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (seconds > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [seconds])

  function toggleRunning() {
    setRunning((r) => {
      const next = !r
      persist(seconds, next)
      return next
    })
  }

  function logSession() {
    const minutes = Math.round(seconds / 60)
    const ok = window.confirm(
      minutes > 0
        ? `Log ${minutes} minute${minutes === 1 ? '' : 's'} to today's total and reset the timer? This can't be undone.`
        : 'Reset the timer to 0:00:00?'
    )
    if (!ok) return
    if (minutes > 0) onLogMinutes(minutes)
    setRunning(false)
    setSeconds(0)
    persist(0, false)
  }

  const metTarget = todayMinutes >= dailyTargetMinutes

  if (!hydrated) return null // avoid a flash of 00:00:00 before restoring persisted state

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
        <button onClick={toggleRunning}>
          {running ? 'Pause' : seconds > 0 ? 'Resume' : 'Start'}
        </button>
        <button className="ghost" onClick={logSession} disabled={seconds === 0}>
          Log &amp; reset
        </button>
      </div>
      <p className="hint">
        Your running time is saved automatically — refreshing or closing the tab won't lose it. Hit{' '}
        {dailyTargetMinutes / 60}h in a day to keep your streak alive.
      </p>
    </div>
  )
}
