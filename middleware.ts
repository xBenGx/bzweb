import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Cliente Supabase con manejo de cookies para SSR
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

  // Verificación de usuario
  const { data: { user } } = await supabase.auth.getUser()

  // --- LÓGICA DE PROTECCIÓN DE RUTAS ---
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    const isAuthRoute = 
        request.nextUrl.pathname === '/admin/login' || 
        request.nextUrl.pathname === '/admin/update-password';

    // Si ya está logueado y va al login, lo mandamos al dashboard
    if (user && isAuthRoute) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Si NO está logueado y quiere entrar al dashboard, lo mandamos al login
    if (!user && !isAuthRoute) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto archivos estáticos e imágenes
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}