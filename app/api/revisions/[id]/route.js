import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { toObjectId, serializeDoc } from '@/lib/serialize'
import { requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

const ALLOWED = ['done', 'scheduled_date', 'notes']

export async function PATCH(request, { params }) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const set = {}
    for (const key of ALLOWED) if (key in body) set[key] = body[key]

    const db = await getDb()
    const id = toObjectId(params.id)
    const result = await db
      .collection('revisions')
      .findOneAndUpdate({ _id: id, user_id: user.id }, { $set: set }, { returnDocument: 'after' })
    const doc = result?.value ?? result
    if (!doc) return NextResponse.json({ error: 'revision not found' }, { status: 404 })
    return NextResponse.json(serializeDoc(doc))
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireUser()
    const db = await getDb()
    await db.collection('revisions').deleteOne({ _id: toObjectId(params.id), user_id: user.id })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
