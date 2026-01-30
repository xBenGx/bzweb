import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Respuesta base inalterada
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Gestión de Cookies de Supabase (Necesario para que la sesión no se pierda)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // CORRECCIÓN: Aquí agregamos el tipado al argumento 'cookiesToSet'
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          
          // Actualizamos las cookies en la petición entrante
          cookiesToSet.forEach(({ name, value }) => 
            request.cookies.set(name, value)
          )
          
          // Recreamos la respuesta para incluir las cookies actualizadas de la petición
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          // Actualizamos las cookies en la respuesta saliente
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Refrescamos la sesión pero NO redirigimos
  // Esto evita bucles infinitos y errores 503
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}