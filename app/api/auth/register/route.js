import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { hashPassword } from '@/lib/hash'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { email, password, name } = await request.json()

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const db = await getDb()

    // idempotent — cheap no-op if it already exists, but guards against a
    // race between two simultaneous signups with the same email
    await db.collection('users').createIndex({ email: 1 }, { unique: true })

    const existing = await db.collection('users').findOne({ email: normalizedEmail })
    if (existing) {
      return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 })
    }

    const password_hash = await hashPassword(password)
    await db.collection('users').insertOne({
      email: normalizedEmail,
      password_hash,
      name: name?.trim() || normalizedEmail.split('@')[0],
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
