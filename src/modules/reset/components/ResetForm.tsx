"use client";

import type { FormEvent } from "react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import styles from "../styles/reset.module.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ResetForm(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = EMAIL_REGEX.test(email) && status !== "loading";

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!canSubmit) {
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        const redirectTo =
          typeof window !== "undefined" ? `${window.location.origin}/auth/update-password` : undefined;

        const { error: supaError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo,
        });

        if (supaError) {
          setError(mapSupabaseError(supaError.message ?? supaError.name ?? "auth/error"));
          setStatus("error");
          return;
        }

        setStatus("success");
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message ?? "No se pudo enviar el enlace. Intenta nuevamente.";
        setError(message);
        setStatus("error");
      }
    },
    // deps: todo lo que usamos dentro
    [canSubmit, email, router]
  );

  if (status === "success") {
    return (
      <div className={styles.success}>
        <h2>Revisa tu correo</h2>
        <p>
          Te hemos enviado un enlace para restablecer tu contraseña a <strong>{email}</strong>.
        </p>
        <p>Si no lo ves en tu bandeja de entrada, revisa la carpeta de spam.</p>
        <button
          type="button"
          className={styles.btn}
          onClick={() => {
            void router.push("/login");
          }}
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
            onChange={(evt) => setEmail(evt.target.value)}
            placeholder="tucorreo@gmail.com"
            aria-invalid={status === "error" && !EMAIL_REGEX.test(email)}
            required
          />
        </div>

        <button className={styles.btn} type="submit" disabled={!canSubmit}>
          {status === "loading" ? "Enviando…" : "Enviar enlace"}
        </button>
      </form>

      <div className={styles.links}>
        <button
          type="button"
          className={styles.link}
          onClick={() => {
            void router.push("/login");
          }}
        >
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}

/**
 * Convierte mensajes de Supabase en texto amigable.
 * Ajusta las comparaciones si quieres mapear códigos concretos.
 */
function mapSupabaseError(msg: string): string {
  const lower = msg.toLowerCase();

  if (lower.includes("invalid email")) {
    return "El correo no es válido.";
  }

  if (lower.includes("user not found") || lower.includes("no user")) {
    return "No hay una cuenta registrada con ese correo.";
  }

  if (lower.includes("too many requests")) {
    return "Demasiados intentos. Intenta más tarde.";
  }

  return "No se pudo enviar el enlace. Intenta nuevamente.";
}
