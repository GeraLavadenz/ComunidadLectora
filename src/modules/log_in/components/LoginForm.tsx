import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import libroAbierto from '../assets/icons/libro-abierto.png';
import libroCerrado from '../assets/icons/libro.png';
import '../styles/login.css';

type Status = 'idle' | 'loading' | 'error';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface LoginFormProps {
  redirectParam: string;
}

export default function LoginForm({ redirectParam }: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    EMAIL_REGEX.test(email) && password.length >= 6 && status !== 'loading';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus('loading');
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      router.replace(redirectParam);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? 'Error desconocido';
      setError(mapSupabaseError(message));
      setStatus('error');
    } finally {
      setStatus('idle');
    }
  }

  async function onGoogle() {
    if (status === 'loading') return;
    setStatus('loading');
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectParam}`,
        },
      });
      if (error) {
        if (error.message.includes('Unsupported provider')) {
          throw new Error('Google OAuth no está configurado en Supabase. Ve a tu dashboard de Supabase > Authentication > Providers y habilita Google OAuth.');
        }
        throw error;
      }
      // OAuth will redirect, so no need to call router.replace here
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? 'Error desconocido';
      setError(mapSupabaseError(message));
      setStatus('error');
    } finally {
      setStatus('idle');
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <div className="field">
        <label htmlFor="email" className="label">
          Correo
        </label>
        <input
          id="email"
          className="input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@gmail.com"
          aria-invalid={status === 'error' && !EMAIL_REGEX.test(email)}
          required
        />
      </div>

      <div className="field password-wrap">
        <label htmlFor="password" className="label">
          Contraseña
        </label>
        <input
          id="password"
          className="input"
          type={showPass ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          minLength={6}
          required
        />
        <button
          type="button"
          className="toggle-pass"
          onClick={() => setShowPass((s) => !s)}
          aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <Image
            src={showPass ? libroAbierto : libroCerrado}
            alt={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            width={20}
            height={20}
          />
        </button>
      </div>

      <div className="row">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Recordarme
        </label>
        <a
          href="/reset"
          style={{
            fontSize: 13,
            color: 'var(--primary)',
            textDecoration: 'none',
          }}
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <button
        className="btn btn-primary"
        type="submit"
        disabled={!canSubmit}
      >
        {status === 'loading' ? 'Entrando…' : 'Entrar'}
      </button>

      <div className="divider">o</div>

      <button
        type="button"
        className="btn btn-ghost"
        onClick={onGoogle}
        disabled={status === 'loading'}
      >
        Continuar con Google
      </button>

      <button
        type="button"
        className="btn btn-outline"
        onClick={() => router.push('/register')}
        disabled={status === 'loading'}
      >
        Crear cuenta
      </button>
    </form>
  );
}

function mapSupabaseError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Credenciales incorrectas.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Confirma tu correo electrónico antes de iniciar sesión.';
  }
  if (message.includes('Too many requests')) {
    return 'Demasiados intentos. Intenta más tarde.';
  }
  if (message.includes('Network request failed')) {
    return 'Problema de red. Verifica tu conexión.';
  }
  if (message.includes('Unsupported provider')) {
    return 'Google OAuth no está configurado en Supabase. Ve a tu dashboard de Supabase > Authentication > Providers y habilita Google OAuth.';
  }
  return 'No se pudo iniciar sesión. Intenta nuevamente.';
}
