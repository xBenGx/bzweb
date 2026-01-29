import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Cliente Supabase seguro
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar sesión si existe
  const { data: { user } } = await supabase.auth.getUser()

  // Proteger rutas de admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const isAuthRoute = 
        request.nextUrl.pathname === '/admin/login' || 
        request.nextUrl.pathname === '/admin/update-password';

    // Si tiene usuario y va al login -> Dashboard
    if (user && isAuthRoute) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Si NO tiene usuario y va al dashboard -> Login
    if (!user && !isAuthRoute) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
