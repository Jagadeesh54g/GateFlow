'use client'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { api } from '@/lib/api.js'
import { todayKey } from '../utils/date.js'
import SubjectsPanel from '../components/SubjectsPanel.jsx'
import TaskPlanner from '../components/TaskPlanner.jsx'
import Timer from '../components/Timer.jsx'
import StreakPanel from '../components/StreakPanel.jsx'
import RevisionPlanner from '../components/RevisionPlanner.jsx'
import DocumentsPanel from '../components/DocumentsPanel.jsx'
import QuickLinks from '../components/QuickLinks.jsx'

const DAILY_TARGET_MINUTES = 5 * 60 // default streak requirement: 5 hours/day
const EXAM_DATE_KEY = 'gateflow_exam_date' // just a display setting, not prep data

export default function Page() {
  const { data: session, status: authStatus } = useSession()
  const [subjects, setSubjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [sessionTotals, setSessionTotals] = useState({})
  const [revisions, setRevisions] = useState([])
  const [examDate, setExamDate] = useState('2027-02-01')
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [errorMsg, setErrorMsg] = useState('')

  // exam date is just a display preference, kept in localStorage (not prep data)
  useEffect(() => {
    const saved = localStorage.getItem(EXAM_DATE_KEY)
    if (saved) setExamDate(saved)
  }, [])
  useEffect(() => {
    localStorage.setItem(EXAM_DATE_KEY, examDate)
  }, [examDate])

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    let cancelled = false
    async function boot() {
      try {
        const [subj, sess, rev] = await Promise.all([
          api.getSubjects(),
          api.getSessionTotals(),
          api.getRevisions(),
        ])
        if (cancelled) return
        setSubjects(subj)
        setSessionTotals(sess)
        setRevisions(rev)
        setStatus('ready')
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err.message)
          setStatus('error')
        }
      }
    }
    boot()
    return () => { cancelled = true }
  }, [authStatus])

  useEffect(() => {
    if (status !== 'ready') return
    api.getTasks(selectedDate).then(setTasks).catch((err) => setErrorMsg(err.message))
  }, [selectedDate, status])

  // ---- subjects & subtopics ----
  async function addSubject(name) {
    const created = await api.createSubject(name)
    setSubjects((s) => [...s, created])
  }
  async function deleteSubject(id) {
    await api.deleteSubject(id)
    setSubjects((s) => s.filter((x) => x.id !== id))
  }
  async function addSubtopic(subjectId, name) {
    const created = await api.createSubtopic(subjectId, name)
    setSubjects((s) => s.map((x) => (x.id === subjectId ? { ...x, subtopics: [...x.subtopics, created] } : x)))
  }
  async function toggleStage(subtopic, field) {
    const updated = await api.updateSubtopic(subtopic.subject_id, subtopic.id, { [field]: !subtopic[field] })
    setSubjects((s) =>
      s.map((x) =>
        x.id === subtopic.subject_id
          ? { ...x, subtopics: x.subtopics.map((t) => (t.id === updated.id ? updated : t)) }
          : x
      )
    )
  }
  async function deleteSubtopic(subtopic) {
    await api.deleteSubtopic(subtopic.subject_id, subtopic.id)
    setSubjects((s) =>
      s.map((x) =>
        x.id === subtopic.subject_id ? { ...x, subtopics: x.subtopics.filter((t) => t.id !== subtopic.id) } : x
      )
    )
  }

  // ---- tasks (any date) ----
  async function addTask(task) {
    const created = await api.createTask(task)
    if (created.task_date === selectedDate) setTasks((t) => [...t, created])
  }
  async function toggleTask(task) {
    const updated = await api.updateTask(task.id, { done: !task.done })
    setTasks((t) => t.map((x) => (x.id === updated.id ? updated : x)))
  }
  async function deleteTask(id) {
    await api.deleteTask(id)
    setTasks((t) => t.filter((x) => x.id !== id))
  }

  // ---- study sessions / streak ----
  async function logMinutes(minutes) {
    const key = todayKey()
    await api.logSession(key, minutes)
    setSessionTotals((tot) => ({ ...tot, [key]: (tot[key] || 0) + minutes }))
  }

  // ---- revision planning ----
  async function addRevision(revision) {
    await api.createRevision(revision)
    const fresh = await api.getRevisions() // refetch to get joined subject/subtopic names
    setRevisions(fresh)
  }
  async function toggleRevision(r) {
    const updated = await api.updateRevision(r.id, { done: !r.done })
    setRevisions((list) => list.map((x) => (x.id === r.id ? { ...x, done: updated.done } : x)))
  }
  async function deleteRevision(id) {
    await api.deleteRevision(id)
    setRevisions((list) => list.filter((x) => x.id !== id))
  }

  const todayMinutes = sessionTotals[todayKey()] || 0
  const remaining = daysUntilExam(examDate)
  const displayName = session?.user?.name || session?.user?.email || ''

  if (authStatus === 'loading' || authStatus === 'unauthenticated') {
    return <div className="app centered">Loading…</div>
  }
  if (status === 'loading') {
    return <div className="app centered">Loading your prep data…</div>
  }
  if (status === 'error') {
    return (
      <div className="app centered">
        <div className="card" style={{ maxWidth: 480 }}>
          <h3>Can't reach the database</h3>
          <p className="hint">{errorMsg}</p>
          <p className="hint">
            Make sure <code>MONGODB_URI</code> is set — in <code>.env.local</code> for local dev, or in your
            Vercel project's Environment Variables in production. See the README.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand-row">
          <span className="brand-mark">GF</span>
          <div>
            <h1>GateFlow</h1>
            <p className="muted">Plan. Study. Revise. Crack GATE.</p>
          </div>
        </div>

        <div className="header-right">
          <div className="countdown">
            <div className="countdown-num">{remaining}</div>
            <div className="countdown-label">days left</div>
            <input
              className="date-input"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>

          <div className="user-chip">
            <span className="user-avatar">{displayName.slice(0, 1).toUpperCase() || '?'}</span>
            <span className="user-name">{displayName}</span>
            <button className="ghost small" onClick={() => signOut({ callbackUrl: '/login' })}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="grid">
        <SubjectsPanel
          subjects={subjects}
          onAddSubject={addSubject}
          onDeleteSubject={deleteSubject}
          onAddSubtopic={addSubtopic}
          onToggleStage={toggleStage}
          onDeleteSubtopic={deleteSubtopic}
        />

        <TaskPlanner
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          tasks={tasks}
          onAddTask={addTask}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          subjects={subjects}
        />

        <Timer todayMinutes={todayMinutes} dailyTargetMinutes={DAILY_TARGET_MINUTES} onLogMinutes={logMinutes} />

        <StreakPanel totals={sessionTotals} dailyTargetMinutes={DAILY_TARGET_MINUTES} />

        <RevisionPlanner
          revisions={revisions}
          subjects={subjects}
          onAdd={addRevision}
          onToggle={toggleRevision}
          onDelete={deleteRevision}
        />

        <DocumentsPanel subjectId={null} title="Exam documents (syllabus, admit card, etc.)" />

        <QuickLinks />
      </main>

      <footer className="footer">Synced to MongoDB via Next.js API routes.</footer>
    </div>
  )
}

function daysUntilExam(dateStr) {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}
