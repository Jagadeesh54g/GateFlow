'use client'
import { useState } from 'react'
import DocumentsPanel from './DocumentsPanel.jsx'

function subtopicFraction(t) {
  return ((t.concept_done ? 1 : 0) + (t.pyqs_done ? 1 : 0) + (t.test_done ? 1 : 0)) / 3
}

function subjectProgress(subject) {
  if (!subject.subtopics.length) return 0
  const sum = subject.subtopics.reduce((acc, t) => acc + subtopicFraction(t), 0)
  return Math.round((sum / subject.subtopics.length) * 100)
}

export default function SubjectsPanel({ subjects, onAddSubject, onDeleteSubject, onAddSubtopic, onToggleStage, onDeleteSubtopic }) {
  const [newSubject, setNewSubject] = useState('')
  const [openId, setOpenId] = useState(subjects[0]?.id ?? null)
  const [draftByTopic, setDraftByTopic] = useState('')

  function submitSubject(e) {
    e.preventDefault()
    const name = newSubject.trim()
    if (!name) return
    onAddSubject(name)
    setNewSubject('')
  }

  function submitSubtopic(e, subjectId) {
    e.preventDefault()
    const name = draftByTopic.trim()
    if (!name) return
    onAddSubtopic(subjectId, name)
    setDraftByTopic('')
  }

  return (
    <div className="card wide">
      <div className="card-head">
        <h3>Subjects</h3>
        <span className="pill">{subjects.length} subjects</span>
      </div>

      <div className="subject-accordion">
        {subjects.map((s) => {
          const pct = subjectProgress(s)
          const isOpen = openId === s.id
          return (
            <div key={s.id} className="subject-block">
              <button className="subject-summary" onClick={() => setOpenId(isOpen ? null : s.id)}>
                <span className="subject-name">{s.name}</span>
                <span className="subject-meta">
                  <span className="mini-bar"><span style={{ width: `${pct}%` }} /></span>
                  <span className="muted">{pct}%</span>
                  <span className="chevron">{isOpen ? '▾' : '▸'}</span>
                </span>
              </button>

              {isOpen && (
                <div className="subject-detail">
                  <ul className="subtopic-list">
                    {s.subtopics.length === 0 && (
                      <li className="empty">No subtopics yet — add one below.</li>
                    )}
                    {s.subtopics.map((t) => (
                      <li key={t.id} className="subtopic-row">
                        <span className="subtopic-name">{t.name}</span>
                        <span className="stage-group">
                          <label className={`stage-chip ${t.concept_done ? 'on' : ''}`}>
                            <input
                              type="checkbox"
                              checked={t.concept_done}
                              onChange={() => onToggleStage(t, 'concept_done')}
                            />
                            Concept
                          </label>
                          <label className={`stage-chip ${t.pyqs_done ? 'on' : ''}`}>
                            <input
                              type="checkbox"
                              checked={t.pyqs_done}
                              onChange={() => onToggleStage(t, 'pyqs_done')}
                            />
                            PYQs
                          </label>
                          <label className={`stage-chip ${t.test_done ? 'on' : ''}`}>
                            <input
                              type="checkbox"
                              checked={t.test_done}
                              onChange={() => onToggleStage(t, 'test_done')}
                            />
                            Test
                          </label>
                        </span>
                        <button className="ghost small" onClick={() => onDeleteSubtopic(t)}>×</button>
                      </li>
                    ))}
                  </ul>

                  <form className="add-row" onSubmit={(e) => submitSubtopic(e, s.id)}>
                    <input
                      value={draftByTopic}
                      onChange={(e) => setDraftByTopic(e.target.value)}
                      placeholder="Add a subtopic…"
                    />
                    <button type="submit">Add</button>
                  </form>

                  <button className="ghost small danger" onClick={() => onDeleteSubject(s.id)}>
                    Delete subject
                  </button>

                  <DocumentsPanel subjectId={s.id} title="Subject files" compact />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <form className="add-row" onSubmit={submitSubject}>
        <input
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          placeholder="Add a subject…"
        />
        <button type="submit">Add subject</button>
      </form>
    </div>
  )
}
