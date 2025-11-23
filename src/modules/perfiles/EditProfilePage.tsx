'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Profile = {
  id: string;
  username?: string;
  display_name?: string;
  email?: string;
  avatar_url?: string | null;
  bio?: string | null;
  role?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function EditProfilePage() {
  const supabase = createClientComponentClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        setMessage('No se encontró usuario autenticado.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id,username,display_name,email,avatar_url,bio,role,is_active,created_at,updated_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error(error);
        setMessage('Error cargando perfil.');
      } else if (mounted) {
        setProfile(data as Profile);
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function uploadAvatar(profileId: string) {
    if (!avatarFile) return profile?.avatar_url ?? null;
    const ext = avatarFile.name.split('.').pop();
    const filePath = `avatars/${profileId}.${ext}`;
    // Ajusta el bucket si no es 'public'
    const { error: upErr } = await supabase.storage.from('public').upload(filePath, avatarFile, {
      upsert: true,
    });
    if (upErr) {
      throw upErr;
    }
    const { data: urlData } = supabase.storage.from('public').getPublicUrl(filePath);
    return urlData.publicUrl;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);

    try {
      const avatar_url = await uploadAvatar(profile.id);
      const updates = {
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url,
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (error) throw error;

      setMessage('Perfil guardado ✅');
      // actualizar timestamp/estado localmente
      setProfile((p) => (p ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
    } catch (err) {
      console.error(err);
      setMessage('Error guardando perfil.');
    } finally {
      setSaving(false);
      // pequeña limpieza del input file si se guardó
      setAvatarFile(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-gray-400">Cargando perfil…</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <motion.header initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
        <h1 className="text-3xl font-semibold mb-1">Editar perfil</h1>
        <p className="text-sm text-gray-400">Actualiza tu información pública — minimal y con detalle.</p>
      </motion.header>

      <motion.form
        onSubmit={handleSave}
        className="mt-6 bg-black/40 p-6 rounded-2xl shadow-md backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
          <div className="flex flex-col items-center gap-3">
            <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-500 text-2xl">{(profile?.display_name || 'U').charAt(0)}</div>
              )}
            </div>

            <label className="block text-xs text-gray-400">Cambiar avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              className="text-sm w-full"
            />
            <div className="text-xs text-gray-500 mt-1 text-center">PNG/JPG. Recomendado 512x512</div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-400">Nombre de usuario</label>
            <input
              value={profile?.username ?? ''}
              disabled
              className="w-full mt-1 p-3 rounded-lg bg-transparent border border-gray-700 text-white"
            />

            <label className="block text-xs text-gray-400 mt-4">Nombre para mostrar</label>
            <input
              value={profile?.display_name ?? ''}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              className="w-full mt-1 p-3 rounded-lg bg-transparent border border-gray-700 text-white"
            />

            <label className="block text-xs text-gray-400 mt-4">Bio</label>
            <textarea
              value={profile?.bio ?? ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
              className="w-full mt-1 p-3 rounded-lg bg-transparent border border-gray-700 text-white"
            />

            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-400">Última actualización: {profile?.updated_at ? new Date(profile.updated_at).toLocaleString() : '—'}</div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    // cancelar cambios localmente re-cargando datos simples
                    setMessage(null);
                    setAvatarFile(null);
                    // reload profile from db quickly
                    (async () => {
                      const { data, error } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
                      if (!error) setProfile(data as Profile);
                    })();
                  }}
                  className="px-3 py-2 rounded-md border border-gray-700 text-sm"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-[1.02] transform transition text-white font-medium"
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </div>

            {message && <div className="mt-4 text-sm text-gray-300">{message}</div>}
          </div>
        </div>
      </motion.form>
    </div>
  );
}
