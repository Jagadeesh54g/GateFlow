'use client'
import { useState } from 'react'
import { todayKey, formatNice } from '../utils/date.js'

export default function RevisionPlanner({ revisions, subjects, onAdd, onToggle, onDelete }) {
  const [subjectId, setSubjectId] = useState('')
  const [subtopicId, setSubtopicId] = useState('')
  const [date, setDate] = useState(todayKey())

  const subtopicOptions = subjects.find((s) => s.id === subjectId)?.subtopics ?? []
  const today = todayKey()

  function submit(e) {
    e.preventDefault()
    if (!subjectId || !date) return
    onAdd({ subject_id: subjectId, subtopic_id: subtopicId || null, scheduled_date: date })
    setSubtopicId('')
  }

  const pending = revisions.filter((r) => !r.done).sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
  const completed = revisions.filter((r) => r.done)

  return (
    <div className="card wide">
      <div className="card-head">
        <h3>Revision planning</h3>
        <span className="pill">{pending.length} pending</span>
      </div>

      <form className="add-row wrap" onSubmit={submit}>
        <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setSubtopicId('') }} required>
          <option value="">Subject…</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={subtopicId} onChange={(e) => setSubtopicId(e.target.value)} disabled={!subjectId}>
          <option value="">Whole subject</option>
          {subtopicOptions.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <button type="submit" className="btn-plus">Schedule</button>
      </form>

      <ul className="revision-list">
        {pending.length === 0 && <li className="empty">No revisions scheduled — plan one above.</li>}
        {pending.map((r) => {
          const overdue = r.scheduled_date < today
          return (
            <li key={r.id} className={overdue ? 'overdue' : ''}>
              <label>
                <input type="checkbox" checked={r.done} onChange={() => onToggle(r)} />
                <span>
                  <strong>{r.subject_name}</strong>
                  {r.subtopic_name ? ` — ${r.subtopic_name}` : ''}
                </span>
              </label>
              <span className={`date-chip ${overdue ? 'danger' : ''}`}>{formatNice(r.scheduled_date)}</span>
              <button className="ghost" onClick={() => onDelete(r.id)} aria-label="Remove">×</button>
            </li>
          )
        })}
      </ul>

      {completed.length > 0 && (
        <details className="revision-done">
          <summary>{completed.length} completed</summary>
          <ul className="revision-list">
            {completed.map((r) => (
              <li key={r.id} className="done">
                <label>
                  <input type="checkbox" checked={r.done} onChange={() => onToggle(r)} />
                  <span>
                    {r.subject_name}
                    {r.subtopic_name ? ` — ${r.subtopic_name}` : ''}
                  </span>
                </label>
                <button className="ghost" onClick={() => onDelete(r.id)} aria-label="Remove">×</button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}