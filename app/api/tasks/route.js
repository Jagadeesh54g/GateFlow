import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { serializeDoc } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    const db = await getDb()
    const query = date ? { task_date: date } : {}
    const docs = await db.collection('tasks').find(query).sort({ created_at: 1 }).toArray()
    return NextResponse.json(docs.map(serializeDoc))
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const text = body.text?.trim()
    const task_date = body.task_date
    if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })
    if (!task_date) return NextResponse.json({ error: 'task_date is required (YYYY-MM-DD)' }, { status: 400 })

    const db = await getDb()
    const doc = {
      text,
      task_date,
      done: false,
      subject_id: body.subject_id || null,
      subtopic_id: body.subtopic_id || null,
      created_at: new Date().toISOString(),
    }
    const result = await db.collection('tasks').insertOne(doc)
    return NextResponse.json(serializeDoc({ _id: result.insertedId, ...doc }), { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
