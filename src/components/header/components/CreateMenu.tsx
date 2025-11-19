'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { createOptions } from '../data';
import styles from './styles/CreateMenu.module.css';

type Props = {
  isAuthenticated: boolean;
  getHref: (href: string) => string;
};

const CreateMenu: React.FC<Props> = ({ isAuthenticated, getHref }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={styles.container}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className={styles.menuButton}>
        Escribir
        <ChevronDown className={`${styles.chevronIcon} ${isOpen ? styles.chevronIconOpen : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.dropdownContainer}>
          <div className={styles.dropdownHeader}>
            <h3 className={styles.dropdownTitle}>
              {isAuthenticated ? 'Opciones de creación' : 'Inicia sesión para crear'}
            </h3>
          </div>

          <div className={styles.dropdownList}>
            {createOptions.map((item) => (
              <Link
                key={item.title}
                href={getHref(item.href)}
                className={styles.dropdownLink}
                // No hace falta onClick especial; Link ya te manda al login con redirect si no hay sesión
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

export default CreateMenu;
