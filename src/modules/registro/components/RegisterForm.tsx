"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser, signInWithGoogle } from "@/services/auth";
import GoogleIcon from "./GoogleIcon";
import styles from "../styles/RegisterForm.module.css";

type Form = {
  name: string;
  email: string;
  password: string;
  confirm: string;
  role: "reader" | "author";
};

interface RegisterFormProps {
  loading: boolean;
  oauthLoading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setOauthLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function RegisterForm({
  loading,
  oauthLoading,
  setLoading,
  setOauthLoading,
}: RegisterFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<Form>({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "reader",
  });

  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // VALIDACIONES
  const errors = useMemo(() => {
    const e: Partial<Record<keyof Form, string>> = {};

    if (!form.name.trim()) e.name = "El nombre es obligatorio.";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Correo inválido.";
    if (form.password.length < 6) e.password = "Mínimo 6 caracteres.";
    if (form.confirm !== form.password)
      e.confirm = "Las contraseñas no coinciden.";

    return e;
  }, [form]);

  const canSubmit = Object.keys(errors).length === 0;

  const onBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // SUBMIT NORMAL
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setTouched({ name: true, email: true, password: true, confirm: true });

    if (!canSubmit) return;

    setLoading(true);

    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });

      router.push("/biblioteca");
    } catch (error: any) {
      const msg = error?.message || "Error al registrar.";

      if (msg.includes("User already registered"))
        setErr("Ese correo ya está registrado.");
      else if (msg.includes("Password"))
        setErr("La contraseña es muy débil (mínimo 6).");
      else setErr(msg);
    } finally {
      setLoading(false);
    }
      
  };

  // GOOGLE
  const onGoogle = async () => {
    setErr(null);
    setOauthLoading(true);

    try {
      await signInWithGoogle(form.role);
      // 👉 redirige fuera de tu app al login de Google
      // el callback se maneja en /auth/callback
    } catch (error: any) {
      setErr(error?.message || "No se pudo continuar con Google.");
      setOauthLoading(false);
    }
  };

  return (
    <>
      {/* GOOGLE BUTTON */}
      <button
        type="button"
        className={styles.oauthBtn}
        onClick={onGoogle}
        disabled={oauthLoading}
        aria-label="Continuar con Google"
      >
        <GoogleIcon />
        {oauthLoading ? "Conectando..." : "Continuar con Google"}
      </button>

      <div className={styles.divider}>
        <span></span> <em>o</em> <span></span>
      </div>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {/* NOMBRE */}
        <div className={styles.group}>
          <label htmlFor="name">Nombre *</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Tu nombre"
          />
          {touched.name && errors.name && (
            <small className={styles.errMsg}>{errors.name}</small>
          )}
        </div>

        {/* EMAIL */}
        <div className={styles.group}>
          <label htmlFor="email">Correo *</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="tucorreo@ejemplo.com"
          />
          {touched.email && errors.email && (
            <small className={styles.errMsg}>{errors.email}</small>
          )}
        </div>

        {/* PASSWORDS */}
        <div className={styles.row}>
          <div className={styles.group}>
            <label htmlFor="password">Contraseña *</label>
            <input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Mínimo 6 caracteres"
            />
            {touched.password && errors.password && (
              <small className={styles.errMsg}>{errors.password}</small>
            )}
          </div>

          <div className={styles.group}>
            <label htmlFor="confirm">Confirmar *</label>
            <input
              id="confirm"
              name="confirm"
              type={showPwd ? "text" : "password"}
              value={form.confirm}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Repite tu contraseña"
            />
            {touched.confirm && errors.confirm && (
              <small className={styles.errMsg}>{errors.confirm}</small>
            )}
          </div>
        </div>

        {/* OPCIÓN MOSTRAR PASSWORD */}
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            onChange={() => setShowPwd((v) => !v)}
            checked={showPwd}
          />
          <span>Mostrar contraseña</span>
        </label>

        {/* ERROR GLOBAL */}
        {err && <div className={styles.error}>{err}</div>}

        {/* SUBMIT */}
        <button
          type="submit"
          className={styles.submit}
          disabled={!canSubmit || loading}
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>

        <p className={styles.note}>
          * Campos obligatorios. Al registrarte aceptas nuestros Términos y
          Política de Privacidad.
        </p>
      </form>

      <footer className={styles.footerLinks}>
        <a href="/login">¿Ya tienes cuenta? Inicia sesión</a>
      </footer>
    </>
  );
}
