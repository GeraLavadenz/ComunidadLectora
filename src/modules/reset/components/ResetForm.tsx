import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import styles from '../styles/reset.module.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ResetForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const canSubmit = EMAIL_REGEX.test(email) && status !== 'loading';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus('loading');
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setStatus('success');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? 'auth/error';
      setError(mapFirebaseError(code));
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.success}>
        <h2>Revisa tu correo</h2>
        <p>Te hemos enviado un enlace para restablecer tu contraseña a <strong>{email}</strong>.</p>
        <p>Si no lo ves en tu bandeja de entrada, revisa la carpeta de spam.</p>
        <button
          className={styles.btn}
          onClick={() => router.push('/login')}
        >
          Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Restablecer contraseña</h1>
      <p className={styles.description}>
        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Correo electrónico
          </label>
          <input
            id="email"
            className={styles.input}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@gmail.com"
            aria-invalid={status === 'error' && !EMAIL_REGEX.test(email)}
            required
          />
        </div>

        <button
          className={styles.btn}
          type="submit"
          disabled={!canSubmit}
        >
          {status === 'loading' ? 'Enviando…' : 'Enviar enlace'}
        </button>
      </form>

      <div className={styles.links}>
        <button
          className={styles.link}
          onClick={() => router.push('/login')}
        >
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo no es válido.';
    case 'auth/user-not-found':
      return 'No hay una cuenta registrada con ese correo.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta más tarde.';
    default:
      return 'No se pudo enviar el enlace. Intenta nuevamente.';
  }
}
