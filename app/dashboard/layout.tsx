import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Redirect if not logged in
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-hidden md:ml-0 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        <footer className="bg-white border-t border-gray-200 py-3 px-4 md:px-6">
          <p className="text-xs md:text-sm text-gray-600 text-center">
            Copyright © 2026 RAF. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  )
}