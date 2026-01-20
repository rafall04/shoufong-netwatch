import { redirect } from 'next/navigation'

export default function DashboardPage() {
  // Redirect to map page as the default dashboard view
  redirect('/dashboard/map')
}
