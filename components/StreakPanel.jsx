'use client'
import { todayKey } from '../utils/date.js'

function lastNDays(n) {
  const days = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    days.push(todayKey(d))
  }
  return days
}

function levelFor(minutes, targetMinutes) {
  if (!minutes) return 0
  const ratio = minutes / targetMinutes
  if (ratio < 0.25) return 1
  if (ratio < 0.6) return 2
  if (ratio < 1) return 3
  return 4 // hit the target
}

function computeStreak(totals, targetMinutes) {
  let streak = 0
  const d = new Date()
  while (true) {
    const key = todayKey(d)
    if ((totals[key] || 0) >= targetMinutes) {
      streak += 1
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export default function StreakPanel({ totals, dailyTargetMinutes }) {
  const days = lastNDays(84) // 12 weeks
  const streak = computeStreak(totals, dailyTargetMinutes)
  const qualifyingDays = Object.values(totals).filter((m) => m >= dailyTargetMinutes).length

  return (
    <div className="card">
      <div className="card-head">
        <h3>Consistency</h3>
        <span className="pill">🔥 {streak} day streak</span>
      </div>

      <div className="heatmap">
        {days.map((key) => (
          <div
            key={key}
            className={`heat-cell level-${levelFor(totals[key], dailyTargetMinutes)}`}
            title={`${key}: ${totals[key] || 0} min (target ${dailyTargetMinutes}m)`}
          />
        ))}
      </div>

      <p className="hint">
        {qualifyingDays} days you've hit the {dailyTargetMinutes / 60}h target. A day only counts toward your streak
        once it reaches that.
      </p>
    </div>
  )
}
