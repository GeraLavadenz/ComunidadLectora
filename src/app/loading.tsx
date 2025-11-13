import React from 'react';
import Image from 'next/image';
import minilogo from '../../public/minilogo.png';
import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>
        <Image
          src={minilogo}
          alt="Comunidad Lectora Bolivia"
          width={120}
          height={15}
          className={styles.logo}
          priority
        />
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Cargando...</p>
      </div>
    </div>
  );
}
