'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/lib/theme-provider'; // 👈 importa tu provider

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
