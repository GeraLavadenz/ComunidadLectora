
import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Stars from "./Stars";
import "../styles/BookCard.css";

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
  const router = useRouter();

  const handleVerDetalles = () => {
    router.push(`/biblioteca/ver-info?id=${book.id}`);
  };

  return (
    <motion.article className="book-card">
      <div className="book-card-grid">

        <div className="book-cover">
          <div className="book-cover-inner">
            {book.cover ? (
              <img src={book.cover} alt={book.title} />
            ) : (
              <div className="book-nocover">Sin portada</div>
            )}
          </div>
        </div>

        <div className="book-info">

          <h3 className="book-title">{book.title}</h3>

          <div className="book-author">
            por <strong>{book.author}</strong>
          </div>

          <Stars value={book.rating ?? 0} />

          <div className="book-tags">
            {book.genres.map(g => (
              <span className="book-tag book-tag-primary" key={g}>{g}</span>
            ))}
            {book.tags.map(t => (
              <span className="book-tag" key={t}>{t}</span>
            ))}
          </div>

          <div className="book-actions">
            <button className="book-btn book-btn-primary">Leer ahora</button>
            <button className="book-btn book-btn-secondary" onClick={handleVerDetalles}>Ver detalles</button>
          </div>

        </div>

      </div>

      <motion.div className="book-glow" />
    </motion.article>
  );
}
