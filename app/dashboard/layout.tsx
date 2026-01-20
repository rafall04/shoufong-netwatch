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
      <main className="flex-1 overflow-hidden md:ml-0">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}