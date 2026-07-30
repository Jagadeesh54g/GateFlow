import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getDb()
    await db.command({ ping: 1 })
    return NextResponse.json({ ok: true, db: 'connected' })
  } catch (err) {
    return NextResponse.json({ ok: false, db: err.message }, { status: 500 })
  }
}
