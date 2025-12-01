// app/components/FiltersPanel.tsx
'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronDown } from 'lucide-react';
import Chip from './Chip';
import '../styles/FiltersPanel.css';

function useDebounced<ValueT>(value: ValueT, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

type TagRow = { id: string; name: string; type: 'genre' | 'tag' | string };
type RawTagRow = { id?: string | number; name?: string; slug?: string; title?: string; [k: string]: unknown };

interface FiltersPanelProps {
  allGenres?: Array<{ id: string; name: string }>;
  allTags?: Array<{ id: string; name: string }>;
  selectedGenres: Set<string> | string[];
  selectedTags: Set<string> | string[];
  author: string;
  onToggleGenre: (id: string) => void;
  onToggleTag: (id: string) => void;
  onAuthor: (s: string) => void;
  genreFromUrl?: { id: string; name: string } | null;
  fetchFromServer?: boolean;
}

export default function FiltersPanel({
  allGenres: allGenresProp,
  allTags: allTagsProp,
  selectedGenres,
  selectedTags,
  author,
  onToggleGenre,
  onToggleTag,
  onAuthor,
  genreFromUrl,
  fetchFromServer = true,
}: FiltersPanelProps) {
  const [open, setOpen] = useState(true);
  const [fetchedGenres, setFetchedGenres] = useState<TagRow[] | null>(null);
  const [fetchedTags, setFetchedTags] = useState<TagRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const selectedGenresSet = useMemo(
    () => (selectedGenres instanceof Set ? selectedGenres : new Set(selectedGenres ?? [])),
    [selectedGenres]
  );

  const selectedTagsSet = useMemo(
    () => (selectedTags instanceof Set ? selectedTags : new Set(selectedTags ?? [])),
    [selectedTags]
  );

  const debouncedAuthor = useDebounced(author, 300);
  useEffect(() => {
    onAuthor(debouncedAuthor);
  }, [debouncedAuthor, onAuthor]);

  const normalizeRows = (rows: RawTagRow[], type: string): TagRow[] =>
    (rows ?? []).map((r, i) => {
      const rawId = r.id ?? r.slug ?? r.name ?? `${type}-${i}-${Math.random().toString(36).slice(2, 6)}`;
      const name = r.name ?? r.title ?? String(rawId);
      return { id: String(rawId), name: String(name), type };
    });

  const fetchMeta = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/library/meta');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!mountedRef.current) return;
      setFetchedGenres(normalizeRows(json.genres ?? [], 'genre'));
      setFetchedTags(normalizeRows(json.tags ?? [], 'tag'));
    } catch (_) {
      if (mountedRef.current) {
        setFetchedGenres([]);
        setFetchedTags([]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchFromServer) fetchMeta();
  }, [fetchFromServer, fetchMeta]);

  const genresList = useMemo(() => {
    if (allGenresProp?.length)
      return allGenresProp.map((g) => ({ id: String(g.id), name: g.name, type: 'genre' as const }));
    return fetchedGenres ?? [];
  }, [allGenresProp, fetchedGenres]);

  const tagsList = useMemo(() => {
    if (allTagsProp?.length)
      return allTagsProp.map((t) => ({ id: String(t.id), name: t.name, type: 'tag' as const }));
    return fetchedTags ?? [];
  }, [allTagsProp, fetchedTags]);

  return (
    <div className="filters-panel">
      <button
        onClick={() => setOpen((v) => !v)}
        className="filters-panel-button"
        aria-expanded={open}
        aria-controls="filters-panel-content"
        type="button"
      >
        <div>
          <Filter aria-hidden />
          <span>Filtros</span>
        </div>
        <ChevronDown aria-hidden />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="filters-panel-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.35 }}
            className="filters-panel-content"
          >
            {/* Autor */}
            <div>
              <label htmlFor="filters-author" className="filters-panel-label">
                Autor
              </label>
              <input
                id="filters-author"
                value={author}
                onChange={(e) => onAuthor(e.target.value)}
                placeholder="Filtrar por autor..."
                className="filters-panel-input"
                aria-label="Filtrar por autor"
              />
            </div>

            {/* Géneros */}
            {!genreFromUrl ? (
              <div>
                <div className="filters-panel-section-title">Géneros</div>

                {loading ? (
                  <div>Cargando…</div>
                ) : genresList.length === 0 ? (
                  <div>No hay géneros</div>
                ) : (
                  <div className="filters-panel-chips" role="list" aria-label="Géneros">
                    {genresList.map((g) => (
                      <div role="listitem" key={`genre-${String(g.id)}`}>
                        <Chip label={g.name} active={selectedGenresSet.has(String(g.id))} onClick={() => onToggleGenre(String(g.id))} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="filters-panel-section-title">Género</div>
                <div className="filters-panel-chips">
                  <Chip label={genreFromUrl.name} active onClick={() => {}} />
                </div>
              </div>
            )}

            {/* Etiquetas */}
            <div>
              <div className="filters-panel-section-title">Etiquetas</div>

              {loading ? (
                <div>Cargando…</div>
              ) : tagsList.length === 0 ? (
                <div>No hay etiquetas</div>
              ) : (
                <div className="filters-panel-chips" role="list" aria-label="Etiquetas">
                  {tagsList.map((t) => (
                    <div role="listitem" key={`tag-${String(t.id)}`}>
                      <Chip label={t.name} active={selectedTagsSet.has(String(t.id))} onClick={() => onToggleTag(String(t.id))} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
