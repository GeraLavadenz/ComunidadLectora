'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logoCompleto from '../../../public/logoCompleto.png';
import minilogo from '../../../public/minilogo.png';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { NavigationMenu, NavigationMenuList } from '../ui/navigation-menu';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuProvider,
  useDropdownMenu,
} from '../ui/dropdown-menu';
import { Menu, Search, LogOut, User, ChevronDown } from 'lucide-react';
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

  const [isExploraOpen, setIsExploraOpen] = useState(false);
  const [isComunidadOpen, setIsComunidadOpen] = useState(false);
  const [isEscribirOpen, setIsEscribirOpen] = useState(false);

  const MobileMenuContent = () => {
    const { setIsOpen } = useDropdownMenu();

    return (
      <DropdownMenuContent floating className={styles.dropdownContent}>
        <DropdownMenuItem onClick={() => setIsExploraOpen(!isExploraOpen)} className={styles.dropdownItem}>
          <span>Explora</span>
          <ChevronDown className={`${styles.chevronIcon} ${isExploraOpen ? styles.chevronIconOpen : ''}`} />
        </DropdownMenuItem>
        {isExploraOpen && genres.map((item: MenuItem) => (
          <DropdownMenuItem key={item.title} asChild>
            <Link href={item.href} className={`${styles.dropdownItem} ${styles.dropdownItemIndented}`} onClick={() => setIsOpen(false)}>
              {item.title}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuItem onClick={() => setIsComunidadOpen(!isComunidadOpen)} className={styles.dropdownItem}>
          <span>Comunidad</span>
          <ChevronDown className={`${styles.chevronIcon} ${isComunidadOpen ? styles.chevronIconOpen : ''}`} />
        </DropdownMenuItem>
        {isComunidadOpen && community.map((item: MenuItem) => (
          <DropdownMenuItem key={item.title} asChild>
            <Link href={item.href} className={`${styles.dropdownItem} ${styles.dropdownItemIndented}`} onClick={() => setIsOpen(false)}>
              {item.title}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuItem onClick={() => setIsEscribirOpen(!isEscribirOpen)} className={styles.dropdownItem}>
          <span>Escribir</span>
          <ChevronDown className={`${styles.chevronIcon} ${isEscribirOpen ? styles.chevronIconOpen : ''}`} />
        </DropdownMenuItem>
        {isEscribirOpen && createOptions.map((item: MenuItem) => (
          <DropdownMenuItem key={item.title} asChild>
            <Link href={getHref(item.href)} className={`${styles.dropdownItem} ${styles.dropdownItemIndented}`} onClick={() => setIsOpen(false)}>
              {item.title}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    );
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo - Left */}
        <div className={styles.logoContainer}>
          <Link href="/">
            <Image
              src={logoCompleto}
              alt="Comunidad Lectora Bolivia"
              width={120}
              height={15}
              className={styles.logoCompleto}
              priority
            />
            <Image
              src={minilogo}
              alt="Comunidad Lectora Bolivia"
              width={120}
              height={15}
              className={styles.minilogo}
              priority
            />
          </Link>
        </div>

        {/* Search - Only Mobile */}
        <div className={styles.mobileSearchContainer}>
          <div className={styles.mobileSearchWrapper}>
            <Search className={styles.searchIcon} />
            <Input type="search" placeholder="Buscar..." className={styles.searchInput} />
          </div>
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
          <DropdownMenuProvider>
            <DropdownMenuTrigger className={styles.menuTrigger}>
              <Menu className={styles.menuIcon} />
            </DropdownMenuTrigger>

            <MobileMenuContent />
          </DropdownMenuProvider>
        </div>

        {/* Login/Register Buttons for Mobile */}
        {!user && (
          <div className={styles.mobileAuthButtons}>
            <Button variant="outline" asChild className={`${styles.button} ${styles.buttonText}`}>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button variant="outline" asChild className={`${styles.button} ${styles.buttonText}`}>
              <Link href="/register">Registrate</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
