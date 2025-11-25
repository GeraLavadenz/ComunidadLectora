// src/modules/reset/reset.tsx
"use client";

import React from 'react';
import ResetForm from './components/ResetForm';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import styles from './styles/reset.module.css';

export default function ResetPassword() {
  return (
    <div className={styles.container}>
      <div className={styles.blob} aria-hidden />
      <div className={styles.themeToggle}>
        <ThemeToggle />
      </div>
      <ResetForm />
    </div>
  );
}
