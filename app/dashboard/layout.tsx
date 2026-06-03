"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // <-- 1. Agregamos usePathname
import Link from 'next/link'; // <-- 2. Importamos el componente Link
import { useAuthStore } from '@/store/authStore';
import { AlignEndHorizontal, Package, FileText, Users, LogOut, ShieldCheck, PlusCircle ,ClipboardPenLine ,ReceiptText,FilePenLine,ChartPie } from 'lucide-react'; // <-- 3. Agregamos PlusCircle
import styles from './layout.module.css';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); // esto nos dice en qué página estamos (ej: '/dashboard/products')
  
  const { user, isAuthenticated, isLoading, checkAuth, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  if (!mounted || isLoading) {
    return <div className={styles.loadingScreen}>Iniciando entorno seguro ALZ ORION...</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className={styles.dashboardContainer}>
      
      {/* MENÚ LATERAL */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoIcon}>
            <ShieldCheck color="black" size={24} />
          </div>
          <h2 className={styles.brandName}>ALZ ORION</h2>
        </div>

        <nav className={styles.navMenu}>
          
          {/* DASHBOARD PRINCIPAL */}
          <Link href="/dashboard" className={`${styles.navItem} ${pathname === '/dashboard' ? styles.navItemActive : ''}`}>
            <AlignEndHorizontal size={20} />
            <span>Analitica Logistica</span>
          </Link>
          {/* ACTAS DE SALIDA */}
          {(user?.role === 'admin'|| user?.role === 'consultor')&&(
          <Link href="/dashboard/analytics" className={`${styles.navItem} ${pathname.includes('/dashboard/analytics') ? styles.navItemActive : ''}`}>
            <ChartPie size={20} />
            <span>Analitica Comercial</span>
          </Link>)}
         
          <Link href="/dashboard/products" className={`${styles.navItem} ${pathname.includes('/dashboard/products') ? styles.navItemActive : ''}`}>
            <PlusCircle size={20} />
            <span>Catálogo</span>
          </Link>

          {/* INVENTARIO
          <Link href="/dashboard/inventory" className={`${styles.navItem} ${pathname.includes('/dashboard/inventory') ? styles.navItemActive : ''}`}>
            <Package size={20} />
            <span>Inventario</span>
          </Link>
                        */}
          {/* ACTAS DE SALIDA */}
          {(user?.role === 'admin'||user?.role=== 'logistica')&&(
          <Link href="/dashboard/actas" className={`${styles.navItem} ${pathname.includes('/dashboard/actas') ? styles.navItemActive : ''}`}>
            <FileText size={20} />
            <span>Actas de Salida</span>
          </Link>)}
          
          {/* USUARIOS (Solo admin) */}
          {user?.role === 'admin' && (
            <Link href="/dashboard/users" className={`${styles.navItem} ${pathname.includes('/dashboard/users') ? styles.navItemActive : ''}`}>
              <Users size={20} />
              <span>Usuarios</span>
            </Link>
          )}
          {/* Cotizaciones */}
          {(user?.role === 'admin' || user?.role === 'consultor')&& (
            <Link 
              href="/dashboard/quotes" 
              className={`${styles.navItem} ${
                pathname.includes('/dashboard/quotes') && !pathname.includes('/dashboard/quotes/template') 
                  ? styles.navItemActive 
                  : ''
              }`}
            >
              <ReceiptText size={20}/>
              <span>Cotizaciones</span>
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link href="/dashboard/settings/template" className={`${styles.navItem} ${pathname.includes('/dashboard/settings/template') ? styles.navItemActive : ''}`}>
              <ClipboardPenLine size={20} />
              <span>Modificar Actas</span>
            </Link> )}
           {user?.role === 'admin' && (
            <Link href="/dashboard/quotes/template" className={`${styles.navItem} ${pathname.includes('/dashboard/quotes/template') ? styles.navItemActive : ''}`}>
              <FilePenLine size={20}/>
              <span>Modificar SO</span>
            </Link>)}
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.full_name}</span>
            <span className={styles.userRole}>{user?.role}</span>
            <button onClick={() => logout()} className={styles.logoutButton}>
              <LogOut size={16} />
              <span>Salir</span>
            </button>
          </div>
        </header>

        {/* CONTENIDO INTERNO */}
        <div className={styles.pageContent}>
          {children}
        </div>
      </main>
      
    </div>
  );
}