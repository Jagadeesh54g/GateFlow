import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'

export async function requireUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    const err = new Error('Not signed in')
    err.status = 401
    throw err
  }
  return session.user
}
