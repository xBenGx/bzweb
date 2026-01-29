import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Crear respuesta base
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Cliente Supabase (Conectado a tus variables)
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

  // 3. Verificar usuario
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Protección de Rutas (/admin)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    const isLoginPage = request.nextUrl.pathname === '/admin/login';
    const isRecoverPage = request.nextUrl.pathname === '/admin/update-password';

    // Si NO hay usuario y quiere entrar al panel -> Al Login
    if (!user && !isLoginPage && !isRecoverPage) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Si YA hay usuario y quiere ir al Login -> Al Dashboard
    if (user && isLoginPage) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto archivos estáticos e imágenes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}