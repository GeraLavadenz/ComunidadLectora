// src/app/test-signup/page.tsx
"use client";
import { supabase } from "@/lib/supabase";

export default function TestSignup() {
  const run = async () => {
    const res = await supabase.auth.signUp({ email: "a@a.com", password: "Prueba123!" });
    console.log("signup res:", res);
    alert(res?.error?.message || "OK");
  };

  return <button onClick={run}>Probar signUp</button>;
}
