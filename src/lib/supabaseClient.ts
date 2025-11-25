// supabaseClient.ts (mejora HMR + protección extra)
import { createClient, SupabaseClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

declare global {
  // evitar colisiones en TS + HMR
  // eslint-disable-next-line no-var
  var __supabase_client__: SupabaseClient | undefined;
}

export const getClient = (): SupabaseClient => {
  if (typeof window === 'undefined') {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  // usar window/globalThis para singleton en el browser
  if (!(globalThis as any).__supabase_client__) {
    (globalThis as any).__supabase_client__ = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      // evita doble persistencia de sesión en pruebas si quieres:
      // auth: { persistSession: true }
    });
  }

  return (globalThis as any).__supabase_client__;
};

const supabase = getClient();
export default supabase;
export { supabase, getClient };
