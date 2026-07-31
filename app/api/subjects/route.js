import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { serializeSubject } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getDb()
    const docs = await db.collection('subjects').find({}).sort({ sort_order: 1, created_at: 1 }).toArray()
    return NextResponse.json(docs.map(serializeSubject))
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const name = body.name?.trim()
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const db = await getDb()
    const doc = {
      name,
      sort_order: 0,
      created_at: new Date().toISOString(),
      subtopics: [],
    }
    const result = await db.collection('subjects').insertOne(doc)
    return NextResponse.json(serializeSubject({ _id: result.insertedId, ...doc }), { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
