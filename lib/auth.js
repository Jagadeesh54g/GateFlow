import CredentialsProvider from 'next-auth/providers/credentials'
import { getDb } from './mongodb'
import { verifyPassword } from './hash'

export const authOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const db = await getDb()
        const user = await db
          .collection('users')
          .findOne({ email: credentials.email.toLowerCase().trim() })
        if (!user) return null

        const valid = await verifyPassword(credentials.password, user.password_hash)
        if (!valid) return null

        return { id: user._id.toString(), email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id
      return session
    },
  },
}
