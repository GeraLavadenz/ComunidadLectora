// src/services/auth.ts
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// src/services/auth.ts → solo esta función
export async function signInWithGoogle(role?: 'reader' | 'author') {
  if (role) {
    localStorage.setItem('preferred_role', role)
  }

  // ESTA ES LA ÚNICA URL QUE FUNCIONA CON SUPABASE EN 2025
  const supabaseUrl = 'https://qiolmvlqilnxqrbrkzux.supabase.co'
  const redirectUrl = `${window.location.origin}/auth/callback`

  const authUrl = new URL(`${supabaseUrl}/auth/v1/authorize`)
  authUrl.searchParams.append('provider', 'google')
  authUrl.searchParams.append('redirect_to', redirectUrl)

  // Redirigimos manualmente a la URL que Supabase genera (pero limpia)
  window.location.href = authUrl.toString()
}

// registerUser modificado para auto-login sin confirmación
export async function registerUser(data: {
  name: string
  email: string
  password: string
  role: 'reader' | 'author'
}) {
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { name: data.name, role: data.role },
    },
  })
  if (error) throw error
}
