'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Edit, Eye, Trash, Plus, X } from 'lucide-react';
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
  deleted_at?: string | null;
};

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Modal emergente pantalla completa — estilos inline para que siempre se muestre correctamente
function ConfirmModal({
  open,
  title = 'Confirmar acción',
  description = '¿Estás seguro?',
  confirmLabel = 'Sí, eliminar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 20,
  };

  const boxStyle: React.CSSProperties = {
    width: 'min(720px, 96%)',
    background: 'var(--bg-card, #0f172a)', // intenta respetar tema oscuro si existe
    color: 'var(--text, #fff)',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 10px 30px rgba(2,6,23,0.6)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };

  const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
  const actionsStyle: React.CSSProperties = { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 };

  return (
    <div style={backdropStyle} role="dialog" aria-modal="true" aria-label={title}>
      <motion.div style={boxStyle} initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className={styles.iconBtn ?? ''} onClick={onCancel} aria-label="Cerrar" style={{ background: 'transparent', border: 'none', color: 'inherit' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: 0, opacity: 0.95 }}>{description}</p>

        <div style={actionsStyle}>
          <button
            className={`${styles.btn ?? ''} ${styles.cancel ?? ''}`}
            onClick={onCancel}
            disabled={loading}
            style={{ padding: '8px 12px', borderRadius: 8 }}
          >
            {cancelLabel}
          </button>

          <button
            className={`${styles.btn ?? ''} ${styles.delete ?? ''}`}
            onClick={onConfirm}
            disabled={loading}
            style={{ padding: '8px 12px', borderRadius: 8 }}
          >
            {loading ? 'Eliminando...' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function MisHistorias() {
  const router = useRouter();

  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [newStory, setNewStory] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState<{ id: string; title: string } | null>(null);

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
          .is('deleted_at', null)
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
        deleted_at: null,
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

  // abrir modal (pantalla emergente)
  const confirmDelete = (id: string, title: string) => {
    setPendingDeleteTarget({ id, title });
    setModalOpen(true);
  };

  // Llamada a la RPC atómica (optimistic UI)
  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteTarget) return;
    const id = pendingDeleteTarget.id;
    setModalOpen(false);
    setDeletingId(id);

    const prevStories = [...stories];
    setStories(prev => prev.filter(s => s.id !== id)); // optimistic UI

    try {
      // Llama a RPC atómica definida en la DB
      const { error } = await supabase.rpc('soft_delete_story_and_chapters', { p_story_id: id });
      if (error) throw error;

      // OK: la BD hizo la cascada atómica
    } catch (err: any) {
      console.error('RPC soft-delete failed:', err);
      // show helpful message
      const msg = err?.message ?? JSON.stringify(err);
      alert('No se pudo eliminar la historia: ' + msg + '. Revirtiendo cambios en la UI.');
      setStories(prevStories); // revertir UI
    } finally {
      setDeletingId(null);
      setPendingDeleteTarget(null);
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
                <div className={styles.createdLine}>
                  <strong>Creado:</strong> {new Date(st.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>

              <span className={`${styles.badge} ${st.status === 'published' ? styles.badgePublished : styles.badgeDraft}`}>
                {st.status === 'published' ? 'Publicado' : 'Privada'}
              </span>
            </div>

            <div className={styles.actions}>
              <button className={`${styles.btn} ${styles.view}`} onClick={() => router.push(`/biblioteca/obra/${st.id}`)}>
                <Eye size={18} /> Ver
              </button>

              <button className={`${styles.btn} ${styles.edit}`} onClick={() => router.push(`/escritura/capitulos/${st.id}`)}>
                <Edit size={18} /> Editar
              </button>

              <button
                className={`${styles.btn} ${styles.delete}`}
                onClick={() => confirmDelete(st.id, st.title)}
                disabled={deletingId === st.id}
              >
                {deletingId === st.id ? 'Eliminando...' : <><Trash size={18} /> Eliminar</>}
              </button>
            </div>
          </motion.div>
        ))}
      </section>

      <ConfirmModal
        open={modalOpen}
        title="Eliminar historia"
        description={pendingDeleteTarget ? `¿Eliminar "${pendingDeleteTarget.title}"? Esto ocultará la historia y sus capítulos asociados.` : '¿Eliminar esta historia?'}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        loading={!!deletingId}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => { setModalOpen(false); setPendingDeleteTarget(null); }}
      />
    </main>
  );
}
