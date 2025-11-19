"use client";

import Landing from "@/modules/landing/landing";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/biblioteca");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  if (user) {
    return null; // User is logged in, redirect will happen, no need to render landing
  }

  return <Landing />;
}
