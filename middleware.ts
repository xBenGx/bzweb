import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Crear una respuesta base para gestionar las cabeceras
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Crear el cliente de Supabase usando tus variables de entorno
  // El signo ! al final le dice a TypeScript: "Confía en mí, esta variable existe"
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

  // 3. Verificar la sesión del usuario
  // Usamos getUser() porque es más seguro que getSession() en el servidor
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Lógica de Protección de Rutas (/admin)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Definimos qué páginas dentro de admin son públicas (Login y Recuperar Clave)
    const isLoginPage = request.nextUrl.pathname === '/admin/login';
    const isRecoverPage = request.nextUrl.pathname === '/admin/update-password';

    // CASO A: El usuario NO está logueado y quiere entrar al panel privado
    // Lo expulsamos al Login
    if (!user && !isLoginPage && !isRecoverPage) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // CASO B: El usuario YA está logueado pero intenta entrar al Login
    // Lo mandamos directo al Dashboard para que no pierda tiempo
    if (user && isLoginPage) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Ejecutar en todas las rutas excepto:
     * - _next/static (archivos estáticos de compilación)
     * - _next/image (imágenes optimizadas)
     * - favicon.ico (icono del sitio)
     * - Archivos de imagen comunes (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}