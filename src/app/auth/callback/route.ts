// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            const cookieStore = await cookies()
            return cookieStore.getAll()
          },
          async setAll(cookiesToSet) {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          }
        }
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Recuperamos el rol que guardamos antes del login
  const cookieStore = await cookies()
  const preferredRole = cookieStore.get('preferred_role')?.value

  // Limpiamos la cookie
  const response = NextResponse.redirect(
    preferredRole === 'author'
      ? `${requestUrl.origin}/dashboard`
      : `${requestUrl.origin}/biblioteca`
  )
  response.cookies.set('preferred_role', '', { maxAge: 0 })

  return response
}
