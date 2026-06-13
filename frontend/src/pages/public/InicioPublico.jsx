// Responsable: Francis
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getToken, getRole, getUserName, clearUserData, logout } from '../../services/authService';
import { getActivities, getActivityById, getActivityAvailability } from '../../services/activitiesService';
import { getMyReservations } from '../../services/reservationsService';
import apiClient from '../../services/apiClient';
import FiltroActividades from './FiltroActividades';

/* ── Menús por rol (no-admin) ──────────────────────────── */
const MENUS_ROL = {
  client: [
    { label: 'Mis Reservas',        ruta: '/cliente/reservas' },
    { label: 'Mi Cuenta',           ruta: '/cliente/cuenta' },
    { label: 'Mi Perfil',           ruta: '/perfil' },
  ],
  professor: [
    { label: 'Actividades', ruta: '/profesor/actividades' },
    { label: 'Mi Perfil',   ruta: '/perfil' },
  ],
  receptionist: [
    { label: 'Actividades', ruta: '/recepcionista/actividades' },
    { label: 'Clientes',    ruta: '/recepcionista/clientes' },
    { label: 'Mi Perfil',   ruta: '/perfil' },
  ],
};

/* ── Menú del sidebar de admin ─────────────────────────── */
const MENU_ADMIN = [
  { label: 'Usuarios',      ruta: '/admin/usuarios' },
  { label: 'Clientes',      ruta: '/admin/clientes' },
  { label: 'Aptos Físicos', ruta: '/admin/clientes/aptos-fisicos' },
  { label: 'Actividades',   ruta: '/admin/actividades' },
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
  notifWrapper: {
    position: 'relative',
  },
  notifButton: {
    position: 'relative',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-texto-suave)',
    fontSize: '18px',
    padding: '6px 8px',
    borderRadius: '8px',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    background: 'var(--color-acento)',
    color: '#fff',
    borderRadius: '999px',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: 700,
  },
  notifPanel: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    width: '320px',
    maxHeight: '340px',
    overflowY: 'auto',
    background: '#fff',
    border: '1px solid var(--color-borde)',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    zIndex: 210,
  },
  notifItem: {
    padding: '10px 12px',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    fontSize: '13px',
    cursor: 'pointer',
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
  gridActividades: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px',
  },
  actCard: {
    background: '#fff',
    border: '1px solid var(--color-borde)',
    borderRadius: '12px',
    padding: '18px',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  actNombre: { fontWeight: '700', fontSize: '16px', color: 'var(--color-texto)' },
  actSala: { fontSize: '12px', fontWeight: '600', color: 'var(--color-primario)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  actHorario: { fontSize: '13px', color: 'var(--color-texto-suave)' },
  actProfesor: { fontSize: '13px', color: 'var(--color-texto-suave)' },
  actPrecio: { fontSize: '15px', fontWeight: '700', color: 'var(--color-texto)', marginTop: '4px' },
  actChip: (tipo) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: '600',
    background: tipo === 'individual' ? '#f3e8ff' : '#dbeafe',
    color: tipo === 'individual' ? '#7e22ce' : '#1d4ed8',
    alignSelf: 'flex-start',
  }),
  actVacio: { color: 'var(--color-texto-suave)', fontSize: '14px' },
  actBotones: { display: 'flex', gap: '8px', marginTop: '8px' },
  actBtnVer: {
    flex: 1, padding: '8px 0', borderRadius: '7px', border: '1px solid var(--color-primario)',
    background: 'transparent', color: 'var(--color-primario)', fontSize: '13px', fontWeight: '600',
    cursor: 'pointer',
  },
  actBtnInscribir: {
    flex: 1, padding: '8px 0', borderRadius: '7px', border: 'none',
    background: 'var(--color-primario)', color: '#fff', fontSize: '13px', fontWeight: '600',
    cursor: 'pointer',
  },
  actBtnYaInscripto: {
    flex: 1, padding: '8px 0', borderRadius: '7px', border: '1px solid #86efac',
    background: '#f0fdf4', color: '#15803d', fontSize: '13px', fontWeight: '600',
    cursor: 'default',
  },
  actModalBtnYaInscripto: {
    flex: 1, padding: '11px 0', borderRadius: '8px', border: '1px solid #86efac',
    background: '#f0fdf4', color: '#15803d', fontWeight: '600', fontSize: '14px', cursor: 'default',
  },
  /* Modal detalle actividad */
  actModalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
  },
  actModal: {
    background: '#fff', borderRadius: '14px', padding: '28px 28px 24px',
    maxWidth: '480px', width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  actModalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' },
  actModalTitulo: { fontSize: '18px', fontWeight: '800', color: 'var(--color-texto)', margin: 0 },
  actModalClose: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px',
    color: 'var(--color-texto-suave)', lineHeight: 1, padding: '0 4px',
  },
  actModalRow: { display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--color-texto)' },
  actModalLabel: { fontWeight: '600', minWidth: '110px', color: 'var(--color-texto-suave)', fontSize: '13px' },
  actModalDivider: { height: '1px', background: 'var(--color-borde)', margin: '8px 0' },
  actModalActions: { display: 'flex', gap: '10px', marginTop: '12px' },
  actModalBtnInscribir: {
    flex: 1, padding: '11px 0', borderRadius: '8px', border: 'none',
    background: 'var(--color-primario)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
  actModalBtnCerrar: {
    flex: 1, padding: '11px 0', borderRadius: '8px', border: '1px solid var(--color-borde)',
    background: '#fff', color: 'var(--color-texto)', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
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

function parseHoraMinutos(valor) {
  if (!valor) return null;
  const match = String(valor).match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function actividadSigueVigente(actividad) {
  if (actividad.activity_type !== 'individual') return true;
  if (!actividad.specific_date) return true;
  const fechaActividad = new Date(`${actividad.specific_date}T00:00:00`);
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const minutosActividad = parseHoraMinutos(actividad.time_slot);
  const minutosAhora = hoy.getHours() * 60 + hoy.getMinutes();
  if (fechaActividad < inicioHoy) return false;
  if (fechaActividad > inicioHoy) return true;
  if (minutosActividad === null) return true;
  return minutosActividad >= minutosAhora;
}

function InicioPublico() {
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [confirmarVisible, setConfirmarVisible] = useState(false);
  const [actividades, setActividades] = useState([]);
  const [actividadesFiltradas, setActividadesFiltradas] = useState([]);
  const [actividadDetalle, setActividadDetalle] = useState(null);
  const [actividadesInscritas, setActividadesInscritas] = useState(new Set());
  const [cuposMap, setCuposMap] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const token   = getToken();
  const role    = getRole();   // 'admin' | 'client' | 'professor' | 'receptionist' | null
  const nombre  = getUserName();
  const inicial = nombre ? nombre[0].toUpperCase() : '?';

  const estaLogueado = !!token;
  const esAdmin      = role === 'admin';
  const puedeVerNotificaciones = role === 'client' || role === 'professor';
  const tieneSidebar = estaLogueado && role !== 'client';
  const itemsSidebar = esAdmin ? MENU_ADMIN : (MENUS_ROL[role] || []);

  // Cargar actividades activas al montar
  useEffect(() => {
    getActivities({ status: 'active' })
      .then((data) => setActividades((Array.isArray(data) ? data : []).filter(actividadSigueVigente)))
      .catch(() => {});
  }, []);

  // Cargar cupos disponibles en tiempo real para cada actividad
  useEffect(() => {
    if (actividades.length === 0) return;
    Promise.allSettled(actividades.map((a) => getActivityAvailability(a.id)))
      .then((results) => {
        const mapa = {};
        results.forEach((res, i) => {
          if (res.status === 'fulfilled') {
            mapa[actividades[i].id] = res.value.available_spots;
          }
        });
        setCuposMap(mapa);
      })
      .catch(() => {});
  }, [actividades]);

  // Cargar inscripciones activas del cliente para deshabilitar botones
  useEffect(() => {
    if (role !== 'client') return;
    getMyReservations()
      .then((data) => {
        const ids = new Set(
          (Array.isArray(data) ? data : [])
            .filter((r) => r.status !== 'cancelled')
            .map((r) => r.activity_id)
        );
        setActividadesInscritas(ids);
      })
      .catch(() => {});
  }, [role]);

  useEffect(() => {
    if (!estaLogueado || !puedeVerNotificaciones) {
      setNotifications([]);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get('/notifications');
        if (!mounted) return;
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } catch (_) {
        setNotifications([]);
      }
    })();

    return () => { mounted = false; };
  }, [estaLogueado, puedeVerNotificaciones]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
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

  const handleInscribirse = (act) => {
    if (!estaLogueado) { navigate('/login'); return; }
    navigate('/cliente/reservas/inscribir', { state: { actividadId: act.id } });
  };

  const handleVerActividad = async (actividad) => {
    try {
      const [detalle, disponibilidad] = await Promise.all([
        getActivityById(actividad.id),
        getActivityAvailability(actividad.id),
      ]);
      setActividadDetalle({ ...detalle, ...disponibilidad });
    } catch {
      setActividadDetalle(actividad);
    }
  };

  const pedirConfirmacion = () => {
    setMenuAbierto(false);
    setConfirmarVisible(true);
  };

  const opcionesMenu = MENUS_ROL[role] || [];
  const noLeidas = notifications.filter((n) => !n.read).length;

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
              {role === 'client'       && <Link to="/cliente/reservas/inscribir"    style={s.cardLink}>Ver actividades →</Link>}
              {role === 'professor'    && <Link to="/profesor/actividades"     style={s.cardLink}>Mis actividades →</Link>}
              {role === 'receptionist' && <Link to="/recepcionista/actividades" style={s.cardLink}>Ver actividades →</Link>}
              {role === 'admin'        && <Link to="/admin/usuarios"            style={s.cardLink}>Gestión de usuarios →</Link>}
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
        <h2 style={s.seccionTitulo}>Salas Disponibles</h2>

        <FiltroActividades actividades={actividades} cuposMap={cuposMap} onChange={setActividadesFiltradas} />

        {actividadesFiltradas.length === 0 ? (
          <p style={s.actVacio}>
            {actividades.length === 0
              ? 'No hay actividades disponibles en este momento.'
              : 'No hay actividades que coincidan con los filtros.'}
          </p>
        ) : (
          <div style={s.gridActividades}>
            {actividadesFiltradas.map((a) => (
              <div key={a.id} style={s.actCard}>
                <span style={s.actSala}>Sala {a.room_id}</span>
                <span style={s.actNombre}>{a.name}</span>
                <span style={s.actChip(a.activity_type)}>
                  {a.activity_type === 'individual' ? 'Individual' : 'Fija'}
                </span>
                {a.specialization && <span style={s.actHorario}>🏥 {a.specialization}</span>}
                {a.specific_date && (
                  <span style={s.actHorario}>
                    📅 {(() => {
                      const fecha = new Date(a.specific_date + 'T00:00:00');
                      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                      const dia = dias[fecha.getDay()];
                      const dia_num = fecha.getDate().toString().padStart(2, '0');
                      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
                      const anio = fecha.getFullYear();
                      return `${dia} ·  ${dia_num}/${mes}/${anio}`;
                    })()}
                  </span>
                )}
                {a.time_slot && <span style={s.actHorario}>🕐 {a.time_slot}</span>}
                {a.professor && <span style={s.actProfesor}>👤 {a.professor}</span>}
                <span style={s.actHorario}>🪑 {cuposMap[a.id] !== undefined ? cuposMap[a.id] : a.capacity} cupos disponibles</span>
                <span style={s.actPrecio}>${Number(a.price).toLocaleString('es-AR')}</span>
                <div style={s.actBotones}>
                  <button style={s.actBtnVer} onClick={() => handleVerActividad(a)}>Ver</button>
                  {(role === 'client' || !estaLogueado) && (
                    actividadesInscritas.has(a.id)
                      ? <span style={s.actBtnYaInscripto}>Ya inscripto</span>
                      : <button style={s.actBtnInscribir} onClick={() => handleInscribirse(a)}>Inscribirse</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
            <>
              {puedeVerNotificaciones && (
                <div style={s.notifWrapper} ref={notifRef}>
                  <button
                    aria-label="Notificaciones"
                    style={s.notifButton}
                    onClick={() => setNotifOpen((v) => !v)}
                  >
                    <span role="img" aria-hidden>🔔</span>
                    {noLeidas > 0 && <span style={s.notifBadge}>{noLeidas}</span>}
                  </button>

                  {notifOpen && (
                    <div style={s.notifPanel}>
                      {notifications.length === 0 && (
                        <div style={s.notifItem}>No hay notificaciones.</div>
                      )}
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{ ...s.notifItem, background: n.read ? 'transparent' : 'rgba(0,0,0,0.03)' }}
                          onClick={async () => {
                            setNotifications((prev) => prev.map((p) => (p.id === n.id ? { ...p, read: true } : p)));
                            try { await apiClient.post(`/notifications/${n.id}/read`); } catch (_) {}
                          }}
                        >
                          <div style={{ fontWeight: n.read ? 500 : 700 }}>{n.title || 'Notificación'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-texto-suave)' }}>{n.body || n.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
            </>
          )}
        </div>
      </header>

      {/* ── Layout: roles con sidebar (admin/profesor/recepcionista) vs sin sidebar ── */}
      {tieneSidebar ? (
        <div style={s.adminWrapper}>
          <aside style={s.adminSidebar}>
            <nav style={s.adminNav}>
              {itemsSidebar.map(item => (
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

      {/* Modal detalle de actividad */}
      {actividadDetalle && (
        <div style={s.actModalOverlay} onClick={() => setActividadDetalle(null)}>
          <div style={s.actModal} onClick={(e) => e.stopPropagation()}>
            <div style={s.actModalHeader}>
              <h3 style={s.actModalTitulo}>{actividadDetalle.name}</h3>
              <button style={s.actModalClose} onClick={() => setActividadDetalle(null)}>✕</button>
            </div>

            <span style={s.actChip(actividadDetalle.activity_type)}>
              {actividadDetalle.activity_type === 'individual' ? 'Individual' : 'Clase fija'}
            </span>

            <div style={s.actModalDivider} />

            <div style={s.actModalRow}>
              <span style={s.actModalLabel}>Sala</span>
              <span>Sala {actividadDetalle.room_id}</span>
            </div>
            <div style={s.actModalRow}>
              <span style={s.actModalLabel}>Especialidad</span>
              <span>{actividadDetalle.specialization}</span>
            </div>
            {actividadDetalle.specific_date && (
              <div style={s.actModalRow}>
                <span style={s.actModalLabel}>Fecha</span>
                <span>
                  {(() => {
                    const fecha = new Date(actividadDetalle.specific_date + 'T00:00:00');
                    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const dia = dias[fecha.getDay()];
                    const dia_num = fecha.getDate().toString().padStart(2, '0');
                    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
                    const anio = fecha.getFullYear();
                    return `${dia} · ${dia_num}/${mes}/${anio}`;
                  })()}
                </span>
              </div>
            )}
            {actividadDetalle.time_slot && (
              <div style={s.actModalRow}>
                <span style={s.actModalLabel}>Horario</span>
                <span>{actividadDetalle.time_slot}</span>
              </div>
            )}
            {actividadDetalle.professor && (
              <div style={s.actModalRow}>
                <span style={s.actModalLabel}>Profesor</span>
                <span>{actividadDetalle.professor}</span>
              </div>
            )}
            <div style={s.actModalRow}>
              <span style={s.actModalLabel}>Precio</span>
              <span>${Number(actividadDetalle.price).toLocaleString('es-AR')}</span>
            </div>
            <div style={s.actModalRow}>
              <span style={s.actModalLabel}>Cupos disponibles</span>
              <span>{actividadDetalle.available_spots ?? actividadDetalle.capacity} / {actividadDetalle.capacity}</span>
            </div>
            {actividadDetalle.description && (
              <div style={s.actModalRow}>
                <span style={s.actModalLabel}>Descripción</span>
                <span>{actividadDetalle.description}</span>
              </div>
            )}
            {actividadDetalle.requirements && (
              <div style={s.actModalRow}>
                <span style={s.actModalLabel}>Requisitos</span>
                <span>{actividadDetalle.requirements}</span>
              </div>
            )}

            <div style={s.actModalDivider} />

            <div style={s.actModalActions}>
              <button style={s.actModalBtnCerrar} onClick={() => setActividadDetalle(null)}>Cerrar</button>
              {(role === 'client' || !estaLogueado) && (
                actividadesInscritas.has(actividadDetalle?.id)
                  ? <span style={s.actModalBtnYaInscripto}>Ya inscripto</span>
                  : <button style={s.actModalBtnInscribir} onClick={() => { setActividadDetalle(null); handleInscribirse(actividadDetalle); }}>
                      Inscribirse
                    </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default InicioPublico;