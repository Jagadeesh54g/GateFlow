'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError('Incorrect email or password.')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">GateFlow</div>
        <p className="muted">Sign in to your prep tracker</p>

        {error && <p className="hint danger-text">{error}</p>}

        <label className="auth-field">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
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
            autoComplete="current-password"
          />
        </label>

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="muted small-hint">
          No account? <Link href="/register">Create one</Link>
        </p>
      </form>
    </div>
  )
}
