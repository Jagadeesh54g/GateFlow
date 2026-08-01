import { withAuth } from 'next-auth/middleware'

// Only the dashboard itself needs a session. API routes check auth themselves
// (via lib/session.js) and return 401 JSON instead of an HTML redirect, and
// /login, /register must stay reachable by definition.
export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: ['/'],
}
