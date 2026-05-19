import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getToken, getRole, getUserName, clearUserData, logout } from '../../services/authService';
import { getRooms } from '../../services/roomsService';

/* ── Menús por rol (no-admin) ──────────────────────────── */
const MENUS_ROL = {
  client: [
    { label: 'Ver mis actividades', ruta: '/cliente/actividades' },
    { label: 'Mis Reservas',        ruta: '/cliente/reservas' },
    { label: 'Lista de Espera',     ruta: '/cliente/lista-espera' },
    { label: 'Suscripciones',       ruta: '/cliente/suscripciones' },
    { label: 'Mi Cuenta',           ruta: '/cliente/cuenta' },
    { label: 'Mi Perfil',           ruta: '/perfil' },
  ],
  professor: [
    { label: 'Mis Actividades', ruta: '/profesor/actividades' },
    { label: 'Asistencias',     ruta: '/profesor/asistencias' },
    { label: 'Mi Perfil',       ruta: '/perfil' },
  ],
  receptionist: [
    { label: 'Clientes',    ruta: '/admin/clientes' },
    { label: 'Asistencias', ruta: '/admin/asistencias' },
    { label: 'Mi Perfil',   ruta: '/perfil' },
  ],
};

/* ── Menú del sidebar de admin ─────────────────────────── */
const MENU_ADMIN = [
  { label: 'Usuarios',    ruta: '/admin/usuarios' },
  { label: 'Clientes',    ruta: '/admin/clientes' },
  { label: 'Actividades', ruta: '/admin/actividades' },
  { label: 'Asistencias', ruta: '/admin/asistencias' },
];

