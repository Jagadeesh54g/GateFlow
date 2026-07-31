import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getDb()
    const docs = await db.collection('study_sessions').find({}).toArray()
    const totals = {}
    for (const row of docs) {
      totals[row.session_date] = (totals[row.session_date] || 0) + row.minutes
    }
    return NextResponse.json(totals) // { "2026-07-29": 185, ... }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { session_date, minutes } = body
    if (!session_date) return NextResponse.json({ error: 'session_date is required' }, { status: 400 })
    if (!minutes || minutes <= 0) return NextResponse.json({ error: 'minutes must be > 0' }, { status: 400 })

    const db = await getDb()
    await db.collection('study_sessions').insertOne({
      session_date,
      minutes,
      created_at: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
