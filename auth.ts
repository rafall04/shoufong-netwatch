import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./lib/prisma"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface User {
    role: string
    username?: string
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      username?: string
    }
  }
  interface JWT {
    role: string
    id: string
    username?: string
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            console.log('[AUTH] Missing credentials')
            throw new Error('Missing credentials')
          }

          const user = await prisma.user.findUnique({
            where: { username: credentials.username as string }
          })

          if (!user) {
            console.log('[AUTH] User not found:', credentials.username)
            throw new Error('Invalid credentials')
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!isValid) {
            console.log('[AUTH] Invalid password for user:', credentials.username)
            throw new Error('Invalid credentials')
          }

          console.log('[AUTH] Login successful for user:', user.username)
          return {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role
          }
        } catch (error) {
          console.error('[AUTH] Authorization error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.username = (user as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.username = token.username as string | undefined
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
})
