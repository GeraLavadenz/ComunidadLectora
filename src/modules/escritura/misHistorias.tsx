// components/MisHistorias.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Edit, Eye, Trash, Plus } from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import styles from './styles/misHistorias.module.css'; // ajusta ruta si hace falta

type StoryRow = {
  id: string;
  title: string;
  description?: string | null;
  author_id: string;
  created_at: string;
  updated_at?: string | null;
};

export default function MisHistorias() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false); // espera inicialización auth
  const [showForm, setShowForm] = useState(false);
  const [newStory, setNewStory] = useState({ title: '', description: '' });

  // 1) Escuchar estado auth (incluye INITIAL_SESSION)
  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, _payload) => {
      console.log('[AUTH EVENT MisHistorias]', _event, _payload);
      if (!mounted) return;
      // Si llegó any event, intentamos marcar authReady (seguimos comprobando getSession)
      setAuthReady(true);
    });

    // Intentar leer sesión inicial (puede ser sincrónica en storage)
    (async () => {
      try {
        const s = await supabase.auth.getSession();
        console.log('MisHistorias initial getSession =>', s);
        if (s?.data?.session) setAuthReady(true);
        else setAuthReady(false);
      } catch (e) {
        console.error('getSession error', e);
        setAuthReady(false);
      }
    })();

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // 2) Cuando authReady -> cargar historias del user
  useEffect(() => {
    let mounted = true;

    if (!authReady) {
      setLoading(false);
      return () => { mounted = false; };
    }

    (async () => {
      setLoading(true);
      try {
        const s = await supabase.auth.getSession();
        const user = s?.data?.session?.user;
        if (!user) {
          setStories([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from<StoryRow>('stories')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error cargando historias:', error);
          setStories([]);
        } else if (mounted) {
          setStories(data ?? []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [authReady]);

  // Crear historia
  const handleCreate = async () => {
    setLoading(true);
    try {
      const s = await supabase.auth.getSession();
      const user = s?.data?.session?.user;
      if (!user) {
        setLoading(false);
        return alert('Necesitas iniciar sesión para crear una historia.');
      }
      if (!newStory.title.trim()) {
        setLoading(false);
        return alert('Ponle un título a la historia.');
      }

      const insert = {
        title: newStory.title.trim(),
        description: newStory.description?.trim() ?? null,
        author_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('stories').insert([insert]).select().single();
      if (error) throw error;

      setStories((prev) => [data as StoryRow, ...prev]);
      setNewStory({ title: '', description: '' });
      setShowForm(false);
      router.push(`/escritura/capitulos/${(data as any).id}`);
    } catch (err) {
      console.error('Error creando historia:', err);
      alert('No se pudo crear la historia.');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar historia
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta historia? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('stories').delete().eq('id', id);
      if (error) throw error;
      setStories((s) => s.filter((st) => st.id !== id));
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('No se pudo eliminar la historia.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => router.push(`/escritura/capitulos/${id}`);

  if (!authReady) {
    return (
      <main className={styles.container}>
        <h1 className={styles.title}>Mis Historias</h1>
        <div className={styles.noSession}>
          Comprobando autenticación... si hiciste login hace poco espera 1–2s o recarga la página.
        </div>
      </main>
    );
  }

  if (loading) return <div className={styles.container}>Cargando...</div>;

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Mis Historias</h1>

      <div className={styles.createSection}>
        <button className={`${styles.btn} ${styles.create}`} onClick={() => setShowForm((s) => !s)}>
          <Plus size={18} /> Crear Nueva Historia
        </button>
      </div>

      {showForm && (
        <motion.div className={styles.formContainer} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3>Crear Nueva Historia</h3>
          <div className={styles.formGroup}>
            <label>Título:</label>
            <input value={newStory.title} onChange={(e) => setNewStory({ ...newStory, title: e.target.value })} />
          </div>
          <div className={styles.formGroup}>
            <label>Descripción:</label>
            <textarea value={newStory.description} onChange={(e) => setNewStory({ ...newStory, description: e.target.value })} />
          </div>
          <div className={styles.formActions}>
            <button className={`${styles.btn} ${styles.save}`} onClick={handleCreate}>Crear Historia</button>
            <button className={`${styles.btn} ${styles.cancel}`} onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </motion.div>
      )}

      <section className={styles.grid}>
        {stories.length === 0 && <div>No tienes historias todavía.</div>}
        {stories.map((st, idx) => (
          <motion.div key={st.id} className={styles.card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <div className={styles.cardHeader}>
              <h2>{st.title}</h2>
              <span className={styles.badge}>Privada</span>
            </div>
            <p><strong>Creado:</strong> {new Date(st.created_at).toLocaleDateString('es-ES')}</p>
            <div className={styles.actions}>
              <button className={`${styles.btn} ${styles.view}`} onClick={() => router.push(`/biblioteca/obra/${st.id}`)}><Eye size={18}/> Ver</button>
              <button className={`${styles.btn} ${styles.edit}`} onClick={() => handleEdit(st.id)}><Edit size={18}/> Editar</button>
              <button className={`${styles.btn} ${styles.delete}`} onClick={() => handleDelete(st.id)}><Trash size={18}/> Eliminar</button>
            </div>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
