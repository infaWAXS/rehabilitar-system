import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../assets/styles/variables.css';
import { logout, clearUserData, getRole, getUserName, getAccountStatus } from '../services/authService';

/* ── Menús por rol ─────────────────────────────────────── */
const menus = {
  admin: [
    { label: 'Usuarios',      ruta: '/admin/usuarios' },
    { label: 'Clientes',      ruta: '/admin/clientes' },
    { label: 'Aptos Físicos', ruta: '/admin/clientes/aptos-fisicos' },
    { label: 'Actividades',   ruta: '/admin/actividades' },
    { label: 'Asistencias',   ruta: '/admin/asistencias' },
  ],
  profesor: [
    { label: 'Actividades', ruta: '/profesor/actividades' },
    { label: 'Asistencias', ruta: '/profesor/asistencias' },
    { label: 'Mi Perfil',   ruta: '/perfil' },
  ],
  recepcionista: [
    { label: 'Actividades', ruta: '/recepcionista/actividades' },
    { label: 'Clientes',    ruta: '/recepcionista/clientes' },
    { label: 'Mi Perfil',   ruta: '/perfil' },
  ],
  cliente: [
    { label: 'Mis Reservas', ruta: '/cliente/reservas' },
    { label: 'Mi Cuenta',    ruta: '/cliente/cuenta' },
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
  /* Modal confirmar logout */
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '28px 32px',
    maxWidth: '360px',
    width: '100%',
    boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
  },
  modalTitulo: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '10px',
    color: 'var(--color-texto)',
  },
  modalTexto: {
    fontSize: '14px',
    color: 'var(--color-texto-suave)',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  modalBotones: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  modalCancelar: {
    padding: '9px 18px',
    borderRadius: '8px',
    border: '1px solid var(--color-borde)',
    background: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '600',
    color: 'var(--color-texto)',
  },
  modalConfirmar: {
    padding: '9px 18px',
    borderRadius: '8px',
    border: 'none',
    background: '#dc2626',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '700',
  },
  banner: {
    position: 'sticky',
    top: 0,
    zIndex: 60,
    background: '#fef3c7',
    borderBottom: '1px solid #f59e0b',
    padding: '10px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    fontSize: '14px',
    color: '#92400e',
    fontWeight: '500',
  },
  bannerLink: {
    color: '#b45309',
    fontWeight: '700',
    textDecoration: 'underline',
  },
};

function LayoutPrivado({ children, titulo = '' }) {
  const ubicacion = useLocation();
  const navigate = useNavigate();

  const [rol, setRol] = useState('admin');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [confirmarVisible, setConfirmarVisible] = useState(false);
  const [estadoCuenta, setEstadoCuenta] = useState('active');

  useEffect(() => {
    const roleGuardado = getRole();
    const nombreGuardado = getUserName();
    // Mapear roles del backend al nombre del menú
    const mapaRol = { admin: 'admin', client: 'cliente', professor: 'profesor', receptionist: 'recepcionista' };
    if (roleGuardado) setRol(mapaRol[roleGuardado] || roleGuardado);
    if (nombreGuardado) setNombreUsuario(nombreGuardado);
    setEstadoCuenta(getAccountStatus());
  }, []);

  const tieneSidebar = rol !== 'cliente' || ubicacion.pathname.startsWith('/cliente/') || ubicacion.pathname.startsWith('/perfil');
  const itemsMenu = menus[rol] || [];
  const estaSuspendido = rol === 'cliente' && estadoCuenta === 'suspended';
  const enPaginaCuenta = ubicacion.pathname === '/cliente/cuenta';

  const cerrarSesion = async () => {
    setConfirmarVisible(false);
    try {
      await logout();
    } catch (_) {}
    clearUserData();
    navigate('/');
  };

  return (
    <div style={s.wrapper}>
      {/* Sidebar — solo roles con panel lateral */}
      {tieneSidebar && (
        <aside style={s.sidebar}>
          <Link to="/" style={{ ...s.sidebarLogo, textDecoration: 'none' }}>
            Rehabilit<span style={s.sidebarAR}>AR</span>
          </Link>
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
            <button onClick={() => setConfirmarVisible(true)} style={s.cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        </aside>
      )}

      {/* Contenido principal */}
      <div style={{ ...s.main, marginLeft: tieneSidebar ? 'var(--sidebar-width)' : 0 }}>
        {/* Banner cuenta suspendida */}
        {estaSuspendido && (
          <div style={s.banner}>
            <span>&#9888; Tu cuenta está suspendida.</span>
            <Link to="/cliente/cuenta" style={s.bannerLink}>
              Ir a Gestión de cuenta para solicitar el reintegro →
            </Link>
          </div>
        )}
        <header style={{ ...s.navbar, top: estaSuspendido ? '45px' : 0 }}>
          <span style={s.navbarTitulo}>{titulo}</span>
          <span style={s.navbarUsuario}>{nombreUsuario || 'Mi cuenta'}</span>
        </header>
        <main style={{
          ...s.contenido,
          ...(estaSuspendido && !enPaginaCuenta ? {
            pointerEvents: 'none',
            opacity: 0.55,
            userSelect: 'none',
          } : {}),
        }}>
          {children}
        </main>
      </div>

      {/* Modal confirmar cierre de sesión */}
      {confirmarVisible && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <p style={s.modalTitulo}>Cerrar sesión</p>
            <p style={s.modalTexto}>¿Estás seguro que querés cerrar la sesión?</p>
            <div style={s.modalBotones}>
              <button style={s.modalCancelar} onClick={() => setConfirmarVisible(false)}>Cancelar</button>
              <button style={s.modalConfirmar} onClick={cerrarSesion}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LayoutPrivado;
