// MisHistorias.tsx
/*'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import styles from './styles/misHistorias.module.css';
import { motion } from 'framer-motion';
import { Edit, Eye, Trash, Plus } from 'lucide-react';

type StoryRow = {
  id: string;
  title: string;
  description?: string;
  author_id: string;
  created_at: string;
  updated_at?: string;
  cover_url?: string | null;
  // más campos según tu schema...
};

export default function MisHistorias() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newStory, setNewStory] = useState({ title: '', description: '' });

  // Carga sólo historias del usuario autenticado
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // si no hay user -> redirigir a login o mostrar mensaje
        setStories([]);
        setLoading(false);
        return;
      }

      const userId = user.id;
      const { data, error } = await supabase
        .from<StoryRow>('stories')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando historias:', error);
      } else if (mounted) {
        setStories(data || []);
      }
      setLoading(false);
    }

    load();

    // subscribir a cambios opcional (realtime)
    // const channel = supabase.channel('public:stories')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, payload => { load(); })
    //   .subscribe();
    // return () => { mounted = false; channel.unsubscribe(); };
    return () => { mounted = false; };
  }, [supabase]);

  const handleCreate = async () => {
    // crear story en la tabla stories con author_id => Supabase lo guarda
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('Necesitas iniciar sesión para crear una historia');
      setLoading(false);
      return;
    }

    const insert = {
      title: newStory.title || 'Historia sin título',
      description: newStory.description || null,
      author_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('stories').insert([insert]).select().single();

    if (error) {
      console.error('Error creando story:', error);
      alert('Error al crear historia');
      setLoading(false);
      return;
    }

    // actualizar UI (optimista)
    setStories((prev) => [data as StoryRow, ...prev]);
    setNewStory({ title: '', description: '' });
    setShowForm(false);
    setLoading(false);

    // redirigir a la edición de capítulos (ajusta ruta según tu app)
    router.push(`/escritura/capitulos/${data.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta historia? Esta acción no se puede deshacer.')) return;
    // opcional: verificar autor en backend (policy row-level recommended)
    const { error } = await supabase.from('stories').delete().eq('id', id).throwOnError();
    if (error) {
      console.error('Error eliminando story:', error);
      alert('No se pudo eliminar');
      return;
    }
    setStories((s) => s.filter((st) => st.id !== id));
  };

  const handleEdit = (id: string) => {
    router.push(`/escritura/capitulos/${id}`);
  };

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
*/
'use client';
import React, { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default function DebugAuth() {
  const supabase = createBrowserSupabaseClient();
  const [status, setStatus] = useState({ loading: true, user: null as any, session: null as any, err: null as any });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1) Session actual
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        console.log('getSession =>', sessionData, sessionErr);

        // 2) Usuario
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        console.log('getUser =>', userData, userErr);

        // 3) Escuchar cambios de auth (login / logout / refresh)
        const { data: sub } = supabase.auth.onAuthStateChange((event, payload) => {
          console.log('[AUTH EVENT]', event, payload);
          // opcional: forzar refetch de sesión/usuario
          supabase.auth.getSession().then(r => console.log('session after event =>', r));
        });

        if (mounted) setStatus({ loading: false, user: userData?.user ?? null, session: sessionData?.session ?? null, err: sessionErr || userErr });
        return () => sub?.subscription?.unsubscribe?.();
      } catch (err) {
        if (mounted) setStatus(s => ({ ...s, loading: false, err }));
      }
    })();

    return () => { mounted = false; };
  }, [supabase]);

  if (status.loading) return <div>Comprobando sesión...</div>;

  return (
    <div style={{ padding: 12, border: '1px solid #666', borderRadius: 8 }}>
      <h4>Debug Auth</h4>
      <div><strong>Usuario:</strong> {status.user ? `${status.user.email} (${status.user.id})` : '— ninguno —'}</div>
      <div><strong>Session:</strong> {status.session ? 'OK' : '— no hay sesión —'}</div>
      <div><strong>Error:</strong> {status.err ? JSON.stringify(status.err) : 'ninguno'}</div>
      <p style={{marginTop:8,fontSize:12,color:'#bbb'}}>Mira la consola para ver los eventos onAuthStateChange y getSession/getUser.</p>
    </div>
  );
}
