// Single-file React (no path aliases, no CSS Modules, no TS types)
// Fix: remove stray CSS outside template literal and correct ChapterCard signature.
// Keeps palette, animations, editable tags/genres, and in-browser tests.
"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import "./styles/capitulos.css";
import { stories } from "./storiesData";

// ------------------------------------
// Pure helpers for filter/sort (testable)
// ------------------------------------
function normalizeStr(s) {
  return (s || "").toString().toLowerCase();
}

function filterChapters(story, query, onlyPublished, sortBy) {
  const q = (query || "").trim().toLowerCase();
  let arr = (story?.chapters || []).filter((c) => {
    const hit =
      normalizeStr(c.title).includes(q) ||
      normalizeStr(c.summary).includes(q) ||
      (q !== "" && String(c.number) === q);
    return onlyPublished ? hit && c.isPublished : hit;
  });

  switch (sortBy) {
    case "num-desc":
      arr = [...arr].sort((a, b) => b.number - a.number);
      break;
    case "title":
      arr = [...arr].sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      arr = [...arr].sort((a, b) => a.number - b.number);
  }
  return arr;
}

// -------------------------
// Chip helpers (pure)
// -------------------------
function addChip(list, value) {
  const v = (value || "").trim();
  if (!v) return list || [];
  const exists = (list || []).some((x) => x.toLowerCase() === v.toLowerCase());
  return exists ? list : [...(list || []), v];
}
function removeChip(list, value) {
  const v = (value || "").toLowerCase();
  return (list || []).filter((x) => x.toLowerCase() !== v);
}

