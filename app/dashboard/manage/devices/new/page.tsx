import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import DeviceForm from "@/components/DeviceForm"

export default async function NewDevicePage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  // Check if user has permission to manage devices
  const canManage = session.user.role === "ADMIN" || session.user.role === "OPERATOR"
  
  if (!canManage) {
    redirect("/dashboard/map")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/manage/devices"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Devices
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Add New Device</h1>
          <p className="text-gray-600 mt-1">Add a new device to your network monitoring system</p>
        </div>

        <div className="max-w-2xl bg-white rounded-xl shadow-lg p-6 lg:p-8 border border-gray-200">
          <DeviceForm />
        </div>
      </div>
    </div>
  )
}
