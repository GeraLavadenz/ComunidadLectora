import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown } from "lucide-react";
import Chip from "./Chip";
import "./FiltersPanel.css";

interface FiltersPanelProps {
  allGenres: string[];
  allTags: string[];
  selectedGenres: Set<string>;
  selectedTags: Set<string>;
  author: string;
  onToggleGenre: (g: string) => void;
  onToggleTag: (t: string) => void;
  onAuthor: (s: string) => void;
  genreFromUrl?: string | null;
}

export default function FiltersPanel({
  allGenres,
  allTags,
  selectedGenres,
  selectedTags,
  author,
  onToggleGenre,
  onToggleTag,
  onAuthor,
  genreFromUrl,
}: FiltersPanelProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="filters-panel">
      <button
        onClick={() => setOpen((v) => !v)}
        className="filters-panel-button"
      >
        <div className="flex items-center gap-2">
          <Filter className="size-4" />
          <span className="font-medium">Filtros</span>
        </div>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", duration: 0.45 }}
            className="filters-panel-content"
          >
            {/* Autor */}
            <div>
              <label className="filters-panel-label">Autor</label>
              <input
                value={author}
                onChange={(e) => onAuthor(e.target.value)}
                placeholder="Filtrar por autor..."
                className="filters-panel-input"
              />
            </div>

            {/* Géneros - Solo mostrar si no hay género desde URL */}
            {!genreFromUrl && (
              <div>
                <div className="filters-panel-section-title">Géneros</div>
                <div className="filters-panel-chips">
                  {allGenres.map((g) => (
                    <Chip key={g} label={g} active={selectedGenres.has(g)} onClick={() => onToggleGenre(g)} />
                  ))}
                </div>
              </div>
            )}

            {/* Etiquetas */}
            <div>
              <div className="filters-panel-section-title">Etiquetas</div>
              <div className="filters-panel-chips">
                {allTags.map((t) => (
                  <Chip key={t} label={t} active={selectedTags.has(t)} onClick={() => onToggleTag(t)} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
