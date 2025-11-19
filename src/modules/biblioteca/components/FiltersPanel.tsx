import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown } from "lucide-react";
import Chip from "./Chip";

// =====================================================
// 🎨 Paleta (puedes ajustar estos tokens a tu gusto/EMI)
// =====================================================
const palette = {
  card: "bg-neutral-900",
  border: "border-neutral-700",
  surface: "bg-neutral-800",
  muted: "text-neutral-400",
};

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
    <div className={`sticky top-4 ${palette.card} border ${palette.border} rounded-2xl p-4`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-2"
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
            className="space-y-4 overflow-hidden"
          >
            {/* Autor */}
            <div>
              <label className={`block text-sm mb-1 ${palette.muted}`}>Autor</label>
              <input
                value={author}
                onChange={(e) => onAuthor(e.target.value)}
                placeholder="Filtrar por autor..."
                className={`w-full ${palette.surface} border ${palette.border} rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/40`}
              />
            </div>

            {/* Géneros - Solo mostrar si no hay género desde URL */}
            {!genreFromUrl && (
              <div>
                <div className={`text-sm mb-2 ${palette.muted}`}>Géneros</div>
                <div className="flex flex-wrap gap-2">
                  {allGenres.map((g) => (
                    <Chip key={g} label={g} active={selectedGenres.has(g)} onClick={() => onToggleGenre(g)} />
                  ))}
                </div>
              </div>
            )}

            {/* Etiquetas */}
            <div>
              <div className={`text-sm mb-2 ${palette.muted}`}>Etiquetas</div>
              <div className="flex flex-wrap gap-2">
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
