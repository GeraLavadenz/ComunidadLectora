'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import supabase from '@/lib/supabaseClient';

type StoryLite = {
  id: string;
  title?: string;
  chapters?: { number: number }[];
};

export default function CreateChapterModal({
  open,
  onClose,
  story,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  story: StoryLite | null;
  onCreated?: (newCh: any) => void;
}) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setSummary('');
      setContent('');
      setIsPublished(false);
      setSaving(false);
    }
  }, [open]);

  async function handleCreate() {
    if (!story) return alert('No hay historia seleccionada.');
    const nextNumber = (story.chapters || []).reduce((m, c) => Math.max(m, c.number || 0), 0) + 1;
    if (!title.trim()) return alert('El capítulo necesita título.');

    const payload = {
      story_id: story.id,
      chapter_number: nextNumber,
      title: title.trim(),
      summary: summary || null,
      content: content || null,
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    try {
      // Ajuste: no usamos .onConflict() porque tu cliente no lo soporta
      const { data, error } = await supabase.from('chapters').insert([payload]).select().single();
      if (error) throw error;

      const newCh = {
        id: data.id,
        number: data.chapter_number ?? data.number ?? nextNumber,
        title: data.title,
        summary: data.summary,
        content: data.content,
        isPublished: Boolean(data.is_published),
        publishedAt: data.published_at,
      };

      onCreated?.(newCh);
      onClose();
    } catch (err) {
      console.error('Create chapter error', err);
      alert('No se pudo crear el capítulo — mira la consola.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <motion.div
        className="modalCard"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="modalHeader">
          <h3>Crear nuevo capítulo</h3>
          <button className="btnIcon" onClick={onClose} title="Cerrar"><X /></button>
        </div>

        <div className="modalBody">
          <div className="formGroup">
            <label>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="formGroup">
            <label>Resumen</label>
            <textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>

          <div className="formGroup">
            <label>Contenido (opcional)</label>
            <textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
          </div>

          <div className="formGroup">
            <label className="switch">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
              <span>Publicar inmediatamente</span>
            </label>
          </div>
        </div>

        <div className="modalFooter">
          <button className="btn" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creando...' : 'Crear capítulo'}
          </button>
          <button className="btnGhost" onClick={onClose}>Cancelar</button>
        </div>
      </motion.div>
    </div>
  );
}
