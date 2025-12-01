"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import styles from "@/modules/reset/styles/reset.module.css"; // ajusta ruta si hace falta

type Status = "idle" | "loading" | "success" | "error";

export default function UpdatePasswordPage(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [password, setPassword] = useState<string>("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const code = searchParams?.get("code");
  const token = searchParams?.get("token");
  const type = searchParams?.get("type");
  const urlError = searchParams?.get("error");

  useEffect(() => {
    if (urlError) {
      setError("El enlace de restablecimiento es inválido o expiró (error en URL).");
      setStatus("error");
    }
  }, [urlError]);

  // 1) Si viene ?code=... usamos exchangeCodeForSession
  const exchangeCode = useCallback(async (c: string) => {
    setStatus("loading");
    setError(null);
    try {
      const { data, error: exErr } = await supabase.auth.exchangeCodeForSession(c);
      if (exErr) {
        setError(`No se pudo intercambiar el código: ${exErr.message ?? exErr.name}`);
        setStatus("error");
        setDebugInfo(JSON.stringify(exErr));
        return null;
      }
      setDebugInfo("Código intercambiado. Sesión creada.");
      setStatus("idle");
      return data?.session ?? null;
    } catch (err: unknown) {
      setError("Error en exchangeCodeForSession.");
      setStatus("error");
      setDebugInfo(String(err));
      return null;
    }
  }, []);

  // 2) Si viene ?token=...&type=recovery usamos verifyOtp
  const verifyRecoveryToken = useCallback(
    async (tok: string) => {
      setStatus("loading");
      setError(null);

      try {
        // verifyOtp valida el token y crea sesión si es correcto
        const { data, error: vErr } = await supabase.auth.verifyOtp({
          token: tok,
          type: "recovery",
        });

        if (vErr) {
          setError(`Token inválido o expirado: ${vErr.message ?? vErr.name}`);
          setStatus("error");
          setDebugInfo(JSON.stringify(vErr));
          return null;
        }

        // data debería contener info de la sesión/usuario según el SDK
        setDebugInfo("Token verificado correctamente via verifyOtp.");
        setStatus("idle");
        return data ?? null;
      } catch (err: unknown) {
        setError("Error verificando el token de recuperación.");
        setStatus("error");
        setDebugInfo(String(err));
        return null;
      }
    },
    []
  );

  // 3) Comprobar si ya hay sesión (por ejemplo si la SDK procesó el hash automáticamente)
  const ensureSession = useCallback(async () => {
    try {
      const { data: sessionData, error: sErr } = await supabase.auth.getSession();
      if (sErr) {
        setDebugInfo(`getSession error: ${sErr.message ?? sErr.name}`);
        return null;
      }
      if (sessionData?.session) {
        setDebugInfo("Sesión detectada.");
        return sessionData.session;
      }
      setDebugInfo("No hay sesión activa.");
      return null;
    } catch (err: unknown) {
      setDebugInfo(`getSession ex: ${String(err)}`);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      // prioridad: code -> token -> check session
      if (code) {
        await exchangeCode(code);
        return;
      }

      if (token && type === "recovery") {
        await verifyRecoveryToken(token);
        return;
      }

      // intentar detectar si el SDK ya creó la sesión (hash processed)
      const s = await ensureSession();
      if (!s) {
        setError(
          "No se detectó sesión activa. Abre el correo y usa el link completo (o recarga la página si el link contiene `#access_token=...`)."
        );
        setStatus("error");
      }
    })();
  }, [code, token, type, exchangeCode, verifyRecoveryToken, ensureSession]);

  // Submit para actualizar la contraseña (requiere sesión)
  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!password || password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        setStatus("error");
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        // Verificamos sesión justo antes
        const { data: sessionData, error: sErr } = await supabase.auth.getSession();
        if (sErr) {
          setError(`No hay sesión válida: ${sErr.message ?? sErr.name}`);
          setStatus("error");
          setDebugInfo(JSON.stringify(sErr));
          return;
        }

        if (!sessionData?.session) {
          setError("No se encontró sesión. Asegúrate de abrir el enlace desde tu correo.");
          setStatus("error");
          return;
        }

        const { error: uErr } = await supabase.auth.updateUser({ password });
        if (uErr) {
          setError(`No se pudo actualizar la contraseña: ${uErr.message ?? uErr.name}`);
          setStatus("error");
          setDebugInfo(JSON.stringify(uErr));
          return;
        }

        setStatus("success");
        setDebugInfo("Contraseña actualizada.");

        setTimeout(() => void router.push("/login"), 1200);
      } catch (err: unknown) {
        setError(`Error inesperado: ${String(err)}`);
        setStatus("error");
        setDebugInfo(String(err));
      }
    },
    [password, router]
  );

  if (status === "success") {
    return (
      <div className={styles.success}>
        <h2>Contraseña actualizada</h2>
        <p>Tu contraseña fue cambiada correctamente. Redirigiendo al inicio de sesión…</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Actualizar contraseña</h1>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
            Nueva contraseña
          </label>
          <input
            id="password"
            className={styles.input}
            type="password"
            value={password}
            onChange={(evt) => setPassword(evt.target.value)}
            placeholder="Nueva contraseña (mín. 6 caracteres)"
            minLength={6}
            required
            aria-invalid={status === "error"}
          />
        </div>

        <button className={styles.btn} type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </form>

      {debugInfo && (
        <details style={{ marginTop: 12 }}>
          <summary>Detalles técnicos (debug)</summary>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{debugInfo}</pre>
        </details>
      )}

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