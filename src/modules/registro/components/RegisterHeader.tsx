import React from "react";
import styles from "../styles/RegisterHeader.module.css";

export default function RegisterHeader() {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Crear cuenta</h1>
      <p className={styles.subtitle}>
        Únete a <strong>KOLLA</strong> — empieza a leer y escribir.
      </p>
    </header>
  );
}
