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

export default function RegisterForm({ loading, oauthLoading, setLoading, setOauthLoading }: RegisterFormProps) {
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

  const errors = useMemo(() => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio.";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Correo inválido.";
    if (form.password.length < 6) e.password = "Mínimo 6 caracteres.";
    if (form.confirm !== form.password) e.confirm = "Las contraseñas no coinciden.";
    return e;
  }, [form]);

  const canSubmit = useMemo(
    () => Object.keys(errors).length === 0,
    [errors]
  );

  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    setTouched((t) => ({ ...t, [e.target.name]: true }));

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (!canSubmit) return;
    setErr(null);
    setLoading(true);
    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      router.push("/biblioteca");
    } catch (error: unknown) {
      const msg = (error as Error)?.message || "Error al registrar.";
      if (msg.includes("email-already-in-use")) setErr("Ese correo ya está registrado.");
      else if (msg.includes("weak-password")) setErr("La contraseña es muy débil (min 6).");
      else setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setErr(null);
    setOauthLoading(true);
    try {
      await signInWithGoogle(form.role);
      router.push("/biblioteca");
    } catch (error: unknown) {
      setErr((error as Error)?.message || "No se pudo continuar con Google.");
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <>
      {/* Botón Google */}
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
        {/* Nombre */}
        <div className={styles.group}>
          <label htmlFor="name">
            Nombre <span className={styles.required} title="Campo obligatorio">*</span>
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Tu nombre"
            required
            aria-required="true"
            aria-invalid={touched.name && !!errors.name}
            data-invalid={touched.name && !!errors.name || undefined}
          />
          {touched.name && errors.name && (
            <small className={styles.errMsg}>{errors.name}</small>
          )}
        </div>

        {/* Correo */}
        <div className={styles.group}>
          <label htmlFor="email">
            Correo <span className={styles.required} title="Campo obligatorio">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="tucorreo@ejemplo.com"
            required
            aria-required="true"
            aria-invalid={touched.email && !!errors.email}
            data-invalid={touched.email && !!errors.email || undefined}
          />
          {touched.email && errors.email && (
            <small className={styles.errMsg}>{errors.email}</small>
          )}
        </div>

        {/* Password + Confirm */}
        <div className={styles.row}>
          <div className={styles.group}>
            <label htmlFor="password">
              Contraseña <span className={styles.required} title="Campo obligatorio">*</span>
            </label>
            <input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Mínimo 6 caracteres"
              required
              aria-required="true"
              aria-invalid={touched.password && !!errors.password}
              data-invalid={touched.password && !!errors.password || undefined}
            />
            {touched.password && errors.password && (
              <small className={styles.errMsg}>{errors.password}</small>
            )}
          </div>

          <div className={styles.group}>
            <label htmlFor="confirm">
              Confirmar <span className={styles.required} title="Campo obligatorio">*</span>
            </label>
            <input
              id="confirm"
              name="confirm"
              type={showPwd ? "text" : "password"}
              value={form.confirm}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Repite tu contraseña"
              required
              aria-required="true"
              aria-invalid={touched.confirm && !!errors.confirm}
              data-invalid={touched.confirm && !!errors.confirm || undefined}
            />
            {touched.confirm && errors.confirm && (
              <small className={styles.errMsg}>{errors.confirm}</small>
            )}
          </div>
        </div>

        {/* Opciones inline */}
        <div className={styles.inline}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              onChange={() => setShowPwd((v) => !v)}
              checked={showPwd}
            />
            <span>Mostrar contraseña</span>
          </label>

        </div>

        {/* Error global */}
        {err && <div className={styles.error} role="alert">{err}</div>}

        {/* Submit */}
        <button
          className={styles.submit}
          type="submit"
          disabled={!canSubmit || loading}
          data-pending={loading || undefined}
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>

        <p className={styles.note}>
          <span className={styles.required} aria-hidden>*</span> Campos obligatorios. Al registrarte,
          aceptas nuestros Términos y la Política de Privacidad.
        </p>
      </form>

      <footer className={styles.footerLinks}>
        <a href="/login">¿Ya tienes cuenta? Inicia sesión</a>
      </footer>
    </>
  );
}


