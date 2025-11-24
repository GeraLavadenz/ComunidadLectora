// lib/supabaseClient.ts
// Singleton supabase client to prevent multiple GoTrueClient instances (HMR/dev-safe)
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function ensureEnv(name: string, v: string | undefined): string {
  if (!v) throw new Error(`Falta ${name} en .env (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)`);
  return v;
}

const SUPABASE_URL = ensureEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
const SUPABASE_ANON_KEY = ensureEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Para sobrevivir a HMR en desarrollo (evita múltiples GoTrueClient)
declare global {
  // eslint-disable-next-line no-var
  var __supabase_client__: SupabaseClient | undefined;
}

/**
 * getClient()
 * - en server (undefined window) devuelve una instancia efímera (no usa storage)
 * - en browser devuelve singleton guardado en globalThis para evitar múltiples instancias
 */
export const getClient = (): SupabaseClient => {
  if (typeof window === 'undefined') {
    // server: ephemeral client (won't read browser storage)
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      // Opcional: puedes añadir fetch, headers u otros ajustes aquí
    });
  }

  if (!globalThis.__supabase_client__) {
    globalThis.__supabase_client__ = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      // Opcional: configura auth.options o headers si lo necesitas
      // auth: { persistSession: true } // por defecto ya persiste en storage
    });
  }

  return globalThis.__supabase_client__;
};

// instancia exportada (por defecto)
const supabase = getClient();

// Exportamos tanto default como named para compatibilidad con importaciones variadas
export default supabase;
export { supabase, getClient };
