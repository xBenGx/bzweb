import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Verificación de seguridad para evitar el Error 503
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("⚠️ FALTAN LAS VARIABLES DE ENTORNO EN HOSTINGER");
    // Si faltan las claves, permitimos el paso para que el sitio NO se caiga (503)
    // pero el login no funcionará hasta que las pongas.
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
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

  const { data: { user } } = await supabase.auth.getUser()

  // Protección de rutas
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}