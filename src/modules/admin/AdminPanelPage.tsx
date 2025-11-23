'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Profile = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

const ROLE_OPTIONS = ['reader', 'editor', 'admin'] as const;

export default function AdminPanelPage() {
  const supabase = createClientComponentClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id,username,display_name,email,avatar_url,role,is_active,created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        setMessage('Error cargando usuarios.');
      } else if (mounted) {
        setUsers((data as Profile[]) || []);
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.display_name ?? '').toLowerCase().includes(q) ||
        (u.username ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q)
    );
  }, [users, query]);

  async function toggleActive(userId: string, current?: boolean | null) {
    setActionLoading((s) => ({ ...s, [userId]: true }));
    try {
      const { error } = await supabase.from('profiles').update({ is_active: !current }).eq('id', userId);
      if (error) throw error;
      setUsers((prev) => prev.map((p) => (p.id === userId ? { ...p, is_active: !current } : p)));
      setMessage(null);
    } catch (err) {
      console.error(err);
      setMessage('No se pudo cambiar estado.');
    } finally {
      setActionLoading((s) => ({ ...s, [userId]: false }));
    }
  }

  async function changeRole(userId: string, newRole: string) {
    setActionLoading((s) => ({ ...s, [userId]: true }));
    try {
      if (!ROLE_OPTIONS.includes(newRole as any)) throw new Error('Rol inválido');
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      setUsers((prev) => prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p)));
      setMessage(null);
    } catch (err) {
      console.error(err);
      setMessage('No se pudo cambiar rol.');
    } finally {
      setActionLoading((s) => ({ ...s, [userId]: false }));
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-semibold">Panel de administración</h2>
        <p className="text-sm text-gray-400">Gestiona usuarios, roles y estados — diseño minimalista.</p>
      </motion.header>

      <div className="mt-6 flex items-center gap-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, usuario o email..."
          className="flex-1 p-3 rounded-lg bg-transparent border border-gray-700"
        />
        <button
          onClick={async () => {
            // refrescar manual
            setLoading(true);
            setMessage(null);
            const { data, error } = await supabase
              .from('profiles')
              .select('id,username,display_name,email,avatar_url,role,is_active,created_at')
              .order('created_at', { ascending: false });
            if (error) {
              setMessage('Error refrescando.');
              console.error(error);
            } else {
              setUsers(data as Profile[]);
            }
            setLoading(false);
          }}
          className="px-4 py-2 rounded-md border border-gray-700 text-sm"
        >
          Refrescar
        </button>
      </div>

      <div className="mt-6 bg-black/40 rounded-2xl p-4">
        {loading ? (
          <div className="p-6 text-gray-400">Cargando usuarios…</div>
        ) : (
          <>
            {message && <div className="text-sm text-red-400 mb-3">{message}</div>}

            <div className="divide-y divide-gray-800">
              <AnimatePresence>
                {filtered.map((u) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center flex-shrink-0">
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-gray-500">{(u.display_name || 'U').charAt(0)}</div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{u.display_name ?? '—'}</div>
                        <div className="text-xs text-gray-500 truncate">{u.email ?? '—'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={u.role ?? 'reader'}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="p-2 rounded-md bg-transparent border border-gray-700 text-sm"
                        disabled={!!actionLoading[u.id]}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => toggleActive(u.id, u.is_active)}
                        disabled={!!actionLoading[u.id]}
                        className={`px-3 py-1 rounded-full text-sm border ${
                          u.is_active ? 'bg-transparent border-green-500' : 'bg-red-600'
                        }`}
                      >
                        {actionLoading[u.id] ? '…' : u.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filtered.length === 0 && <div className="p-6 text-gray-500">No hay usuarios que coincidan.</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
