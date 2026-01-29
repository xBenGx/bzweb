import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Usamos createServerClient de @supabase/ssr (LA LIBRERÍA NUEVA)
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

  // Verificar usuario
  const { data: { user } } = await supabase.auth.getUser()

  // --- LÓGICA DE PROTECCIÓN ---
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const isAuthRoute = 
        request.nextUrl.pathname === '/admin/login' || 
        request.nextUrl.pathname === '/admin/update-password';

    if (user && isAuthRoute) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

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
