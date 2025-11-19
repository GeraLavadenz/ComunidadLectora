import React from "react";
import { motion } from "framer-motion";
import Stars from "./Stars";

// =====================================================
// 🎨 Paleta (puedes ajustar estos tokens a tu gusto/EMI)
// =====================================================
const palette = {
  card: "bg-neutral-900",
  border: "border-neutral-700",
  surface: "bg-neutral-800",
  muted: "text-neutral-400",
  text: "text-neutral-100",
  primaryBg: "bg-emerald-500/10",
  primary: "text-emerald-400",
};

export type Book = {
  id: string;
  title: string;
  author: string;
  genres: string[]; // e.g., ["Fantasía", "Romance"]
  tags: string[];   // e.g., ["BL", "Dark", "Spicy"]
  cover?: string;   // URL opcional
  rating?: number;  // 0..5
};

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`group relative overflow-hidden rounded-2xl border ${palette.border} ${palette.card}`}
    >
      <div className="grid grid-cols-[112px_1fr] gap-4 p-4">
        {/* Portada */}
        <div className="relative">
          <div className="aspect-[2/3] overflow-hidden rounded-xl">
            {book.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.cover}
                alt={`Portada de ${book.title}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className={`h-full w-full ${palette.surface} grid place-items-center text-sm ${palette.muted}`}>
                Sin portada
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 min-w-0">
          <h3 className="text-lg font-semibold truncate">{book.title}</h3>
          <div className={`${palette.muted} text-sm`}>por <span className="text-neutral-200">{book.author}</span></div>
          <Stars value={book.rating ?? 0} />

          <div className="flex flex-wrap gap-2 mt-1">
            {book.genres.map((g) => (
              <span key={g} className={`text-xs px-2 py-1 rounded-full border ${palette.border} ${palette.primaryBg} ${palette.primary}`}>
                {g}
              </span>
            ))}
            {book.tags.map((t) => (
              <span key={t} className={`text-xs px-2 py-1 rounded-full border ${palette.border}`}>{t}</span>
            ))}
          </div>

          <div className="mt-auto flex gap-2">
            <button className="px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm hover:bg-emerald-500/20 transition-colors">
              Leer ahora
            </button>
            <button className="px-3 py-2 rounded-xl border border-neutral-700 text-neutral-200 text-sm hover:bg-neutral-800 transition-colors">
              Ver detalles
            </button>
          </div>
        </div>
      </div>

      {/* Glow animado */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        whileHover={{ opacity: 0.35 }}
        transition={{ duration: 0.4 }}
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(600px 120px at 20% 0%, rgba(16,185,129,0.12), rgba(16,185,129,0) 60%), radial-gradient(600px 120px at 80% 100%, rgba(16,185,129,0.12), rgba(16,185,129,0) 60%)",
        }}
      />
    </motion.article>
  );
}
