import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown } from "lucide-react";
import Chip from "./Chip";
import { supabase } from "../../../lib/supabaseClient"; // opcional si cargas directo desde cliente
import "../styles/FiltersPanel.css";

/** Simple debounce hook */
function useDebounced<ValueT>(value: ValueT, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

type TagRow = { id: string; name: string; type: "genre" | "tag" | string };

interface FiltersPanelProps {
  allGenres?: Array<{ id: string; name: string }>;
  allTags?: Array<{ id: string; name: string }>;

  selectedGenres: Set<string> | string[];
  selectedTags: Set<string> | string[];

  author: string;

  onToggleGenre: (id: string) => void;
  onToggleTag: (id: string) => void;
  onAuthor: (s: string) => void;

  /** If a genre is fixed by URL, pass {id,name} to show it — hides full genres list */
  genreFromUrl?: { id: string; name: string } | null;

  /** If true, component will fetch genres/tags itself (default true) */
  fetchFromServer?: boolean;

  /** Optional API paths (service role) — if provided, component fetches from these endpoints */
  apiGenresPath?: string; // e.g. '/api/genres'
  apiTagsPath?: string;   // e.g. '/api/tags'
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
  apiGenresPath,
  apiTagsPath,
}: FiltersPanelProps) {
  const [open, setOpen] = useState(true);

  // fetched data + UI states
  const [fetchedGenres, setFetchedGenres] = useState<TagRow[] | null>(null);
  const [fetchedTags, setFetchedTags] = useState<TagRow[] | null>(null);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [errorGenres, setErrorGenres] = useState<string | null>(null);
  const [errorTags, setErrorTags] = useState<string | null>(null);

  // normalize selected -> Set<string>
  const selectedGenresSet = useMemo(() => {
    return selectedGenres instanceof Set ? selectedGenres : new Set(selectedGenres ?? []);
  }, [selectedGenres]);

  const selectedTagsSet = useMemo(() => {
    return selectedTags instanceof Set ? selectedTags : new Set(selectedTags ?? []);
  }, [selectedTags]);

  // debounce author before notifying parent
  const debouncedAuthor = useDebounced(author, 300);
  useEffect(() => {
    onAuthor(debouncedAuthor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAuthor]);

  // Helper: get name from id (fallback to id)
  function getNameById(id: string, list: { id: string; name: string }[] | null | undefined) {
    if (!list || list.length === 0) return id;
    const found = list.find((x) => x.id === id);
    return found ? found.name : id;
  }

  // Fetch functions
  const fetchGenres = useCallback(async () => {
    if (allGenresProp && allGenresProp.length > 0) {
      setFetchedGenres(allGenresProp.map((g) => ({ id: g.id, name: g.name, type: "genre" })));
      return;
    }

    setLoadingGenres(true);
    setErrorGenres(null);
    try {
      if (apiGenresPath) {
        const res = await fetch(apiGenresPath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setFetchedGenres((json ?? []).map((r: any) => ({ id: r.id, name: r.name, type: "genre" })));
      } else {
        const { data, error } = await supabase
          .from("tags")
          .select("id, name, type")
          .eq("type", "genre")
          .order("name", { ascending: true });

        if (error) throw error;
        setFetchedGenres((data ?? []).map((r: any) => ({ id: r.id, name: r.name, type: r.type })));
      }
    } catch (err: any) {
      setErrorGenres(err?.message ?? "Error al cargar géneros");
      setFetchedGenres([]);
    } finally {
      setLoadingGenres(false);
    }
  }, [allGenresProp, apiGenresPath]);

  const fetchTags = useCallback(async () => {
    if (allTagsProp && allTagsProp.length > 0) {
      setFetchedTags(allTagsProp.map((g) => ({ id: g.id, name: g.name, type: "tag" })));
      return;
    }

    setLoadingTags(true);
    setErrorTags(null);
    try {
      if (apiTagsPath) {
        const res = await fetch(apiTagsPath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setFetchedTags((json ?? []).map((r: any) => ({ id: r.id, name: r.name, type: "tag" })));
      } else {
        const { data, error } = await supabase
          .from("tags")
          .select("id, name, type")
          .eq("type", "tag")
          .order("name", { ascending: true });

        if (error) throw error;
        setFetchedTags((data ?? []).map((r: any) => ({ id: r.id, name: r.name, type: r.type })));
      }
    } catch (err: any) {
      setErrorTags(err?.message ?? "Error al cargar etiquetas");
      setFetchedTags([]);
    } finally {
      setLoadingTags(false);
    }
  }, [allTagsProp, apiTagsPath]);

  // initial fetch
  useEffect(() => {
    if (!fetchFromServer) return;
    fetchGenres();
    fetchTags();
  }, [fetchFromServer, fetchGenres, fetchTags]);

  // lists to render (prefer props > fetched)
  const genresList = useMemo(() => {
    if (allGenresProp && allGenresProp.length > 0)
      return allGenresProp.map((g) => ({ id: g.id, name: g.name, type: "genre" as const }));
    return fetchedGenres ?? [];
  }, [allGenresProp, fetchedGenres]);

  const tagsList = useMemo(() => {
    if (allTagsProp && allTagsProp.length > 0)
      return allTagsProp.map((g) => ({ id: g.id, name: g.name, type: "tag" as const }));
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
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="filters-panel-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="filters-panel-content"
            style={{ overflow: "hidden" }}
          >
            {/* Autor */}
            <div>
              <label htmlFor="filters-author" className="filters-panel-label">Autor</label>
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
              {/* Géneros seleccionados */}
              {Array.from(selectedGenresSet).length > 0 && (
                <div className="filters-selected-group">
                  <div className="filters-selected-title">Géneros seleccionados</div>
                  <div className="filters-selected-chips">
                    {Array.from(selectedGenresSet).map((id) => {
                      const label = getNameById(id, genresList);
                      return (
                        <Chip key={id} label={label} active={true} onClick={() => handleToggleGenre(id)} />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Etiquetas seleccionadas */}
              {Array.from(selectedTagsSet).length > 0 && (
                <div className="filters-selected-group">
                  <div className="filters-selected-title">Etiquetas seleccionadas</div>
                  <div className="filters-selected-chips">
                    {Array.from(selectedTagsSet).map((id) => {
                      const label = getNameById(id, tagsList);
                      return (
                        <Chip key={id} label={label} active={true} onClick={() => handleToggleTag(id)} />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Géneros (lista completa, si no hay genreFromUrl) */}
            {!genreFromUrl ? (
              <div>
                <div className="filters-panel-section-title">Géneros</div>

                {loadingGenres ? (
                  <div> Cargando géneros… </div>
                ) : errorGenres ? (
                  <div style={{ color: "crimson" }}>Error géneros: {errorGenres}</div>
                ) : (!genresList || genresList.length === 0) ? (
                  <div>No hay géneros</div>
                ) : (
                  <div className="filters-panel-chips" role="list" aria-label="Géneros">
                    {genresList.map((g) => (
                      <div role="listitem" key={g.id}>
                        <Chip label={g.name} active={selectedGenresSet.has(g.id)} onClick={() => handleToggleGenre(g.id)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="filters-panel-section-title">Género</div>
                <div className="filters-panel-chips">
                  <Chip label={genreFromUrl.name} active={true} onClick={() => { /* opcional: permitir quitar */ }} />
                </div>
              </div>
            )}

            {/* Etiquetas */}
            <div>
              <div className="filters-panel-section-title">Etiquetas</div>

              {loadingTags ? (
                <div> Cargando etiquetas… </div>
              ) : errorTags ? (
                <div style={{ color: "crimson" }}>Error etiquetas: {errorTags}</div>
              ) : (!tagsList || tagsList.length === 0) ? (
                <div>No hay etiquetas</div>
              ) : (
                <div className="filters-panel-chips" role="list" aria-label="Etiquetas">
                  {tagsList.map((t) => (
                    <div role="listitem" key={t.id}>
                      <Chip label={t.name} active={selectedTagsSet.has(t.id)} onClick={() => handleToggleTag(t.id)} />
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
