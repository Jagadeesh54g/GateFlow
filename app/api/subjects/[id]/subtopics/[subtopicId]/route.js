import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { toObjectId } from '@/lib/serialize'
import { requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

const ALLOWED = ['concept_done', 'pyqs_done', 'test_done', 'name']

export async function PATCH(request, { params }) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const set = {}
    for (const key of ALLOWED) {
      if (key in body) set[`subtopics.$.${key}`] = body[key]
    }
    if (Object.keys(set).length === 0) {
      return NextResponse.json({ error: 'no valid fields to update' }, { status: 400 })
    }

    const db = await getDb()
    const subjectId = toObjectId(params.id)
    const subtopicId = toObjectId(params.subtopicId)

    const result = await db
      .collection('subjects')
      .findOneAndUpdate(
        { _id: subjectId, user_id: user.id, 'subtopics._id': subtopicId },
        { $set: set },
        { returnDocument: 'after' }
      )

    const doc = result?.value ?? result
    if (!doc) return NextResponse.json({ error: 'subtopic not found' }, { status: 404 })

    const updated = doc.subtopics.find((t) => t._id.toString() === subtopicId.toString())
    const { _id, ...rest } = updated
    return NextResponse.json({ id: _id.toString(), subject_id: subjectId.toString(), ...rest })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireUser()
    const db = await getDb()
    const subjectId = toObjectId(params.id)
    const subtopicId = toObjectId(params.subtopicId)
    await db
      .collection('subjects')
      .updateOne({ _id: subjectId, user_id: user.id }, { $pull: { subtopics: { _id: subtopicId } } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
