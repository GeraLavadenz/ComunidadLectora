'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import supabase from '@/lib/supabaseClient';
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
   * Upload: intenta Cloudinary -> si falla o no hay vars -> Supabase Storage fallback
   */
  async function uploadAvatar(profileId: string) {
    if (!avatarFile) {
      console.log('No hay archivo de avatar seleccionado — manteniendo avatar actual.');
      return profile?.avatar_url ?? null;
    }

    // Variables público-cliente para Cloudinary
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    console.log('DEBUG env CLOUD_NAME:', CLOUD_NAME);
    console.log('DEBUG env UPLOAD_PRESET:', UPLOAD_PRESET);
    console.log('DEBUG isClient:', typeof window !== 'undefined');

    // Fallback: subir a Supabase Storage (tu lógica original)
    async function uploadToSupabaseFallback() {
      try {
        const ext = avatarFile.name.split('.').pop();
        const filePath = `avatars/${profileId}.${ext}`;
        console.log('Subiendo a Supabase (fallback) ->', filePath);

        const { error: upErr } = await supabase.storage.from('public').upload(filePath, avatarFile, {
          upsert: true,
        });

        if (upErr) {
          console.error('Supabase upload error:', upErr);
          throw upErr;
        }

        const { data: urlData } = supabase.storage.from('public').getPublicUrl(filePath);
        console.log('Supabase fallback upload OK ->', urlData.publicUrl);
        return urlData.publicUrl;
      } catch (err) {
        console.error('Fallback Supabase upload failed:', err);
        throw err;
      }
    }

    // Si faltan variables, usar fallback inmediatamente
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      console.warn('Cloudinary env missing — usando Supabase fallback.');
      return await uploadToSupabaseFallback();
    }

    // Intentar subir a Cloudinary
    try {
      const formData = new FormData();
      formData.append('file', avatarFile);
      formData.append('upload_preset', UPLOAD_PRESET);
      // usamos public_id y folder para organizar en Cloudinary si está permitido por tu preset
      formData.append('public_id', `avatars/${profileId}`);
      formData.append('folder', 'avatars');

      console.log('Intentando subir a Cloudinary...');

      const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Cloudinary upload failed: ${resp.status} ${txt}`);
      }

      const json = await resp.json();
      console.log('Cloudinary upload OK ->', json.secure_url);
      return json.secure_url as string;
    } catch (err) {
      console.error('Error subiendo a Cloudinary, intentando fallback a Supabase:', err);
      // Caer al fallback si Cloudinary falla
      return await uploadToSupabaseFallback();
    }
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
      setProfile((p) => (p ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
    } catch (err) {
      console.error(err);
      setMessage('Error guardando perfil.');
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
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} className="file-input" />
            <div className="helper">PNG/JPG. Recomendado 512x512</div>
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

                <button type="submit" disabled={saving} className="btn btn-primary">
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
