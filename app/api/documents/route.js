import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getDb } from '@/lib/mongodb'
import { serializeDoc } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

// GET /api/documents?subject_id=<id>   -> docs attached to that subject
// GET /api/documents?scope=exam        -> exam-wide docs (no subject)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subject_id')
    const scope = searchParams.get('scope')

    const db = await getDb()
    const query = scope === 'exam' ? { subject_id: null } : subjectId ? { subject_id: subjectId } : {}
    const docs = await db.collection('documents').find(query).sort({ created_at: -1 }).toArray()
    return NextResponse.json(docs.map(serializeDoc))
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/documents  (multipart/form-data: file, subject_id?)
export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const subjectId = formData.get('subject_id') || null

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }
    // Vercel serverless functions cap request bodies around 4.5MB — fine for most
    // syllabus PDFs/images, but large scans may need the client-upload flow instead.
    if (file.size > 4.4 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (4.4MB limit for direct upload). Compress it or split it up.' },
        { status: 413 }
      )
    }

    const blob = await put(file.name, file, { access: 'public', addRandomSuffix: true })

    const db = await getDb()
    const doc = {
      subject_id: subjectId,
      file_name: file.name,
      content_type: file.type || 'application/octet-stream',
      size: file.size,
      url: blob.url,
      blob_pathname: blob.pathname,
      last_page: null,
      notes: '',
      created_at: new Date().toISOString(),
    }
    const result = await db.collection('documents').insertOne(doc)
    return NextResponse.json(serializeDoc({ _id: result.insertedId, ...doc }), { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
