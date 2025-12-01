'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import supabase from '@/lib/supabaseClient';
import { uploadImageUnsigned } from '@/lib/cloudinaryClient'; // <-- reutilizamos el helper de portadas
import './styles/EditProfile.css';

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
  }, []);

  /**
   * Subir avatar reutilizando uploadImageUnsigned (mismo flujo que portadas)
   * Devuelve el URL (secure_url) o mantiene el avatar actual si no hay archivo.
   */
  async function uploadAvatarToCoverFlow(profileId: string) {
    if (!avatarFile) {
      console.log('No hay archivo de avatar seleccionado — manteniendo avatar actual.');
      return profile?.avatar_url ?? null;
    }

    setUploadingAvatar(true);
    try {
      // reusa el helper que ya usas para portadas
      const res = await uploadImageUnsigned(avatarFile);
      // Igual lógica de extracción que en capitulos.tsx
      const url =
        (res as { url?: string }).url ||
        (res as { secure_url?: string }).secure_url ||
        (res as { raw?: { secure_url?: string } }).raw?.secure_url;

      if (!url) {
        console.error('uploadImageUnsigned no devolvió URL válida', res);
        throw new Error('No se obtuvo URL de Cloudinary al subir avatar.');
      }

      console.log('Avatar subido ->', url);
      return url as string;
    } catch (err) {
      console.error('Error subiendo avatar usando uploadImageUnsigned', err);
      throw err;
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);

    try {
      const avatar_url = await uploadAvatarToCoverFlow(profile.id);

      const updates = {
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url,
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (error) throw error;

      setMessage('Perfil guardado ✅');
      setProfile((p) => (p ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Error guardando perfil.';
      setMessage(errMsg);
    } finally {
      setSaving(false);
      setAvatarFile(null);
    }
  }

  if (loading) {
    return (
      <div className="centered-container">
        <div className="pulse">Cargando perfil…</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <motion.header initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
        <h1 className="title">Editar perfil</h1>
        <p className="subtitle">Actualiza tu información pública — minimal y con detalle.</p>
      </motion.header>

      <motion.form onSubmit={handleSave} className="form-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <div className="grid">
          <div className="left-col">
            <div className="avatar-wrap" aria-hidden={!!profile?.avatar_url ? 'false' : 'true'}>
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="avatar" className="avatar-image" />
              ) : (
                <div className="avatar-fallback">{(profile?.display_name || 'U').charAt(0)}</div>
              )}
            </div>

            <label className="label">Cambiar avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              className="file-input"
            />
            <div className="helper">PNG/JPG. Recomendado 512x512</div>
            {uploadingAvatar && <div className="helper">Subiendo avatar...</div>}
          </div>

          <div className="right-col">
            <label className="label">Nombre de usuario</label>
            <input value={profile?.username ?? ''} disabled className="input disabled" />

            <label className="label">Nombre para mostrar</label>
            <input value={profile?.display_name ?? ''} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} className="input" />

            <label className="label">Bio</label>
            <textarea value={profile?.bio ?? ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={4} className="textarea" />

            <div className="row-between">
              <div className="meta">Última actualización: {profile?.updated_at ? new Date(profile.updated_at).toLocaleString() : '—'}</div>

              <div className="actions">
                <button
                  type="button"
                  onClick={() => {
                    setMessage(null);
                    setAvatarFile(null);
                    (async () => {
                      const { data, error } = await supabase.from('profiles').select('*').eq('id', profile!.id).single();
                      if (!error) setProfile(data as Profile);
                    })();
                  }}
                  className="btn btn-ghost"
                >
                  Cancelar
                </button>

                <button type="submit" disabled={saving || uploadingAvatar} className="btn btn-primary">
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </div>

            {message && <div className="message">{message}</div>}
          </div>
        </div>
      </motion.form>
    </div>
  );
}
