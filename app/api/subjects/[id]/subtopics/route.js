import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { toObjectId } from '@/lib/serialize'
import { requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const name = body.name?.trim()
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const subtopic = {
      _id: new ObjectId(),
      name,
      concept_done: false,
      pyqs_done: false,
      test_done: false,
      created_at: new Date().toISOString(),
    }

    const db = await getDb()
    const subjectId = toObjectId(params.id)
    const result = await db
      .collection('subjects')
      .updateOne({ _id: subjectId, user_id: user.id }, { $push: { subtopics: subtopic } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'subject not found' }, { status: 404 })
    }

    const { _id, ...rest } = subtopic
    return NextResponse.json(
      { id: _id.toString(), subject_id: subjectId.toString(), ...rest },
      { status: 201 }
    )
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
