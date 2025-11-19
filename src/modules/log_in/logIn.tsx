'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/header/header';
import Footer from '@/components/footer/footer';
import LoginShell from './components/LoginShell';
import LoginCard from './components/LoginCard';
import LoginHeader from './components/LoginHeader';
import LoginForm from './components/LoginForm';


export default function Login() {
  const params = useSearchParams();
  const redirectParam = params.get('redirect') || '/';

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <LoginShell>
          <LoginCard>
            <LoginHeader />
            <LoginForm redirectParam={redirectParam} />
          </LoginCard>
        </LoginShell>
      </main>
    </div>
  );
}
