import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { serializeDoc } from '@/lib/serialize'
import { requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireUser()
    const db = await getDb()
    const [revisions, subjects] = await Promise.all([
      db.collection('revisions').find({ user_id: user.id }).sort({ scheduled_date: 1 }).toArray(),
      db.collection('subjects').find({ user_id: user.id }).toArray(),
    ])

    const subjectById = new Map(subjects.map((s) => [s._id.toString(), s]))

    const shaped = revisions.map((r) => {
      const subject = subjectById.get(r.subject_id)
      const subtopic = subject?.subtopics?.find((t) => t._id.toString() === r.subtopic_id)
      return {
        ...serializeDoc(r),
        subject_name: subject?.name ?? null,
        subtopic_name: subtopic?.name ?? null,
      }
    })

    return NextResponse.json(shaped)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}

export async function POST(request) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const { subject_id, subtopic_id, scheduled_date, notes } = body
    if (!subject_id) return NextResponse.json({ error: 'subject_id is required' }, { status: 400 })
    if (!scheduled_date) return NextResponse.json({ error: 'scheduled_date is required' }, { status: 400 })

    const db = await getDb()
    const doc = {
      user_id: user.id,
      subject_id,
      subtopic_id: subtopic_id || null,
      scheduled_date,
      done: false,
      notes: notes || null,
      created_at: new Date().toISOString(),
    }
    const result = await db.collection('revisions').insertOne(doc)
    return NextResponse.json(serializeDoc({ _id: result.insertedId, ...doc }), { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
