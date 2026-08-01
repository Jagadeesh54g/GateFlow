'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(body.error || 'Could not create account')
      setLoading(false)
      return
    }

    const signInRes = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (signInRes?.error) {
      setError('Account created — please sign in.')
      router.push('/login')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">GateFlow</div>
        <p className="muted">Create your own private prep tracker</p>

        {error && <p className="hint danger-text">{error}</p>}

        <label className="auth-field">
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
            autoFocus
          />
        </label>

        <label className="auth-field">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label className="auth-field">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <p className="hint">At least 8 characters.</p>

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="muted small-hint">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </form>
    </div>
  )
}
