'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import '../styles/leer.css';

type Chapter = {
  id: string;
  title: string | null;
  content: string | null;
  chapter_number: number | null;
};

export default function LeerPage() {
  const searchParams = useSearchParams();
  const storyId = searchParams?.get('storyId') ?? '';
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [chapterPercentage, setChapterPercentage] = useState(0);
  const [bookPercentage, setBookPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const STORAGE_KEY = `reading_progress::${storyId}`;
  const THEME_KEY = 'lectorTheme';

  /* --- THEME HANDLING --- */
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') ?? 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  };

  /* --- AUTH --- */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    })();
  }, []);

  /* --- FETCH CHAPTERS --- */
  useEffect(() => {
    if (!storyId) return;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from<Chapter>('chapters')
        .select('*')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: true });

      if (!error && data) {
        setChapters(data);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const p = JSON.parse(saved);
            setCurrentIdx(p.chapterIndex ?? 0);
            setBookPercentage(p.bookPercentage ?? 0);
          } catch {}
        }
      }
      setLoading(false);
    })();
  }, [storyId]);

  /* --- SAVE PROGRESS --- */
  const persist = useCallback(
    async (chapterId: string | null, pct: number, idx: number) => {
      const overall = Math.round(((idx + pct / 100) / Math.max(1, chapters.length)) * 100);

      setChapterPercentage(Math.round(pct));
      setBookPercentage(overall);

      const payload = {
        chapterIndex: idx,
        chapterId,
        chapterPercentage: pct,
        bookPercentage: overall,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

      if (userId) {
        await supabase.from('reading_progress').upsert(
          {
            user_id: userId,
            story_id: storyId,
            chapter_id: chapterId,
            percentage: overall,
          },
          { onConflict: ['user_id', 'story_id'] }
        );
      }
    },
    [chapters.length, storyId, userId]
  );

  /* --- SCROLL PROGRESS --- */
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const onScroll = () => {
      const pct = Math.min(100, (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = window.setTimeout(() => {
        persist(chapters[currentIdx]?.id ?? null, pct, currentIdx);
      }, 600);

      setChapterPercentage(Math.round(pct));
    };

    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [currentIdx, chapters, persist]);

  /* --- NAVIGATION --- */
  const goTo = (idx: number) => {
    setCurrentIdx(idx);
    persist(chapters[idx]?.id ?? null, 0, idx);
    setTimeout(() => contentRef.current?.scrollTo({ top: 0 }), 50);
  };

  /* --- MANUAL SAVE --- */
  const saveManual = () => {
    const chap = chapters[currentIdx];
    persist(chap?.id ?? null, chapterPercentage, currentIdx);

    const toast = document.createElement('div');
    toast.className = 'leer-toast';
    toast.textContent = 'Posición guardada ✔';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);
  };

  return (
    <div className="leer-container">

      <header className="leer-header">
        <div>
          <h1 className="leer-title">Lector</h1>
          <p className="leer-subtitle"></p>
        </div>

        <button className="leer-theme-btn glass" onClick={toggleTheme}>
          🌓 Tema
        </button>
      </header>

      <div className="leer-book-progress">
        <small>Progreso del libro</small>
        <div className="leer-bar-row">
          <div className="leer-progress" style={{ ['--progress' as any]: `${bookPercentage}%` }}></div>
          <span className="leer-pct">{bookPercentage}%</span>
        </div>
      </div>

      <div className="leer-toolbar">
        <div className="leer-select-group">
          <label>Capítulos</label>
          <select value={currentIdx} onChange={(e) => goTo(Number(e.target.value))}>
            {chapters.map((c, i) => (
              <option key={c.id} value={i}>
                {c.chapter_number ? `Cap. ${c.chapter_number} — ${c.title}` : c.title ?? `Capítulo ${i + 1}`}
              </option>
            ))}
          </select>
        </div>

        <div className="leer-nav">
          <button className="glass" disabled={currentIdx <= 0} onClick={() => goTo(currentIdx - 1)}>
            ◀
          </button>
          <button className="glass primary" disabled={currentIdx >= chapters.length - 1} onClick={() => goTo(currentIdx + 1)}>
            ▶
          </button>
        </div>
      </div>

      <div className="leer-main">
        <aside className="leer-aside glass">

          <h3>Índice</h3>

          <ul>
            {chapters.map((c, i) => (
              <li key={c.id}>
                <button className={i === currentIdx ? 'active glass' : 'glass'} onClick={() => goTo(i)}>
                  <span className="num">{c.chapter_number ?? i + 1}</span>
                  <span className="txt">{c.title ?? 'Sin título'}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="leer-chapter-progress">
            <small>Progreso del capítulo</small>
            <div className="leer-progress" style={{ ['--progress' as any]: `${chapterPercentage}%` }}></div>

            <div className="leer-save-wrap">
              <button className="outline glass" onClick={saveManual}>Guardar</button>
              <span className="leer-pct">{chapterPercentage}%</span>
            </div>
          </div>
        </aside>

        <main className="leer-reader glass">
          {loading ? (
            <div className="leer-empty">Cargando…</div>
          ) : chapters.length === 0 ? (
            <div className="leer-empty">No hay capítulos</div>
          ) : (
            <>
              <h2 className="leer-chapter-title">{chapters[currentIdx]?.title}</h2>
              <div ref={contentRef} className="leer-content" dangerouslySetInnerHTML={{ __html: chapters[currentIdx]?.content ?? '(Sin contenido)' }} />
            </>
          )}
        </main>
      </div>

    </div>
  );
}
