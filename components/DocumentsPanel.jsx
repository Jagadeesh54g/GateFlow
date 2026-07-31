'use client'
import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.js'

function isPdf(doc) { return doc.content_type === 'application/pdf' }
function isImage(doc) { return doc.content_type?.startsWith('image/') }

function iconFor(doc) {
  if (isPdf(doc)) return '📄'
  if (isImage(doc)) return '🖼️'
  return '📎'
}

function openDoc(doc) {
  const url = isPdf(doc) && doc.last_page ? `${doc.url}#page=${doc.last_page}` : doc.url
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function DocumentsPanel({ subjectId = null, title = 'Documents', compact = false }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const result = subjectId ? await api.getSubjectDocuments(subjectId) : await api.getExamDocuments()
        if (!cancelled) setDocs(result)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [subjectId])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const created = await api.uploadDocument(file, subjectId)
      setDocs((d) => [created, ...d])
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function saveField(doc, patch) {
    const updated = await api.updateDocument(doc.id, patch)
    setDocs((d) => d.map((x) => (x.id === doc.id ? updated : x)))
  }

  async function removeDoc(id) {
    if (!window.confirm('Delete this file? This cannot be undone.')) return
    await api.deleteDocument(id)
    setDocs((d) => d.filter((x) => x.id !== id))
  }

  return (
    <div className={compact ? 'documents-block' : 'card wide'}>
      {!compact && (
        <div className="card-head">
          <h3>{title}</h3>
          <span className="pill">{docs.length} file{docs.length === 1 ? '' : 's'}</span>
        </div>
      )}
      {compact && (
        <div className="documents-head">
          <span className="documents-title">{title}</span>
          <span className="muted">{docs.length} file{docs.length === 1 ? '' : 's'}</span>
        </div>
      )}

      <div className="upload-row">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {uploading && <span className="muted small-hint">Uploading…</span>}
      </div>
      {error && <p className="hint danger-text">{error}</p>}

      {loading ? (
        <p className="hint">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="hint">No files yet — attach a syllabus copy, notes photo, or PDF above.</p>
      ) : (
        <ul className="doc-list">
          {docs.map((doc) => (
            <li key={doc.id} className="doc-row">
              <button className="doc-open" onClick={() => openDoc(doc)} title="Open">
                <span className="doc-icon">{iconFor(doc)}</span>
                <span className="doc-name">{doc.file_name}</span>
              </button>

              {isPdf(doc) && (
                <label className="doc-page">
                  Resume pg
                  <input
                    type="number"
                    min="1"
                    defaultValue={doc.last_page || ''}
                    placeholder="1"
                    onBlur={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null
                      if (val !== doc.last_page) saveField(doc, { last_page: val })
                    }}
                  />
                </label>
              )}

              <button className="ghost small" onClick={() => removeDoc(doc.id)} aria-label="Delete">×</button>

              <textarea
                className="doc-notes"
                placeholder="Short notes…"
                defaultValue={doc.notes || ''}
                onBlur={(e) => {
                  if (e.target.value !== doc.notes) saveField(doc, { notes: e.target.value })
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
