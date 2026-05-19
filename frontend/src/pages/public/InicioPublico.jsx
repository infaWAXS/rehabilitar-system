import React from 'react';
import { Link } from 'react-router-dom';

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
  },
  brandAr: {
    color: 'var(--color-secundario)',
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
  },
  btnSolid: {
    border: 'none',
    color: '#fff',
    background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
    borderRadius: '8px',
    padding: '10px 15px',
    fontSize: '14px',
    fontWeight: '700',
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
};

function InicioPublico() {
  return (
    <div style={s.pagina}>
      <header style={s.topbar}>
        <div style={s.brand}>
          Rehabilit<span style={s.brandAr}>AR</span>
        </div>
        <div style={s.topActions}>
          <Link to="/login" style={s.btnGhost}>Ingresar</Link>
          <Link to="/registro" style={s.btnSolid}>Registrarse</Link>
        </div>
      </header>

      <section style={s.hero}>
        <div>
          <h1 style={s.heroTitle}>Centro de Kinesiologia con seguimiento inteligente</h1>
          <p style={s.heroText}>
            Espacio publico para novedades, actividades y noticias del centro. Todos los usuarios ven esta portada.
            Los empleados, al iniciar sesion, acceden a funciones extra segun su rol.
          </p>
          <div style={s.pillRow}>
            <span style={s.pill}>Rehabilitacion</span>
            <span style={s.pill}>Reserva de turnos</span>
            <span style={s.pill}>Asistencia</span>
            <span style={s.pill}>Kinesiologia deportiva</span>
          </div>
        </div>

        <div style={s.heroCard}>
          <div style={s.cardTitle}>Accesos rapidos</div>
          <p style={s.cardText}>Entradas de demo para probar el flujo del Sprint 1.</p>
          <Link to="/cliente/actividades" style={s.cardLink}>Ver actividades como cliente</Link>
          <Link to="/admin/usuarios" style={s.cardLink}>Gestion de usuarios (admin)</Link>
          <Link to="/kinesiologo/asistencias" style={s.cardLink}>Asistencias (kinesiologo)</Link>
        </div>
      </section>

      <section style={s.seccion}>
        <h2 style={s.seccionTitulo}>Novedades del centro</h2>
        <div style={s.gridNoticias}>
          <article style={s.noticia}>
            <span style={s.noticiaTag}>CLASES</span>
            <h3 style={s.noticiaTitulo}>Nuevos horarios de rehabilitacion funcional</h3>
            <p style={s.noticiaTexto}>Ya se encuentran disponibles los nuevos turnos de la tarde para actividades guiadas.</p>
          </article>
          <article style={s.noticia}>
            <span style={s.noticiaTag}>PAGOS</span>
            <h3 style={s.noticiaTitulo}>Suscripciones mensuales con Mercado Pago</h3>
            <p style={s.noticiaTexto}>Los clientes pueden consultar y pagar su plan desde la seccion de suscripciones.</p>
          </article>
          <article style={s.noticia}>
            <span style={s.noticiaTag}>ASISTENCIAS</span>
            <h3 style={s.noticiaTitulo}>Registro por DNI simplificado</h3>
            <p style={s.noticiaTexto}>El personal puede registrar asistencia en segundos con validacion de identidad.</p>
          </article>
        </div>
      </section>

      <footer style={s.footer}>RehabilitAR - Plataforma de gestion para centro de kinesiologia</footer>
    </div>
  );
}

export default InicioPublico;
