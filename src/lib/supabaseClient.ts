// lib/supabaseClient.ts
// Singleton supabase client to prevent multiple GoTrueClient instances (HMR/dev-safe)
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env');
}

declare global {
  // attach to globalThis to survive HMR in dev
  // eslint-disable-next-line no-var
  var __supabase_client__: SupabaseClient | undefined;
}

const getClient = (): SupabaseClient => {
  if (typeof window === 'undefined') {
    // server: ephemeral client (won't read browser storage)
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  if (!globalThis.__supabase_client__) {
    globalThis.__supabase_client__ = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return globalThis.__supabase_client__;
};

const supabase = getClient();

export default supabase;
