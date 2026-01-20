import { auth } from "./auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  
  // Redirect unauthenticated users to login page
  if (!session && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  if (session && session.user) {
    const role = session.user.role
    
    // Only proceed with role checks if role exists
    if (role) {
      // Admin-only routes - ADMIN only
      if ((pathname.startsWith('/dashboard/admin/config') || 
           pathname.startsWith('/dashboard/admin/users')) && 
          role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard/map', req.url))
      }
      
      // Admin and Operator routes - ADMIN and OPERATOR only
      if ((pathname.startsWith('/dashboard/admin/rooms') ||
           pathname.startsWith('/dashboard/manage')) && 
          role !== 'ADMIN' && role !== 'OPERATOR') {
        return NextResponse.redirect(new URL('/dashboard/map', req.url))
      }
    }
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*']
}
