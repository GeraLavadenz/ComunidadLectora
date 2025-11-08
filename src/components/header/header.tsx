'use client';

import React from 'react';
import Image from 'next/image';
import logo from '../../../public/minilogo.png';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { NavigationMenu, NavigationMenuList } from '../ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuProvider,
} from '../ui/dropdown-menu';
import { Menu, Search, LogOut, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import GenreMenu from './components/GenreMenu';
import CommunityMenu from './components/CommunityMenu';
import CreateMenu from './components/CreateMenu';
import { genres, community, createOptions } from './data';
import styles from './styles/header.module.css';

// 👇 Asegúrate de tener este hook en tu AuthContext de Firebase
import { useAuth } from '@/context/AuthContext';

interface MenuItem {
  title: string;
  href: string;
}

const Header: React.FC = () => {
  const { user, logout } = useAuth(); // <- estado de Firebase

  // Si no hay sesión, manda a /login?redirect=<destino>
  const getHref = (href: string) =>
    user ? href : `/login?redirect=${encodeURIComponent(href)}`;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/"; // Redirect to home after logout
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo - Left */}
        <div className={styles.logoContainer}>
          <Link href="/">
            <Image
              src={logo}
              alt="Comunidad Lectora Bolivia"
              width={120}
              height={25}
              className={styles.logo}
              priority
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <NavigationMenu>
            <NavigationMenuList className={styles.navList}>
              <GenreMenu />
              <CommunityMenu />
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Search */}
        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <Input
              type="search"
              placeholder="Buscar historias, autores bolivianos..."
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Right Actions - Desktop */}
        <div className={styles.actionsContainer}>
          {/* 👇 Pasamos si está autenticado y la función getHref */}
          <CreateMenu isAuthenticated={!!user} getHref={getHref} />

          {user ? (
            <DropdownMenuProvider>
              <DropdownMenuTrigger asChild>
                <button className="relative h-8 w-8 rounded-full border-none bg-transparent hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'Usuario'} />
                    <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent floating className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuProvider>
          ) : (
            <>
              <Button variant="outline" asChild className={`${styles.button} ${styles.buttonText}`}>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button variant="outline" asChild className={`${styles.button} ${styles.buttonText}`}>
                <Link href="/register">Registrate</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className={styles.mobileMenu}>
          <div className={styles.mobileSearchContainer}>
            <div className={styles.mobileSearchWrapper}>
              <Search className={styles.searchIcon} />
              <Input type="search" placeholder="Buscar..." className={styles.searchInput} />
            </div>
          </div>

          <DropdownMenuProvider>
            <DropdownMenuTrigger className={styles.menuTrigger}>
              <Menu className={styles.menuIcon} />
            </DropdownMenuTrigger>

            <DropdownMenuContent floating className={styles.dropdownContent}>
              <DropdownMenuItem asChild>
                <Link href="/explore" className={styles.dropdownItem}>Explora</Link>
              </DropdownMenuItem>

              {genres.map((item: MenuItem) => (
                <DropdownMenuItem key={item.title} asChild>
                  <Link href={item.href} className={`${styles.dropdownItem} ${styles.dropdownItemIndented}`}>
                    {item.title}
                  </Link>
                </DropdownMenuItem>
              ))}

              <DropdownMenuItem asChild>
                <Link href="/community" className={styles.dropdownItem}>Comunidad</Link>
              </DropdownMenuItem>

              {community.map((item: MenuItem) => (
                <DropdownMenuItem key={item.title} asChild>
                  <Link href={item.href} className={`${styles.dropdownItem} ${styles.dropdownItemIndented}`}>
                    {item.title}
                  </Link>
                </DropdownMenuItem>
              ))}

              {/* 👇 “Crear” en móvil usa getHref para proteger si no hay sesión */}
              <DropdownMenuItem asChild>
                <Link href={getHref('/create')} className={styles.dropdownItem}>
                  Crear una historia nueva
                </Link>
              </DropdownMenuItem>

              {createOptions.map((item: MenuItem) => (
                <DropdownMenuItem key={item.title} asChild>
                  <Link
                    href={getHref(item.href)}
                    className={`${styles.dropdownItem} ${styles.dropdownItemIndented}`}
                  >
                    {item.title}
                  </Link>
                </DropdownMenuItem>
              ))}

              {!user && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login" className={styles.dropdownItem}>Iniciar sesión</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register" className={styles.dropdownItem}>Registrate</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenuProvider>
        </div>
      </div>
    </header>
  );
};

export default Header;
