"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import TopBar from "./components/TopBar";
import FiltersPanel from "./components/FiltersPanel";
import BookCard from "./components/BookCard";
import { BOOKS, type Book } from "./data/books";
import useDebounced from "./hooks/useDebounced";
import { normalize } from "./utils/filters";
import styles from "./styles/biblioteca.module.css";

interface BibliotecaProps {
  genre?: string | null;
}

const GENRE_NAMES: Record<string, string> = {
  'romance': 'Romance',
  'fantasia': 'Fantasía',
  'literatura-boliviana': 'Literatura Boliviana',
  'novela-juvenil': 'Novela Juvenil',
  'ciencia-ficcion': 'Ciencia Ficción',
  'terror': 'Terror',
  'poesia': 'Poesía',
  'clasicos': 'Clásicos',
}

function formatGenre(slug?: string | null) {
  if (!slug) return null
  const lower = String(slug).toLowerCase()
  if (GENRE_NAMES[lower]) return GENRE_NAMES[lower]
  // fallback: replace hyphens with spaces and capitalize each word
  return lower
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

export default function BibliotecaPage({ genre }: BibliotecaProps) {
  const displayGenre = formatGenre(genre);

  // Estado de filtros
  const [query, setQuery] = useState("");
  const [author, setAuthor] = useState("");
  const [genres, setGenres] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounced(query, 250);
  const debouncedAuthor = useDebounced(author, 250);

  // Catálogos únicos
  const catalog = useMemo(() => {
    const g = new Set<string>();
    const t = new Set<string>();
    BOOKS.forEach((b) => {
      b.genres.forEach((x) => g.add(x));
      b.tags.forEach((x) => t.add(x));
    });
    return { genres: Array.from(g).sort(), tags: Array.from(t).sort() };
  }, []);

  // Simular "carga" cuando cambian filtros para ver la animación
  useEffect(() => {
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(id);
  }, [debouncedQuery, debouncedAuthor, genres, tags]);

  // Filtro principal
  const filtered = useMemo(() => {
    const q = normalize(debouncedQuery);
    const a = normalize(debouncedAuthor);
    return BOOKS.filter((b) => {
      const titleOk = q ? normalize(b.title).includes(q) || normalize(b.author).includes(q) : true;
      const authorOk = a ? normalize(b.author).includes(a) : true;
      const genreOk = genres.size ? b.genres.some((g) => genres.has(g)) : true;
      const tagOk = tags.size ? b.tags.some((t) => tags.has(t)) : true;
      // Si hay género desde URL, filtrar solo por ese género
      const urlGenreOk = genre ? b.genres.some((g) => normalize(g).includes(normalize(genre))) : true;
      return titleOk && authorOk && genreOk && tagOk && urlGenreOk;
    });
  }, [debouncedQuery, debouncedAuthor, genres, tags, genre]);

  // Chips activos para la barra superior
  const activeChips = useMemo(() => {
    const chips: { type: "genre" | "tag" | "author"; value: string }[] = [];
    if (debouncedAuthor) chips.push({ type: "author", value: author });
    genres.forEach((g) => chips.push({ type: "genre", value: g }));
    tags.forEach((t) => chips.push({ type: "tag", value: t }));
    return chips;
  }, [debouncedAuthor, author, genres, tags]);

  return (
    <main className={styles.container}>
      <section className={styles.section}>
        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={styles.title}
        >
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Historias{displayGenre ? ` de ${displayGenre}` : ''}</h1>
          <p className={styles.subtitle}>Busca, filtra por género, etiqueta o autor.</p>
        </motion.div>

        {/* Top bar: buscador + chips */}
        <TopBar
          query={query}
          onQuery={setQuery}
          activeChips={activeChips}
          onClearChip={(c) => {
            if (c.type === "author") setAuthor("");
            if (c.type === "genre") setGenres((s) => new Set(Array.from(s).filter((x) => x !== c.value)));
            if (c.type === "tag") setTags((s) => new Set(Array.from(s).filter((x) => x !== c.value)));
          }}
        />

        <div className={styles.grid}>
          {/* Panel de filtros */}
          <FiltersPanel
            allGenres={catalog.genres}
            allTags={catalog.tags}
            selectedGenres={genres}
            selectedTags={tags}
            author={author}
            onAuthor={setAuthor}
            onToggleGenre={(g) =>
              setGenres((s) => (s.has(g) ? new Set(Array.from(s).filter((x) => x !== g)) : new Set(s).add(g)))
            }
            onToggleTag={(t) =>
              setTags((s) => (s.has(t) ? new Set(Array.from(s).filter((x) => x !== t)) : new Set(s).add(t)))
            }
            genreFromUrl={genre}
          />

          {/* Grid de resultados */}
          <section>
            {/* Estado de carga */}
            <AnimatePresence initial={false}>
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={styles.loading}
                >
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm">Aplicando filtros…</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className={styles.empty}
                >
                  No se encontraron libros con los filtros actuales.
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  layout
                  className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3`}
                >
                  {filtered.map((b) => (
                    <BookCard key={b.id} book={b} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </section>
    </main>
  );
}
