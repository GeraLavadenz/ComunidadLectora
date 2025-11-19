'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import styles from './styles/GenreMenu.module.css';
import { supabase } from '@/lib/supabaseClient';

type GenreItem = {
  id: string;
  title: string;
  href: string;
};

export default function GenreMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadGenres() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: sbError } = await supabase
          .from('tags')
          .select('id, name, type')
          .eq('type', 'genre')
          .order('name', { ascending: true });

        if (sbError) throw sbError;

        const mapped = (data ?? []).map((row: any) => {
          const slug =
            row.name
              .toLowerCase()
              .replace(/á/g, 'a')
              .replace(/é/g, 'e')
              .replace(/í/g, 'i')
              .replace(/ó/g, 'o')
              .replace(/ú/g, 'u')
              .replace(/\s+/g, '-') // espacios → guiones
              .replace(/[^\w-]/g, ''); // eliminar símbolos

          return {
            id: row.id,
            title: row.name,
            href: `/genres/${slug}`, // <-- Aquí decides tú la ruta
          };
        });

        if (mounted) setGenres(mapped);
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err.message ?? 'Error desconocido');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadGenres();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div
      className={styles.container}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={styles.menuButton}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
      >
        Explora
        <ChevronDown className={`${styles.chevronIcon} ${isOpen ? styles.chevronIconOpen : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.dropdownContainer}>
          <div className={styles.dropdownHeader}>
            <h3 className={styles.dropdownTitle}>Explora por Género</h3>
          </div>

          <div className={styles.dropdownGrid}>
            {loading && <div>Cargando...</div>}
            {error && <div>Error: {error}</div>}

            {!loading && !error && genres.map((g) => (
              <Link
                key={g.id}
                href={g.href}
                className={styles.dropdownLink}
                onClick={() => setIsOpen(false)}
              >
                {g.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