const s = {
  pagina: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #F0FBFB 0%, #FFFFFF 100%)',
    color: 'var(--color-texto)',
  },
  topbar: {
    height: '72px',
    borderBottom: '1px solid var(--color-borde)',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 20,
  },
  brand: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--color-primario)',
    letterSpacing: '-0.5px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  brandAr: {
    color: 'var(--color-secundario)',
  },
  topActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  topNav: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  navLink: {
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-texto)',
    textDecoration: 'none',
  },
  btnGhost: {
    border: '1px solid var(--color-primario)',
    color: 'var(--color-primario)',
    background: 'transparent',
    borderRadius: '8px',
    padding: '9px 14px',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
  },
  btnSolid: {
    border: 'none',
    color: '#fff',
    background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
    borderRadius: '8px',
    padding: '10px 15px',
    fontSize: '14px',
    fontWeight: '700',
    textDecoration: 'none',
  },
  /* Botón usuario (topbar) */
  userBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 14px 7px 8px',
    background: 'var(--color-primario-suave, #e8f5f5)',
    border: '1px solid var(--color-borde)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-primario-oscuro, #0d7377)',
  },
  userAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-primario), var(--color-secundario))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '700',
    flexShrink: 0,
  },
  dropdownWrapper: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    background: '#fff',
    border: '1px solid var(--color-borde)',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    minWidth: '200px',
    zIndex: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    display: 'block',
    padding: '11px 16px',
    fontSize: '14px',
    color: 'var(--color-texto)',
    textDecoration: 'none',
  },
  dropdownDivider: {
    height: '1px',
    background: 'var(--color-borde)',
    margin: '4px 0',
  },
  dropdownLogout: {
    display: 'block',
    width: '100%',
    padding: '11px 16px',
    fontSize: '14px',
    color: '#dc2626',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
  },
  /* Admin layout */
  adminWrapper: {
    display: 'flex',
    minHeight: 'calc(100vh - 72px)',
  },
  adminSidebar: {
    width: '220px',
    background: 'var(--color-fondo-sidebar)',
    flexShrink: 0,
    position: 'sticky',
    top: '72px',
    height: 'calc(100vh - 72px)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '8px',
  },
  adminNav: {
    flex: 1,
    padding: '8px 0',
  },
  adminNavItem: {
    display: 'block',
    padding: '12px 24px',
    color: 'rgba(255,255,255,0.75)',
    fontSize: '14px',
    textDecoration: 'none',
    transition: 'all 0.15s',
    borderLeft: '3px solid transparent',
  },
  adminSidebarFooter: {
    padding: '16px 24px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  adminLogoutBtn: {
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
  adminContent: {
    flex: 1,
    overflowX: 'hidden',
  },
  hero: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '56px 24px 32px',
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: '28px',
  },
  heroTitle: {
    fontSize: '46px',
    lineHeight: 1.1,
    fontWeight: '800',
    marginBottom: '14px',
    color: 'var(--color-texto)',
  },
  heroText: {
    fontSize: '16px',
    lineHeight: 1.7,
    color: 'var(--color-texto-suave)',
    marginBottom: '20px',
  },
  pillRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  pill: {
    background: 'var(--color-primario-suave)',
    color: 'var(--color-primario-oscuro)',
    borderRadius: '999px',
    padding: '6px 11px',
    fontSize: '12px',
    fontWeight: '600',
  },
  heroCard: {
    background: '#fff',
    border: '1px solid var(--color-borde)',
    borderRadius: '14px',
    boxShadow: 'var(--sombra)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--color-texto)',
  },
  cardText: {
    color: 'var(--color-texto-suave)',
    fontSize: '14px',
  },
  cardLink: {
    marginTop: '8px',
    fontWeight: '700',
    color: 'var(--color-primario)',
    textDecoration: 'none',
    display: 'block',
  },
  seccion: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '10px 24px 48px',
  },
  seccionTitulo: {
    fontSize: '26px',
    fontWeight: '800',
    marginBottom: '18px',
  },
  gridNoticias: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '16px',
  },
  noticia: {
    background: '#fff',
    border: '1px solid var(--color-borde)',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: 'var(--sombra)',
  },
  noticiaTag: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '700',
    marginBottom: '8px',
    color: 'var(--color-secundario-oscuro)',
    background: 'var(--color-secundario-suave)',
    padding: '4px 8px',
    borderRadius: '999px',
  },
  noticiaTitulo: {
    fontWeight: '700',
    marginBottom: '6px',
    fontSize: '16px',
  },
  noticiaTexto: {
    color: 'var(--color-texto-suave)',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  footer: {
    borderTop: '1px solid var(--color-borde)',
    textAlign: 'center',
    padding: '18px 24px 30px',
    color: 'var(--color-texto-suave)',
    fontSize: '13px',
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
};

function InicioPublico() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [confirmarVisible, setConfirmarVisible] = useState(false);
  const dropdownRef = useRef(null);

  const token   = getToken();
  const role    = getRole();   // 'admin' | 'client' | 'professor' | 'receptionist' | null
  const nombre  = getUserName();
  const inicial = nombre ? nombre[0].toUpperCase() : '?';

  const estaLogueado = !!token;
  const esAdmin      = role === 'admin';

  useEffect(() => {
    getRooms().then(data => setRooms(data.rooms || [])).catch(() => setRooms([]));
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cerrarSesion = async () => {
    setConfirmarVisible(false);
    setMenuAbierto(false);
    try { await logout(); } catch (_) {}
    clearUserData();
    navigate('/');
  };

  const pedirConfirmacion = () => {
    setMenuAbierto(false);
    setConfirmarVisible(true);
  };

  const opcionesMenu = MENUS_ROL[role] || [];

  /* ── Contenido principal de la página ─────────────────── */
  const contenido = (
    <>
      <section style={s.hero}>
        <div>
          <h1 style={s.heroTitle}>Centro de Kinesiología con seguimiento inteligente</h1>
          <p style={s.heroText}>
            Espacio para novedades, actividades y noticias del centro.
            Los usuarios autenticados acceden a sus funciones según su rol.
          </p>
          <div style={s.pillRow}>
            <span style={s.pill}>Rehabilitación</span>
            <span style={s.pill}>Reserva de turnos</span>
            <span style={s.pill}>Asistencia</span>
            <span style={s.pill}>Kinesiología deportiva</span>
          </div>
        </div>

        <div style={s.heroCard}>
          {!estaLogueado && (
            <>
              <div style={s.cardTitle}>¡Bienvenido!</div>
              <p style={s.cardText}>Iniciá sesión o registrate para acceder a todas las funciones.</p>
              <Link to="/login"    style={s.cardLink}>Iniciar sesión →</Link>
              <Link to="/registro" style={s.cardLink}>Registrarse →</Link>
            </>
          )}
          {estaLogueado && (
            <>
              <div style={s.cardTitle}>Hola, {nombre}</div>
              <p style={s.cardText}>Usá el menú arriba a la derecha para navegar.</p>
              {role === 'client'       && <Link to="/cliente/actividades"    style={s.cardLink}>Ver actividades →</Link>}
              {role === 'professor'   && <Link to="/profesor/actividades"      style={s.cardLink}>Mis actividades →</Link>}
              {role === 'receptionist' && <Link to="/admin/clientes"             style={s.cardLink}>Ver clientes →</Link>}
              {role === 'admin'        && <Link to="/admin/usuarios"          style={s.cardLink}>Gestión de usuarios →</Link>}
            </>
          )}
        </div>
      </section>

      <section style={s.seccion}>
        <h2 style={s.seccionTitulo}>Novedades del centro</h2>
        <div style={s.gridNoticias}>
          <article style={s.noticia}>
            <span style={s.noticiaTag}>CLASES</span>
            <h3 style={s.noticiaTitulo}>Nuevos horarios de rehabilitación funcional</h3>
            <p style={s.noticiaTexto}>Ya se encuentran disponibles los nuevos turnos de la tarde para actividades guiadas.</p>
          </article>
          <article style={s.noticia}>
            <span style={s.noticiaTag}>PAGOS</span>
            <h3 style={s.noticiaTitulo}>Suscripciones mensuales con Mercado Pago</h3>
            <p style={s.noticiaTexto}>Los clientes pueden consultar y pagar su plan desde la sección de suscripciones.</p>
          </article>
          <article style={s.noticia}>
            <span style={s.noticiaTag}>ASISTENCIAS</span>
            <h3 style={s.noticiaTitulo}>Registro por DNI simplificado</h3>
            <p style={s.noticiaTexto}>El personal puede registrar asistencia en segundos con validación de identidad.</p>
          </article>
        </div>
      </section>

      <section style={s.seccion}>
        <h2 style={s.seccionTitulo}>Salas disponibles</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
          {rooms.length === 0 && <span>No hay salas registradas.</span>}
          {rooms.map(room => (
            <div key={room.id} style={{
              background: '#fff',
              border: '1px solid var(--color-borde)',
              borderRadius: 12,
              padding: 16,
              minWidth: 180,
              boxShadow: 'var(--sombra)',
            }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{room.name}</div>
              <div style={{ color: 'var(--color-texto-suave)', fontSize: 13 }}>Tipo: {room.type}</div>
            </div>
          ))}
        </div>
      </section>

      <footer style={s.footer}>RehabilitAR — Plataforma de gestión para centro de kinesiología</footer>
    </>
  );

  return (
    <div style={s.pagina}>

      {/* ── Topbar ─────────────────────────────────────── */}
      <header style={s.topbar}>
        <Link to="/" style={s.brand}>
          Rehabilit<span style={s.brandAr}>AR</span>
        </Link>

        {/* Navegación pública */}
        <nav style={s.topNav}>
          <Link to="/staff" style={s.navLink}>Staff</Link>
        </nav>

        <div style={s.topActions}>
          {/* No autenticado: botones de auth */}
          {!estaLogueado && (
            <>
              <Link to="/login"    style={s.btnGhost}>Ingresar</Link>
              <Link to="/registro" style={s.btnSolid}>Registrarse</Link>
            </>
          )}

          {/* Autenticado: botón usuario con dropdown */}
          {estaLogueado && (
            <div style={s.dropdownWrapper} ref={dropdownRef}>
              <button style={s.userBtn} onClick={() => setMenuAbierto(v => !v)}>
                <span style={s.userAvatar}>{inicial}</span>
                {nombre}
              </button>

              {menuAbierto && (
                <div style={s.dropdown}>
                  {opcionesMenu.map(item => (
                    <Link
                      key={item.ruta}
                      to={item.ruta}
                      style={s.dropdownItem}
                      onClick={() => setMenuAbierto(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  {opcionesMenu.length > 0 && <div style={s.dropdownDivider} />}
                  <button onClick={pedirConfirmacion} style={s.dropdownLogout}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Layout: admin con sidebar, resto sin sidebar ── */}
      {esAdmin ? (
        <div style={s.adminWrapper}>
          <aside style={s.adminSidebar}>
            <nav style={s.adminNav}>
              {MENU_ADMIN.map(item => (
                <Link key={item.ruta} to={item.ruta} style={s.adminNavItem}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div style={s.adminSidebarFooter}>
              <button onClick={pedirConfirmacion} style={s.adminLogoutBtn}>
                Cerrar sesión
              </button>
            </div>
          </aside>
          <div style={s.adminContent}>
            {contenido}
          </div>
        </div>
      ) : (
        contenido
      )}

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

export default InicioPublico;
