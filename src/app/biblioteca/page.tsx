import React from 'react'
import Header from '@/components/header/header'
import Footer from '@/components/footer/footer'
import Biblioteca from '../../modules/biblioteca/biblioteca'

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function Page({ searchParams }: PageProps) {
  let genre: string | null = null

  if (searchParams && searchParams.genre) {
    if (Array.isArray(searchParams.genre)) {
      genre = searchParams.genre[0]
    } else {
      genre = searchParams.genre
    }
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
