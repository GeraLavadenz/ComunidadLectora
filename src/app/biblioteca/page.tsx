'use client';

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/header/header'
import Footer from '@/components/footer/footer'
import Biblioteca from '../../modules/biblioteca/biblioteca'

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function Page({ searchParams }: PageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  let genre: string | null = null

  if (searchParams && searchParams.genre) {
    if (Array.isArray(searchParams.genre)) {
      genre = searchParams.genre[0]
    } else {
      genre = searchParams.genre
    }
  }

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  if (!user) {
    return null; // Redirect will happen, no need to render
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Biblioteca genre={genre} />
      </main>
      <Footer />
    </div>
  )
}
