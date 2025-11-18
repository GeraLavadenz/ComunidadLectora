// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Recuperamos el rol que guardamos antes del login
  const preferredRole = typeof window !== 'undefined' 
    ? localStorage.getItem('preferred_role') 
    : null

  localStorage.removeItem('preferred_role') // lo limpiamos

  // Redirigimos según el rol o a donde quieras
  return NextResponse.redirect(
    preferredRole === 'author' 
      ? `${requestUrl.origin}/dashboard` 
      : `${requestUrl.origin}/biblioteca`
  )
}