import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { toObjectId } from '@/lib/serialize'
import { requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function DELETE(request, { params }) {
  try {
    const user = await requireUser()
    const db = await getDb()
    await db.collection('subjects').deleteOne({ _id: toObjectId(params.id), user_id: user.id })
    // clean up anything that referenced this subject
    await db.collection('tasks').deleteMany({ subject_id: params.id, user_id: user.id })
    await db.collection('revisions').deleteMany({ subject_id: params.id, user_id: user.id })
    await db.collection('documents').deleteMany({ subject_id: params.id, user_id: user.id })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
