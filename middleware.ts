import { NextRequest, NextResponse } from 'next/server'

// Minimal middleware — just redirect root to dashboard
// Full auth + subscription checking will be enabled after DB migration
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Redirect bare root to dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}
