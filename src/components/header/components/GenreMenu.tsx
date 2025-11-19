'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { genres } from '../data';
import styles from './styles/GenreMenu.module.css';

const GenreMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={styles.container}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className={styles.menuButton}>
        Explora
        <ChevronDown className={`${styles.chevronIcon} ${isOpen ? styles.chevronIconOpen : ''}`} />
      </button>
      {isOpen && (
        <div className={styles.dropdownContainer}>
          <div className={styles.dropdownHeader}>
            <h3 className={styles.dropdownTitle}>Explora por Género</h3>
          </div>
          <div className={styles.dropdownGrid}>
            {genres.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={styles.dropdownLink}
                onClick={() => setIsOpen(false)}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenreMenu;
