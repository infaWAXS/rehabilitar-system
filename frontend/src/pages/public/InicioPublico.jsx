// Responsable: Francis
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getToken, getRole, getUserName, clearUserData, logout } from '../../services/authService';
<<<<<<< HEAD
<<<<<<< HEAD
import { getActivities, getActivityById, getActivityAvailability } from '../../services/activitiesService';
import { getMyReservations } from '../../services/reservationsService';
=======
import { getActivities } from '../../services/activitiesService';
>>>>>>> 5836c8c (Agrego el filtro de actividades)
=======
import { getActivities, getActivityById, getActivityAvailability } from '../../services/activitiesService';
>>>>>>> 824a1f5 (Agrego la cantidad de cupos disponibles en Ver Actividades)
import FiltroActividades from './FiltroActividades';

/* ── Constantes ─────────────────────────────────────────── */
const MENUS_ROL = {
  client: [
    { label: 'Mis Reservas', ruta: '/cliente/reservas' },
    { label: 'Mi Cuenta',    ruta: '/cliente/cuenta' },
    { label: 'Mi Perfil',    ruta: '/perfil' },
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

const MENU_ADMIN = [
  { label: 'Usuarios',      ruta: '/admin/usuarios' },
  { label: 'Clientes',      ruta: '/admin/clientes' },
  { label: 'Aptos Físicos', ruta: '/admin/clientes/aptos-fisicos' },
  { label: 'Actividades',   ruta: '/admin/actividades' },
];

const NOTICIAS = [
  {
    tag: 'CLASES',
    titulo: 'Nuevos horarios de rehabilitación funcional',
    texto: 'Ya se encuentran disponibles los nuevos turnos de la tarde para actividades guiadas.',
  },
  {
    tag: 'PAGOS',
    titulo: 'Suscripciones mensuales con Mercado Pago',
    texto: 'Los clientes pueden consultar y pagar su plan desde la sección de suscripciones.',
  },
  {
    tag: 'ASISTENCIAS',
    titulo: 'Registro por DNI simplificado',
    texto: 'El personal puede registrar asistencia en segundos con validación de identidad.',
  },
];

/* ── Helpers ────────────────────────────────────────────── */
function formatFecha(fechaStr) {
  return new Date(fechaStr + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatFechaLarga(fechaStr) {
  return new Date(fechaStr + 'T00:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

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

/* ── Estilos ────────────────────────────────────────────── */
const s = {
  pagina: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #F0FBFB 0%, #FFFFFF 100%)',
    color: 'var(--color-texto)',
  },
  /* Topbar */
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
  },
  brandAr: {
    color: 'var(--color-secundario)',
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
  topActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
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
  /* User dropdown */
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
  dropdownWrapper: { position: 'relative' },
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
  adminNav: { flex: 1, padding: '8px 0' },
  adminNavItem: {
    display: 'block',
    padding: '12px 24px',
    color: 'rgba(255,255,255,0.75)',
    fontSize: '14px',
    textDecoration: 'none',
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
  adminContent: { flex: 1, overflowX: 'hidden' },
  /* Hero */
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
  pillRow: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
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
  cardTitle: { fontSize: '20px', fontWeight: '700', color: 'var(--color-texto)' },
  cardText: { color: 'var(--color-texto-suave)', fontSize: '14px' },
  cardLink: {
    marginTop: '8px',
    fontWeight: '700',
    color: 'var(--color-primario)',
    textDecoration: 'none',
    display: 'block',
  },
  /* Secciones */
  seccion: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '10px 24px 48px',
  },
  seccionTitulo: { fontSize: '26px', fontWeight: '800', marginBottom: '18px' },
  /* Noticias */
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
  noticiaTitulo: { fontWeight: '700', marginBottom: '6px', fontSize: '16px' },
  noticiaTexto: { color: 'var(--color-texto-suave)', fontSize: '14px', lineHeight: 1.5 },
  /* Cards actividades */
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
    flex: 1, padding: '8px 0', borderRadius: '7px',
    border: '1px solid var(--color-primario)', background: 'transparent',
    color: 'var(--color-primario)', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  actBtnInscribir: {
    flex: 1, padding: '8px 0', borderRadius: '7px', border: 'none',
    background: 'var(--color-primario)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
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
  actModalClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--color-texto-suave)', lineHeight: 1, padding: '0 4px' },
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
  /* Modal confirmar logout */
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    background: '#fff', borderRadius: '12px', padding: '28px 32px',
    maxWidth: '360px', width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
  },
  modalTitulo: { fontSize: '18px', fontWeight: '700', marginBottom: '10px', color: 'var(--color-texto)' },
  modalTexto: { fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '24px', lineHeight: 1.5 },
  modalBotones: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  modalCancelar: {
    padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    background: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '600', color: 'var(--color-texto)',
  },
  modalConfirmar: {
    padding: '9px 18px', borderRadius: '8px', border: 'none',
    background: '#dc2626', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '700',
  },
  footer: {
    borderTop: '1px solid var(--color-borde)',
    textAlign: 'center',
    padding: '18px 24px 30px',
    color: 'var(--color-texto-suave)',
    fontSize: '13px',
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
  const dropdownRef = useRef(null);

  const [menuAbierto,       setMenuAbierto]       = useState(false);
  const [confirmarVisible,  setConfirmarVisible]  = useState(false);
  const [actividades,       setActividades]       = useState([]);
  const [actividadesFiltradas, setActividadesFiltradas] = useState([]);
  const [actividadDetalle,  setActividadDetalle]  = useState(null);

  const token  = getToken();
  const role   = getRole();
  const nombre = getUserName();

  const estaLogueado = !!token;
  const esAdmin      = role === 'admin';
  const tieneSidebar = estaLogueado && role !== 'client';
  const itemsSidebar = esAdmin ? MENU_ADMIN : (MENUS_ROL[role] || []);
  const opcionesMenu = MENUS_ROL[role] || [];
  const inicial      = nombre ? nombre[0].toUpperCase() : '?';

  // Cargar actividades activas
  useEffect(() => {
    getActivities({ status: 'active' })
<<<<<<< HEAD
      .then((data) => setActividades((Array.isArray(data) ? data : []).filter(actividadSigueVigente)))
=======
      .then(data => {
        const lista = Array.isArray(data) ? data : [];
        setActividades(lista.filter(actividadSigueVigente));
      })
>>>>>>> f84c9d7 (Arreglo el filtro de actividades)
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

  /* ── Subcomponentes ───────────────────────────────────── */
  const CardActividad = ({ a }) => (
    <div style={s.actCard}>
      <span style={s.actSala}>Sala {a.room_id}</span>
      <span style={s.actNombre}>{a.name}</span>
      <span style={s.actChip(a.activity_type)}>
        {a.activity_type === 'individual' ? 'Individual' : 'Fija'}
      </span>
      {a.schedule    && <span style={s.actHorario}>📅 {a.schedule}</span>}
      {a.specific_date && (
        <span style={s.actHorario}>
          📅 {formatFecha(a.specific_date)}{a.time_slot && ` · ${a.time_slot}`}
        </span>
      )}
      {a.professor   && <span style={s.actProfesor}>👤 {a.professor}</span>}
      <span style={s.actPrecio}>${Number(a.price).toLocaleString('es-AR')}</span>
      <div style={s.actBotones}>
        <button style={s.actBtnVer}       onClick={() => handleVerActividad(a)}>Ver</button>
        <button style={s.actBtnInscribir} onClick={() => handleInscribirse(a)}>Inscribirse</button>
      </div>
    </div>
  );

  /* ── Contenido principal ──────────────────────────────── */
  const contenido = (
    <>
      {/* Hero */}
      <section style={s.hero}>
        <div>
          <h1 style={s.heroTitle}>Centro de Kinesiología con seguimiento inteligente</h1>
          <p style={s.heroText}>
            Espacio para novedades, actividades y noticias del centro.
            Los usuarios autenticados acceden a sus funciones según su rol.
          </p>
          <div style={s.pillRow}>
            {['Rehabilitación', 'Reserva de turnos', 'Asistencia', 'Kinesiología deportiva'].map(p => (
              <span key={p} style={s.pill}>{p}</span>
            ))}
          </div>
        </div>

        <div style={s.heroCard}>
          {!estaLogueado ? (
            <>
              <div style={s.cardTitle}>¡Bienvenido!</div>
              <p style={s.cardText}>Iniciá sesión o registrate para acceder a todas las funciones.</p>
              <Link to="/login"    style={s.cardLink}>Iniciar sesión →</Link>
              <Link to="/registro" style={s.cardLink}>Registrarse →</Link>
            </>
          ) : (
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

      {/* Noticias */}
      <section style={s.seccion}>
        <h2 style={s.seccionTitulo}>Novedades del centro</h2>
        <div style={s.gridNoticias}>
          {NOTICIAS.map(n => (
            <article key={n.tag} style={s.noticia}>
              <span style={s.noticiaTag}>{n.tag}</span>
              <h3 style={s.noticiaTitulo}>{n.titulo}</h3>
              <p style={s.noticiaTexto}>{n.texto}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Actividades */}
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

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div style={s.pagina}>

      {/* Topbar */}
      <header style={s.topbar}>
        <Link to="/" style={s.brand}>
          Rehabilit<span style={s.brandAr}>AR</span>
        </Link>

        <nav style={s.topNav}>
          <Link to="/staff" style={s.navLink}>Staff</Link>
        </nav>

        <div style={s.topActions}>
          {!estaLogueado ? (
            <>
              <Link to="/login"    style={s.btnGhost}>Ingresar</Link>
              <Link to="/registro" style={s.btnSolid}>Registrarse</Link>
            </>
          ) : (
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

      {/* Layout: con o sin sidebar */}
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
          <div style={s.adminContent}>{contenido}</div>
        </div>
      ) : (
        contenido
      )}

      {/* Modal: confirmar logout */}
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

      {/* Modal: detalle de actividad */}
      {actividadDetalle && (
        <div style={s.actModalOverlay} onClick={() => setActividadDetalle(null)}>
          <div style={s.actModal} onClick={e => e.stopPropagation()}>
            <div style={s.actModalHeader}>
              <h3 style={s.actModalTitulo}>{actividadDetalle.name}</h3>
              <button style={s.actModalClose} onClick={() => setActividadDetalle(null)}>✕</button>
            </div>

            <span style={s.actChip(actividadDetalle.activity_type)}>
              {actividadDetalle.activity_type === 'individual' ? 'Individual' : 'Clase fija'}
            </span>

            <div style={s.actModalDivider} />

<<<<<<< HEAD
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
=======
            {[
              ['Sala',        `Sala ${actividadDetalle.room_id}`],
              ['Especialidad', actividadDetalle.specialization],
              actividadDetalle.schedule     && ['Horario',     actividadDetalle.schedule],
              actividadDetalle.specific_date && ['Fecha',
                `${formatFechaLarga(actividadDetalle.specific_date)}${actividadDetalle.time_slot ? ` · ${actividadDetalle.time_slot}` : ''}`],
              actividadDetalle.professor    && ['Profesor',    actividadDetalle.professor],
              ['Precio',      `$${Number(actividadDetalle.price).toLocaleString('es-AR')}`],
              ['Cupos disponibles', actividadDetalle.available_spots ?? actividadDetalle.capacity],
              ['Cupos totales', actividadDetalle.capacity],
              actividadDetalle.description  && ['Descripción', actividadDetalle.description],
              actividadDetalle.requirements && ['Requisitos',  actividadDetalle.requirements],
            ].filter(Boolean).map(([label, valor]) => (
              <div key={label} style={s.actModalRow}>
                <span style={s.actModalLabel}>{label}</span>
                <span>{valor}</span>
>>>>>>> 824a1f5 (Agrego la cantidad de cupos disponibles en Ver Actividades)
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