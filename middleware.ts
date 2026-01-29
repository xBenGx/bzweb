import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Cliente Supabase para el Middleware (Manejo de Cookies)
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
  
  // Si la ruta empieza con /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Rutas permitidas sin login (Login y Recuperar clave)
    const isAuthRoute = 
        request.nextUrl.pathname === '/admin/login' || 
        request.nextUrl.pathname === '/admin/update-password';

    // Si ya está logueado y quiere ir al login, lo mandamos al dashboard
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
     * Coincidir con todas las rutas de solicitud excepto las que comienzan con:
     * - _next/static (archivos estáticos)
     * - _next/image (archivos de optimización de imágenes)
     * - favicon.ico (archivo favicon)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}