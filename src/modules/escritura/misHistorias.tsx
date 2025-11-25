'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Edit, Eye, Trash, Plus } from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import styles from './styles/misHistorias.module.css';

type StoryRow = {
  id: string;
  title: string;
  description?: string | null;
  author_id: string;
  created_at: string;
  updated_at?: string | null;
  status?: 'published' | 'draft' | string;
};

export default function MisHistorias() {
  const router = useRouter();

  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [newStory, setNewStory] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      if (mounted) setAuthReady(true);
    });

    (async () => {
      const s = await supabase.auth.getSession();
      if (mounted) setAuthReady(!!s?.data?.session);
    })();

    return () => {
      mounted = false;
      try { listener?.subscription?.unsubscribe?.(); } catch {}
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!authReady) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const s = await supabase.auth.getSession();
        const user = s?.data?.session?.user;
        if (!user) {
          if (mounted) setStories([]);
          return;
        }

        const { data, error } = await supabase
          .from<StoryRow>('stories')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });

        if (!mounted) return;

        if (error) {
          console.error('Error cargando historias:', error);
          setStories([]);
        } else {
          setStories(data ?? []);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setStories([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [authReady]);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return alert('Inicia sesión.');

      if (!newStory.title.trim()) return alert('Escribe un título.');

      const insert = {
        title: newStory.title.trim(),
        description: newStory.description.trim() || null,
        author_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'draft',
      };

      const { data, error } = await supabase.from('stories').insert([insert]).select().single();
      if (error) throw error;

      setStories(prev => [data as StoryRow, ...prev]);
      setShowForm(false);
      setNewStory({ title: '', description: '' });
      router.push(`/escritura/capitulos/${data.id}`);
    } catch (err) {
      console.error(err);
      alert('No se pudo crear la historia.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar historia?')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('stories').delete().eq('id', id);
      if (error) throw error;
      setStories(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la historia.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!authReady) {
    return (
      <main className={styles.container}>
        <h1 className={styles.title}>Mis Historias</h1>
        <div className={styles.noSession}>Cargando sesión…</div>
      </main>
    );
  }

  if (loading) return <div className={styles.container}>Cargando...</div>;

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Mis Historias</h1>

      <div className={styles.createSection}>
        <button className={`${styles.btn} ${styles.create}`} onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Crear Nueva Historia
        </button>
      </div>

      {showForm && (
        <motion.div className={styles.formContainer} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3>Crear Nueva Historia</h3>
          <div className={styles.formGroup}>
            <label>Título:</label>
            <input value={newStory.title} onChange={e => setNewStory({ ...newStory, title: e.target.value })} />
          </div>
          <div className={styles.formGroup}>
            <label>Descripción:</label>
            <textarea value={newStory.description} onChange={e => setNewStory({ ...newStory, description: e.target.value })} />
          </div>
          <div className={styles.formActions}>
            <button className={`${styles.btn} ${styles.save}`} onClick={handleCreate}>{creating ? 'Creando…' : 'Crear'}</button>
            <button className={`${styles.btn} ${styles.cancel}`} onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </motion.div>
      )}

      <section className={styles.grid}>
        {stories.length === 0 && <div>No tienes historias aún.</div>}

        {stories.map((st, idx) => (
          <motion.div
            key={st.id}
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardMeta}>
                <h2 className={styles.cardTitle}>{st.title}</h2>
                {/* fecha creada */}
                <div className={styles.createdLine}>
                  <strong>Creado:</strong> {new Date(st.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>

              {/* SOLO BADGE (Privada / Publicado) */}
              <span className={`${styles.badge} ${st.status === 'published' ? styles.badgePublished : styles.badgeDraft}`}>
                {st.status === 'published' ? 'Publicado' : 'Privada'}
              </span>
            </div>

            {/* NO DESCRIPTION SHOWN */}

            <div className={styles.actions}>
              <button className={`${styles.btn} ${styles.view}`} onClick={() => router.push(`/biblioteca/obra/${st.id}`)}>
                <Eye size={18} /> Ver
              </button>

              <button className={`${styles.btn} ${styles.edit}`} onClick={() => router.push(`/escritura/capitulos/${st.id}`)}>
                <Edit size={18} /> Editar
              </button>

              <button className={`${styles.btn} ${styles.delete}`} onClick={() => handleDelete(st.id)} disabled={deletingId === st.id}>
                {deletingId === st.id ? 'Eliminando...' : <><Trash size={18} /> Eliminar</>}
              </button>
            </div>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
