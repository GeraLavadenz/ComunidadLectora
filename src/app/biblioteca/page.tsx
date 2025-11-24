import React from 'react'
import Header from '@/components/header/header'
import Footer from '@/components/footer/footer'
import Biblioteca from '../../modules/biblioteca/biblioteca'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams
  let genre: string | null = null

  if (params && params.genre) {
    if (Array.isArray(params.genre)) {
      genre = params.genre[0]
    } else {
      genre = params.genre
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
