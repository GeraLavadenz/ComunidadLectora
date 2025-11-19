import React from "react";
import { motion } from "framer-motion";
import Stars from "./Stars";
import "./BookCard.css";

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
      className="book-card group"
    >
      <div className="book-card-grid">
        {/* Portada */}
        <div className="book-card-cover">
          <div className="book-card-cover-aspect">
            {book.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.cover}
                alt={`Portada de ${book.title}`}
                className="book-card-cover-img"
                loading="lazy"
              />
            ) : (
              <div className="book-card-no-cover">
                Sin portada
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="book-card-info">
          <h3 className="book-card-title">{book.title}</h3>
          <div className="book-card-author">por <span>{book.author}</span></div>

          <div className="book-card-genres-tags">
            {book.genres.map((g) => (
              <span key={g} className="book-card-genre">
                {g}
              </span>
            ))}
            {book.tags.map((t) => (
              <span key={t} className="book-card-tag">{t}</span>
            ))}
          </div>

          <div className="book-card-buttons">
            <button className="book-card-read-btn">
              Leer ahora
            </button>
            <button className="book-card-details-btn">
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
        className="book-card-glow"
      />
    </motion.article>
  );
}
