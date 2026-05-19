import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../assets/styles/variables.css';

/* ── Menús por rol ─────────────────────────────────────── */
const menus = {
  admin: [
    { label: 'Usuarios',     ruta: '/admin/usuarios' },
    { label: 'Clientes',     ruta: '/admin/clientes' },
    { label: 'Actividades',  ruta: '/admin/actividades' },
    { label: 'Asistencias',  ruta: '/admin/asistencias' },
  ],
  cliente: [
    { label: 'Actividades',  ruta: '/cliente/actividades' },
    { label: 'Mis Reservas', ruta: '/cliente/reservas' },
    { label: 'Lista de Espera', ruta: '/cliente/lista-espera' },
    { label: 'Suscripciones', ruta: '/cliente/suscripciones' },
    { label: 'Mi Cuenta',    ruta: '/cliente/cuenta' },
    { label: 'Mi Perfil',    ruta: '/perfil' },
  ],
  kinesiologo: [
    { label: 'Mis Actividades', ruta: '/kinesiologo/actividades' },
    { label: 'Asistencias',     ruta: '/kinesiologo/asistencias' },
    { label: 'Mi Perfil',       ruta: '/perfil' },
  ],
  recepcionista: [
    { label: 'Clientes',     ruta: '/recepcionista/clientes' },
    { label: 'Asistencias',  ruta: '/recepcionista/asistencias' },
    { label: 'Mi Perfil',    ruta: '/perfil' },
  ],
};

/* ── Estilos ────────────────────────────────────────────── */
const s = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: 'var(--sidebar-width)',
    background: 'var(--color-fondo-sidebar)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: 100,
    transition: 'transform 0.25s ease',
  },
  sidebarLogo: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--color-texto-claro)',
  },
  sidebarAR: {
    color: 'var(--color-acento)',
  },
  nav: {
    flex: 1,
    padding: '16px 0',
    overflowY: 'auto',
  },
  navItem: (activo) => ({
    display: 'block',
    padding: '12px 24px',
    color: activo ? 'var(--color-acento)' : 'rgba(255,255,255,0.75)',
    background: activo ? 'rgba(255,255,255,0.07)' : 'transparent',
    borderLeft: activo ? '3px solid var(--color-acento)' : '3px solid transparent',
    fontWeight: activo ? '600' : '400',
    fontSize: '14px',
    transition: 'all 0.15s',
    textDecoration: 'none',
  }),
  sidebarFooter: {
    padding: '16px 24px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  cerrarSesion: {
    display: 'block',
    width: '100%',
    padding: '10px 16px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '6px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  main: {
    marginLeft: 'var(--sidebar-width)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  navbar: {
    height: 'var(--navbar-height)',
    background: 'var(--color-fondo-card)',
    borderBottom: '1px solid var(--color-borde)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    boxShadow: 'var(--sombra)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  navbarTitulo: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--color-texto)',
  },
  navbarUsuario: {
    fontSize: '14px',
    color: 'var(--color-texto-suave)',
  },
  contenido: {
    flex: 1,
    padding: '32px',
    background: 'var(--color-fondo)',
  },
  rolSelector: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-borde)',
    fontSize: '13px',
    color: 'var(--color-texto)',
    background: 'var(--color-fondo)',
    cursor: 'pointer',
  },
};

function LayoutPrivado({ children, titulo = '' }) {
  const ubicacion = useLocation();
  // Selector de rol solo para desarrollo — reemplazar con contexto de auth real
  const [rol, setRol] = useState('admin');
  const itemsMenu = menus[rol] || [];

  return (
    <div style={s.wrapper}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>
          Rehabilit<span style={s.sidebarAR}>AR</span>
        </div>
        <nav style={s.nav}>
          {itemsMenu.map((item) => (
            <Link
              key={item.ruta}
              to={item.ruta}
              style={s.navItem(ubicacion.pathname.startsWith(item.ruta))}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={s.sidebarFooter}>
          <Link to="/login" style={s.cerrarSesion}>
            Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* Contenido principal */}
      <div style={s.main}>
        <header style={s.navbar}>
          <span style={s.navbarTitulo}>{titulo}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Selector temporal de rol para desarrollo */}
            <select
              style={s.rolSelector}
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              title="Cambiar rol (solo desarrollo)"
            >
              <option value="admin">Admin</option>
              <option value="cliente">Cliente</option>
              <option value="kinesiologo">Kinesiólogo</option>
              <option value="recepcionista">Recepcionista</option>
            </select>
            <span style={s.navbarUsuario}>Usuario Demo</span>
          </div>
        </header>
        <main style={s.contenido}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default LayoutPrivado;
