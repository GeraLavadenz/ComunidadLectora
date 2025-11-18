// app/auth/register/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import supabaseBrowser from "../../utils/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;

    if (!name || !email || !password) {
      setErrorMsg("Completa todos los campos obligatorios.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    if (password !== confirm) {
      setErrorMsg("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error ?? "Error al crear la cuenta.");
        setLoading(false);
        return;
      }

      // Registro exitoso: redirigir al login o a la página principal
      router.push("/auth/login");
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de red. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setOauthLoading(false);
      }
      // Si no hay error, Supabase redirige al flujo de OAuth.
    } catch (err) {
      console.error(err);
      setErrorMsg("No se pudo iniciar sesión con Google.");
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#071029] to-[#0b1630]">
      <div className="w-full max-w-lg bg-[#0e1629]/80 backdrop-blur-md rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Crear cuenta</h1>
        <p className="text-sm text-[#cfd8ff]/70 mb-6">Únete a KOLLA — empieza a leer y escribir.</p>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={oauthLoading}
          className="w-full flex items-center justify-center gap-3 bg-[#ffffff]/95 text-black p-3 rounded-lg font-semibold mb-6"
        >
          <img src="/google.svg" alt="google" className="w-5 h-5" />
          {oauthLoading ? "Abriendo Google..." : "Continuar con Google"}
        </button>

        <div className="flex items-center gap-3 text-[#aab3d9]/70 mb-6">
          <hr className="flex-1 border-[#3a3f57]" />
          <span className="text-sm">o</span>
          <hr className="flex-1 border-[#3a3f57]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nombre *</label>
            <input
              name="name"
              required
              placeholder="Tu nombre"
              className="w-full p-3 bg-[#0b1120] rounded-lg placeholder:text-[#7d8399]"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Correo *</label>
            <input
              name="email"
              type="email"
              required
              placeholder="tucorreo@ejemplo.com"
              className="w-full p-3 bg-[#0b1120] rounded-lg placeholder:text-[#7d8399]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Contraseña *</label>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full p-3 bg-[#0b1120] rounded-lg placeholder:text-[#7d8399]"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Confirmar *</label>
              <input
                name="confirm"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Repite tu contraseña"
                className="w-full p-3 bg-[#0b1120] rounded-lg placeholder:text-[#7d8399]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <input
              id="showPassword"
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword((s) => !s)}
              className="w-4 h-4"
            />
            <label htmlFor="showPassword">Mostrar contraseña</label>
          </div>

          {errorMsg && <div className="text-red-400 text-sm">{errorMsg}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 p-3 rounded-lg bg-blue-600 font-bold disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-sm text-center text-[#c5d0ff]/60 mt-6">
          * Campos obligatorios. Al registrarte aceptas nuestros Términos y la Política de Privacidad.
        </p>

        <div className="text-center mt-4">
          <a href="/auth/login" className="text-sm text-[#9fb0ff] hover:underline">
            ¿Ya tienes cuenta? Inicia sesión
          </a>
        </div>
      </div>
    </div>
  );
}
