import { createBrowserClient } from '@supabase/ssr'

// Creamos el cliente para el navegador (Browser Client)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)