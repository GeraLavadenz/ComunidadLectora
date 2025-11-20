'use client';

import React from 'react';
import Header from '@/components/header/header';
import Footer from '@/components/footer/footer';
import ResetForm from '@/modules/reset/components/ResetForm';

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ResetForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
