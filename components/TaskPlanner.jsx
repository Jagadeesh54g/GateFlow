'use client'
import { useState } from 'react'
import { todayKey, formatNice } from '../utils/date.js'

export default function TaskPlanner({ selectedDate, onDateChange, tasks, onAddTask, onToggleTask, onDeleteTask, subjects }) {
  const [draft, setDraft] = useState('')
  const [subjectId, setSubjectId] = useState('')

  function submit(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    onAddTask({ text, task_date: selectedDate, subject_id: subjectId || null })
    setDraft('')
  }

  const done = tasks.filter((t) => t.done).length
  const isToday = selectedDate === todayKey()

  return (
    <div className="card wide">
      <div className="card-head">
        <h3>Tasks</h3>
        <span className="pill">{done}/{tasks.length}</span>
      </div>

      <div className="date-nav">
        <button className="ghost small" onClick={() => onDateChange(shift(selectedDate, -1))}>‹</button>
        <input type="date" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} />
        <button className="ghost small" onClick={() => onDateChange(shift(selectedDate, 1))}>›</button>
        {!isToday && (
          <button className="ghost small" onClick={() => onDateChange(todayKey())}>Today</button>
        )}
        <span className="date-label muted">{formatNice(selectedDate)}</span>
      </div>

      <form className="add-row" onSubmit={submit}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a task for this date…" />
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">No subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button type="submit" className="btn-plus">Add</button>
      </form>

      <ul className="task-list">
        {tasks.length === 0 && <li className="empty">Nothing planned for this date yet.</li>}
        {tasks.map((t) => (
          <li key={t.id} className={t.done ? 'done' : ''}>
            <label>
              <input type="checkbox" checked={t.done} onChange={() => onToggleTask(t)} />
              <span>{t.text}</span>
            </label>
            <button className="ghost" onClick={() => onDeleteTask(t.id)} aria-label="Remove task">×</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function shift(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}