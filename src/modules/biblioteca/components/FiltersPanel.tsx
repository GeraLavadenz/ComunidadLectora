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

  /** If true the component fetches data itself (default true) */
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
  const [error, setError] = useState<string | null>(null);

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

  // debounce author changes before notifying parent
  const debouncedAuthor = useDebounced(author, 300);
  useEffect(() => {
    onAuthor(debouncedAuthor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAuthor]);

  function getNameById(id: string, list: { id: string; name: string }[] | null | undefined) {
    if (!list || list.length === 0) return id;
    const found = list.find((x) => String(x.id) === String(id));
    return found ? found.name : id;
  }

  // Normalize to guarantee string ids and shape
  const normalizeRows = (rows: any[], type: string): TagRow[] =>
    (rows ?? []).map((r, idx) => {
      const rawId = r.id ?? r.slug ?? r.name ?? `${type}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
      const name = r.name ?? r.title ?? String(rawId);
      return { id: String(rawId), name: String(name), type };
    });

  const fetchMeta = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/library/meta');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // Expect { genres: [...], tags: [...] }
      const genres = normalizeRows(json.genres ?? [], 'genre');
      const tags = normalizeRows(json.tags ?? [], 'tag');

      if (!mountedRef.current) return;
      setFetchedGenres(genres);
      setFetchedTags(tags);
    } catch (err: any) {
      console.error('FiltersPanel.fetchMeta error:', err);
      if (mountedRef.current) {
        setError(err?.message ?? 'Error cargando datos');
        setFetchedGenres((prev) => prev ?? []); // avoid flicker by keeping null->[] consistent
        setFetchedTags((prev) => prev ?? []);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fetchFromServer) return;
    fetchMeta();
  }, [fetchFromServer, fetchMeta]);

  // prefer props if provided (props override only when non-empty)
  const genresList = useMemo(() => {
    if (allGenresProp && allGenresProp.length > 0)
      return allGenresProp.map((g) => ({ id: String(g.id), name: g.name, type: 'genre' as const }));
    return fetchedGenres ?? [];
  }, [allGenresProp, fetchedGenres]);

  const tagsList = useMemo(() => {
    if (allTagsProp && allTagsProp.length > 0)
      return allTagsProp.map((g) => ({ id: String(g.id), name: g.name, type: 'tag' as const }));
    return fetchedTags ?? [];
  }, [allTagsProp, fetchedTags]);

  const handleToggleGenre = useCallback((id: string) => onToggleGenre(id), [onToggleGenre]);
  const handleToggleTag = useCallback((id: string) => onToggleTag(id), [onToggleTag]);

  return (
    <div className="filters-panel">
      <button
        onClick={() => setOpen((v) => !v)}
        className="filters-panel-button"
        aria-expanded={open}
        aria-controls="filters-panel-content"
        type="button"
      >
        <div className="flex items-center gap-2">
          <Filter className="size-4" aria-hidden />
          <span className="font-medium">Filtros</span>
        </div>
        <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
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
            style={{ overflow: 'hidden' }}
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

            {/* Selected chips (show names, not IDs) */}
            <div className="filters-selected">
              {Array.from(selectedGenresSet).length > 0 && (
                <div className="filters-selected-group">
                  <div className="filters-selected-title">Géneros seleccionados</div>
                  <div className="filters-selected-chips">
                    {Array.from(selectedGenresSet).map((id) => {
                      const label = getNameById(id, genresList);
                      return (
                        <Chip
                          key={`selected-genre-${String(id)}`}
                          label={label}
                          active
                          onClick={() => handleToggleGenre(String(id))}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {Array.from(selectedTagsSet).length > 0 && (
                <div className="filters-selected-group">
                  <div className="filters-selected-title">Etiquetas seleccionadas</div>
                  <div className="filters-selected-chips">
                    {Array.from(selectedTagsSet).map((id) => {
                      const label = getNameById(id, tagsList);
                      return (
                        <Chip
                          key={`selected-tag-${String(id)}`}
                          label={label}
                          active
                          onClick={() => handleToggleTag(String(id))}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Géneros */}
            {!genreFromUrl ? (
              <div>
                <div className="filters-panel-section-title">Géneros</div>

                {loading ? (
                  <div> Cargando… </div>
                ) : error ? (
                  <div style={{ color: 'crimson' }}>Error: {error}</div>
                ) : genresList.length === 0 ? (
                  <div>No hay géneros</div>
                ) : (
                  <div className="filters-panel-chips" role="list" aria-label="Géneros">
                    {genresList.map((g) => (
                      <div role="listitem" key={`genre-${String(g.id)}`}>
                        <Chip
                          label={g.name}
                          active={selectedGenresSet.has(String(g.id))}
                          onClick={() => handleToggleGenre(String(g.id))}
                        />
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
                <div> Cargando… </div>
              ) : error ? (
                <div style={{ color: 'crimson' }}>Error: {error}</div>
              ) : tagsList.length === 0 ? (
                <div>No hay etiquetas</div>
              ) : (
                <div className="filters-panel-chips" role="list" aria-label="Etiquetas">
                  {tagsList.map((t) => (
                    <div role="listitem" key={`tag-${String(t.id)}`}>
                      <Chip
                        label={t.name}
                        active={selectedTagsSet.has(String(t.id))}
                        onClick={() => handleToggleTag(String(t.id))}
                      />
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
