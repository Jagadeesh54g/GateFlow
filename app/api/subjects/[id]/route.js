import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { toObjectId } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

export async function DELETE(request, { params }) {
  try {
    const db = await getDb()
    await db.collection('subjects').deleteOne({ _id: toObjectId(params.id) })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