// -------------------------
// Main Story Detail component
// -------------------------
function StoryDetail({ story }) {
  // local editable copy to allow in-memory edits
  const [local, setLocal] = useState(() => ({ ...story }));

  const [query, setQuery] = useState("");
  const [onlyPublished, setOnlyPublished] = useState(false);
  const [sortBy, setSortBy] = useState("num-asc"); // "num-asc" | "num-desc" | "title"

  const [showForm, setShowForm] = useState(false);
  const [newChapter, setNewChapter] = useState({
    title: '',
    summary: '',
    content: '',
    isPublished: false
  });

  const stats = useMemo(() => {
    const total = local?.chapters?.length || 0;
    const published = (local?.chapters || []).filter((c) => c.isPublished).length;
    const pct = total ? Math.round((published / total) * 100) : 0;
    return { total, published, pct };
  }, [local]);

  const filtered = useMemo(
    () => filterChapters(local, query, onlyPublished, sortBy),
    [local, query, onlyPublished, sortBy]
  );

  function handleAddTag(val) {
    setLocal((s) => ({ ...s, tags: addChip(s.tags, val), updatedAt: new Date().toISOString() }));
  }
  function handleRemoveTag(val) {
    setLocal((s) => ({ ...s, tags: removeChip(s.tags, val), updatedAt: new Date().toISOString() }));
  }
  function handleAddGenre(val) {
    setLocal((s) => ({ ...s, genres: addChip(s.genres, val), updatedAt: new Date().toISOString() }));
  }
  function handleRemoveGenre(val) {
    setLocal((s) => ({ ...s, genres: removeChip(s.genres, val), updatedAt: new Date().toISOString() }));
  }

  const handleCreateChapter = () => {
    const number = (local.chapters || []).length + 1;
    const id = `c-${String(number).padStart(3, '0')}`;
    const newCh = {
      id,
      number,
      title: newChapter.title,
      summary: newChapter.summary,
      content: newChapter.content,
      isPublished: newChapter.isPublished,
      publishedAt: newChapter.isPublished ? new Date().toISOString() : undefined
    };
    setLocal((s) => ({
      ...s,
      chapters: [...(s.chapters || []), newCh],
      updatedAt: new Date().toISOString()
    }));
    setNewChapter({ title: '', summary: '', content: '', isPublished: false });
    setShowForm(false);
  };

  return (
    <main className="page">
      <header className="hero">
        <div className="heroGlow" />
        <div className="heroContent">
          <h1 className="title">{local.title}</h1>
          <p className="subtitle">
            por <strong>{local.author}</strong>
          </p>
          <div className="badges" aria-label="Géneros y etiquetas">
            {(local.genres || []).map((g) => (
              <span key={g} className="badgeGenre">
                {g}
              </span>
            ))}
            {(local.tags || []).map((t) => (
              <span key={t} className="badgeTag">
                #{t}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="meta">
        <article className="card">
          <h2>Descripción</h2>
          <p>{local.description}</p>
          <ul className="metaList">
            <li>
              <span>Creado:</span> {new Date(local.createdAt).toLocaleDateString()}
            </li>
            <li>
              <span>Actualizado:</span> {new Date(local.updatedAt).toLocaleDateString()}
            </li>
            <li>
              <span>Capítulos:</span> {stats.total}
            </li>
          </ul>

          {/* Editable: Géneros */}
          <div className="editRow">
            <h3 className="editTitle">Géneros</h3>
            <ChipEditor
              items={local.genres}
              placeholder="Añadir género y Enter"
              onAdd={handleAddGenre}
              onRemove={handleRemoveGenre}
              badgeClass="genreChip"
              ariaLabel="Editor de géneros"
            />
          </div>

          {/* Editable: Etiquetas */}
          <div className="editRow">
            <h3 className="editTitle">Etiquetas</h3>
            <ChipEditor
              items={local.tags}
              placeholder="Añadir etiqueta y Enter"
              onAdd={handleAddTag}
              onRemove={handleRemoveTag}
              badgeClass="tagChip"
              ariaLabel="Editor de etiquetas"
            />
          </div>

          <p className="note">Puedes modificar <strong>&ldquo;géneros&rdquo;</strong> y <strong>&ldquo;etiquetas&rdquo;</strong> incluso si hay capítulos publicados. Estos cambios no afectan el estado de publicación de los capítulos.</p>
        </article>

        <article className="card">
          <h2>Publicación</h2>
          <div className="progressBar" aria-label="Progreso de publicación">
            <div className="progressFill" style={{ width: `${stats.pct}%` }} />
          </div>
          <p className="progressText">
            {stats.published} publicados de {stats.total} ({stats.pct}%)
          </p>
        </article>
      </section>

      <section className="toolbar">
        <div className="searchBox">
          <input
            className="input"
            placeholder="Buscar por número, título o resumen..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="searchIcon" aria-hidden>
            ⌕
          </span>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={onlyPublished}
            onChange={(e) => setOnlyPublished(e.target.checked)}
          />
          <span>Solo publicados</span>
        </label>
        <select
          className="select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Ordenar capítulos"
        >
          <option value="num-asc">Número ↑</option>
          <option value="num-desc">Número ↓</option>
          <option value="title">Título A–Z</option>
        </select>
        <button className="btn create" onClick={() => setShowForm(!showForm)}>
          + Nuevo Capítulo
        </button>
      </section>

      {showForm && (
        <motion.div
          className="formContainer"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3>Crear Nuevo Capítulo</h3>
          <div className="formGroup">
            <label>Título:</label>
            <input
              type="text"
              value={newChapter.title}
              onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
              placeholder="Ingresa el título del capítulo"
            />
          </div>
          <div className="formGroup">
            <label>Resumen:</label>
            <textarea
              value={newChapter.summary}
              onChange={(e) => setNewChapter({ ...newChapter, summary: e.target.value })}
              placeholder="Describe brevemente el capítulo"
              rows={3}
            />
          </div>
          <div className="formGroup">
            <label>Contenido:</label>
            <textarea
              value={newChapter.content}
              onChange={(e) => setNewChapter({ ...newChapter, content: e.target.value })}
              placeholder="Escribe el contenido del capítulo aquí..."
              rows={10}
            />
          </div>
          <div className="formGroup">
            <label>
              <input
                type="checkbox"
                checked={newChapter.isPublished}
                onChange={(e) => setNewChapter({ ...newChapter, isPublished: e.target.checked })}
              />
              Publicar inmediatamente
            </label>
          </div>
          <div className="formActions">
            <button className="btn save" onClick={handleCreateChapter}>
              Crear Capítulo
            </button>
            <button className="btn cancel" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      <section className="chapterGrid">
        {filtered.map((c) => (
          <ChapterCard key={c.id} chapter={c} storyId={story.id} />
        ))}
        {filtered.length === 0 && (
          <div className="empty">Sin resultados para "{query}"</div>
        )}
      </section>


    </main>
  );
}

function ChapterCard({ chapter, storyId }) {
  return (
    <article
      className="chapterCard"
      data-published={chapter.isPublished}
      tabIndex={0}
      aria-label={`Capítulo ${chapter.number}: ${chapter.title}`}
    >
      <div className="chapterHeader">
        <span className="chNumber">#{chapter.number}</span>
        <h3 className="chTitle">{chapter.title}</h3>
        <span
          className={chapter.isPublished ? "badgeOk" : "badgeDraft"}
          title={chapter.isPublished ? "Publicado" : "Borrador"}
        >
          {chapter.isPublished ? "Publicado" : "Borrador"}
        </span>
      </div>
      <p className="chSummary">{chapter.summary}</p>
      <footer className="chFooter">
        {chapter.isPublished ? (
          <time className="date" dateTime={chapter.publishedAt}>
            Publicado el {chapter.publishedAt && new Date(chapter.publishedAt).toLocaleDateString()}
          </time>
        ) : (
          <em className="pending">Pendiente de publicación</em>
        )}
        <Link href={`/escritura/capitulos/${storyId}/${chapter.id}/editar`}>
          <button className="btnGhost">Editar</button>
        </Link>
      </footer>
    </article>
  );
}

// -------------------------------------
// Demo wrapper + test story selector
// -------------------------------------
export default function Capitulos({ storyId }: { storyId?: string }) {
  // If storyId is provided (from URL), use it; otherwise allow switching stories
  const [selectedStoryId, setSelectedStoryId] = useState(storyId || stories[0].id);
  const story = stories.find((s) => s.id === (storyId || selectedStoryId)) || stories[0];

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div>
      {!storyId && (
        <div className="topBar">
          <label className="topLabel">Historia:</label>
          <select className="topSelect" value={selectedStoryId} onChange={(e) => setSelectedStoryId(e.target.value)}>
            {stories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <StoryDetail story={story} />
    </div>
  );
}

// -------------------------
// Minimal CSS (embedded)


// -------------------------
// Tiny test suite (console)
// -------------------------
function assertEq(label, a, b) {
  const ok = JSON.stringify(a) === JSON.stringify(b);
  console[ok ? "log" : "error"](`${ok ? "✅" : "❌"} ${label}:`, a, "===", b);
  return ok;
}

export function runTests() {
  const s = stories[0];
  // 1) By number match
  const r1 = filterChapters(s, "1", false, "num-asc").map((c) => c.number);
  assertEq("match number=1", r1, [1]);

  // 2) Only published
  const r2 = filterChapters(s, "", true, "num-asc").every((c) => c.isPublished === true);
  assertEq("onlyPublished=true filters drafts", r2, true);

  // 3) Sort desc
  const r3 = filterChapters(s, "", false, "num-desc").map((c) => c.number);
  const sortedDesc = [...(s.chapters || [])].sort((a, b) => b.number - a.number).map((c) => c.number);
  assertEq("sort num-desc", r3, sortedDesc);

  // 4) Title sort A–Z
  const r4 = filterChapters(s, "", false, "title").map((c) => c.title);
  const titleAZ = [...(s.chapters || [])].sort((a, b) => a.title.localeCompare(b.title)).map((c) => c.title);
  assertEq("sort title A–Z", r4, titleAZ);

  // 5) Query by substring in summary
  const r5 = filterChapters(s, "campus", false, "num-asc").map((c) => c.id);
  assertEq("query substring 'campus'", r5, ["c-001"]);

  // 6) addChip avoids duplicates (case-insensitive)
  const chips1 = addChip(["Aventura"], "aventura");
  assertEq("addChip no dup", chips1, ["Aventura"]);

  // 7) removeChip removes by case-insensitive match
  const chips2 = removeChip(["EMI", "La Paz"], "emi");
  assertEq("removeChip case-insensitive", chips2, ["La Paz"]);

  // 8) Editing allowed when chapters published
  const hasPublished = s.chapters.some((c) => c.isPublished);
  const afterEdit = addChip(s.tags, "prueba");
  assertEq("can edit tags even with published", hasPublished && afterEdit.includes("prueba"), true);
}

// -------------------------
// Chip editor component (UI only)
// -------------------------
function ChipEditor({ items = [], placeholder, onAdd, onRemove, badgeClass = "", ariaLabel = "" }) {
  const [value, setValue] = useState("");

  function onKeyDown(e) {
    if (e.key === "Enter") {
      const v = value.trim();
      if (v) {
        onAdd(v);
        setValue("");
      }
    }
  }

  return (
    <div aria-label={ariaLabel}>
      <div className="chips">
        {items.map((it) => (
          <span key={it} className={`chip ${badgeClass}`}>
            {it}
            <button className="chipRemove" title={`Eliminar ${it}`} onClick={() => onRemove(it)} aria-label={`Eliminar ${it}`}>×</button>
          </span>
        ))}
      </div>
      <input
        className="chipInput"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
