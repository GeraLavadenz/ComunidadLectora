  // lib/supabaseClient.ts
  // Singleton supabase client to prevent multiple GoTrueClient instances (HMR/dev-safe)
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Removed import of createMiddlewareClient from deprecated @supabase/ssr package

function ensureEnv(name: string, v: string | undefined): string {
  if (!v) throw new Error(`Falta ${name} en .env (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)`);
  return v;
}

const SUPABASE_URL = ensureEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
const SUPABASE_ANON_KEY = ensureEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

declare global {
  var __supabase_client__: SupabaseClient | undefined;
}

const getClient = (): SupabaseClient => {
  if (typeof window === 'undefined') {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  if (!globalThis.__supabase_client__) {
    globalThis.__supabase_client__ = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return globalThis.__supabase_client__;
};

// Removed createSupabaseMiddlewareClient since createMiddlewareClient is not part of @supabase/ssr

const supabase = getClient();

export default supabase;
export { supabase, getClient };
