"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Stars from "./Stars";
import "../styles/BookCard.css";

export type Book = {
  id: string;
  title: string;
  author: string;
  genres: string[];
  tags: string[];
  cover?: string;
  rating?: number;
};

interface BookCardProps {
  book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  return (
    <motion.article className="book-card" aria-labelledby={`book-title-${book.id}`}>
      <div className="book-card-grid">
        <div className="book-cover">
          <div className="book-cover-inner" style={{ position: "relative" }}>
            {book.cover ? (
              <Image
                src={book.cover}
                alt={book.title}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 640px) 100px, 150px"
              />
            ) : (
              <div className="book-nocover" aria-hidden>
                Sin portada
              </div>
            )}
          </div>
        </div>

        <div className="book-info">
          <h3 id={`book-title-${book.id}`} className="book-title">
            {book.title}
          </h3>

          <div className="book-author">
            por <strong>{book.author}</strong>
          </div>

          <Stars value={book.rating ?? 0} />

          <div className="book-tags">
            {book.genres.map((g) => (
              <span className="book-tag book-tag-primary" key={g}>
                {g}
              </span>
            ))}
            {book.tags.map((t) => (
              <span className="book-tag" key={t}>
                {t}
              </span>
            ))}
          </div>

          <div className="book-actions">
          <Link
            href={`/leer/${encodeURIComponent(book.id)}`}
            className="book-btn book-btn-primary inline-flex items-center justify-center"
            aria-label={`Leer ahora ${book.title}`}
          >
            Leer ahora
          </Link>

            <Link
              href={`/biblioteca/ver-info/${encodeURIComponent(book.id)}`}
              className="book-btn book-btn-secondary inline-flex items-center justify-center"
              aria-label={`Ver detalles de ${book.title}`}
            >
              Ver detalles
            </Link>
          </div>
        </div>
      </div>

      <motion.div className="book-glow" aria-hidden />
    </motion.article>
  );
};

export default BookCard;
