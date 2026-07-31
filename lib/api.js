async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

async function upload(path, formData) {
  const res = await fetch(path, { method: 'POST', body: formData })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Upload failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  health: () => request('/api/health'),

  // subjects (each comes back with nested `subtopics`)
  getSubjects: () => request('/api/subjects'),
  createSubject: (name) => request('/api/subjects', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteSubject: (id) => request(`/api/subjects/${id}`, { method: 'DELETE' }),

  // subtopics
  createSubtopic: (subjectId, name) =>
    request(`/api/subjects/${subjectId}/subtopics`, { method: 'POST', body: JSON.stringify({ name }) }),
  updateSubtopic: (subjectId, subtopicId, patch) =>
    request(`/api/subjects/${subjectId}/subtopics/${subtopicId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteSubtopic: (subjectId, subtopicId) =>
    request(`/api/subjects/${subjectId}/subtopics/${subtopicId}`, { method: 'DELETE' }),

  // tasks (any date)
  getTasks: (date) => request(`/api/tasks${date ? `?date=${date}` : ''}`),
  createTask: (task) => request('/api/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (id, patch) => request(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),

  // study sessions (minutes per date, powers the streak)
  getSessionTotals: () => request('/api/sessions'),
  logSession: (session_date, minutes) =>
    request('/api/sessions', { method: 'POST', body: JSON.stringify({ session_date, minutes }) }),

  // revision planning
  getRevisions: () => request('/api/revisions'),
  createRevision: (revision) => request('/api/revisions', { method: 'POST', body: JSON.stringify(revision) }),
  updateRevision: (id, patch) => request(`/api/revisions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteRevision: (id) => request(`/api/revisions/${id}`, { method: 'DELETE' }),

  // documents (syllabus copies, subject materials, exam-wide files)
  getSubjectDocuments: (subjectId) => request(`/api/documents?subject_id=${subjectId}`),
  getExamDocuments: () => request('/api/documents?scope=exam'),
  uploadDocument: (file, subjectId) => {
    const fd = new FormData()
    fd.append('file', file)
    if (subjectId) fd.append('subject_id', subjectId)
    return upload('/api/documents', fd)
  },
  updateDocument: (id, patch) => request(`/api/documents/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteDocument: (id) => request(`/api/documents/${id}`, { method: 'DELETE' }),
}
