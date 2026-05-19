import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStaff, getStaffSpecializations } from '../../services/usersService';

const LABELS_ROL = {
  professor:    'Profesor',
  receptionist: 'Recepcionista',
};

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
  },
  brandAr: { color: 'var(--color-secundario)' },
  topNav: { display: 'flex', gap: '8px', alignItems: 'center' },
  navLink: {
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-texto)',
    textDecoration: 'none',
    background: 'var(--color-primario-suave, #e8f5f5)',
  },
  topActions: { display: 'flex', gap: '10px', alignItems: 'center' },
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
  contenido: { maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' },
  titulo: { fontSize: '32px', fontWeight: '800', marginBottom: '8px' },
  subtitulo: {
    fontSize: '15px',
    color: 'var(--color-texto-suave)',
    marginBottom: '32px',
  },
  filtrosRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '28px',
    alignItems: 'flex-end',
  },
  grupo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-texto-suave)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    padding: '9px 13px',
    borderRadius: '8px',
    border: '1px solid var(--color-borde)',
    fontSize: '14px',
    background: '#fff',
    minWidth: '220px',
  },
  select: {
    padding: '9px 13px',
    borderRadius: '8px',
    border: '1px solid var(--color-borde)',
    fontSize: '14px',
    background: '#fff',
    minWidth: '220px',
    cursor: 'pointer',
  },
  btnBuscar: {
    padding: '9px 20px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
    color: '#fff',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    alignSelf: 'flex-end',
  },
  btnLimpiar: {
    padding: '9px 16px',
    borderRadius: '8px',
    border: '1px solid var(--color-borde)',
    background: '#fff',
    color: 'var(--color-texto)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    alignSelf: 'flex-end',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px',
  },
  card: {
    background: '#fff',
    border: '1px solid var(--color-borde)',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-primario), var(--color-secundario))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  nombre: { fontSize: '16px', fontWeight: '700', color: 'var(--color-texto)' },
  rolPill: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 9px',
    borderRadius: '999px',
    background: 'var(--color-primario-suave)',
    color: 'var(--color-primario-oscuro)',
  },
  especializacion: {
    fontSize: '13px',
    color: 'var(--color-texto-suave)',
  },
  vacio: {
    textAlign: 'center',
    padding: '48px 24px',
    color: 'var(--color-texto-suave)',
    fontSize: '15px',
  },
  vacioTitulo: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '8px',
    color: 'var(--color-texto)',
  },
  cargando: {
    textAlign: 'center',
    padding: '48px',
    color: 'var(--color-texto-suave)',
  },
  footer: {
    borderTop: '1px solid var(--color-borde)',
    textAlign: 'center',
    padding: '18px 24px 30px',
    color: 'var(--color-texto-suave)',
    fontSize: '13px',
    marginTop: '48px',
  },
};

function Staff() {
  const [busqueda, setBusqueda] = useState('');
  const [especializacion, setEspecializacion] = useState('');
  const [especializaciones, setEspecializaciones] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscado, setBuscado] = useState(false);

  // Cargar staff completo y especializaciones al montar
  useEffect(() => {
    Promise.all([
      getStaff(),
      getStaffSpecializations(),
    ]).then(([staff, specs]) => {
      setEmpleados(staff || []);
      setEspecializaciones(specs || []);
    }).catch(() => {
      setEmpleados([]);
    }).finally(() => setCargando(false));
  }, []);

  const aplicar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setBuscado(true);
    try {
      const data = await getStaff(busqueda, especializacion);
      setEmpleados(data || []);
    } catch {
      setEmpleados([]);
    } finally {
      setCargando(false);
    }
  };

  const limpiar = async () => {
    setBusqueda('');
    setEspecializacion('');
    setBuscado(false);
    setCargando(true);
    try {
      const data = await getStaff();
      setEmpleados(data || []);
    } catch {
      setEmpleados([]);
    } finally {
      setCargando(false);
    }
  };

  const hayFiltros = busqueda.trim() || especializacion;

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
          <Link to="/login" style={s.btnGhost}>Ingresar</Link>
        </div>
      </header>

      {/* Contenido */}
      <main style={s.contenido}>
        <h1 style={s.titulo}>Nuestro Staff</h1>
        <p style={s.subtitulo}>
          Conocé a los profesionales del centro: profesores y recepcionistas.
        </p>

        {/* Filtros */}
        <form onSubmit={aplicar} style={s.filtrosRow}>
          <div style={s.grupo}>
            <label style={s.label}>Buscar por nombre</label>
            <input
              style={s.input}
              type="text"
              placeholder="Ej.: Carlos"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div style={s.grupo}>
            <label style={s.label}>Especialización</label>
            <select
              style={s.select}
              value={especializacion}
              onChange={(e) => setEspecializacion(e.target.value)}
            >
              <option value="">Todas</option>
              {especializaciones.map((esp) => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>

          <button type="submit" style={s.btnBuscar}>Buscar</button>

          {hayFiltros && (
            <button type="button" style={s.btnLimpiar} onClick={limpiar}>
              Limpiar filtros
            </button>
          )}
        </form>

        {/* Resultados */}
        {cargando ? (
          <div style={s.cargando}>Cargando...</div>
        ) : empleados.length === 0 ? (
          <div style={s.vacio}>
            <div style={s.vacioTitulo}>
              {buscado
                ? 'No se encontraron empleados con ese criterio.'
                : 'No hay empleados registrados todavía.'}
            </div>
            {buscado && (
              <button style={{ ...s.btnLimpiar, margin: '12px auto 0', display: 'inline-block' }} onClick={limpiar}>
                Ver todos
              </button>
            )}
          </div>
        ) : (
          <div style={s.grid}>
            {empleados.map((emp) => (
              <div key={emp.id} style={s.card}>
                <div style={s.avatar}>
                  {emp.name[0].toUpperCase()}
                </div>
                <div style={s.nombre}>{emp.name} {emp.lastname}</div>
                <span style={s.rolPill}>{LABELS_ROL[emp.role] || emp.role}</span>
                {emp.specialization && (
                  <div style={s.especializacion}>🎯 {emp.specialization}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={s.footer}>RehabilitAR — Plataforma de gestión para centro de kinesiología</footer>
    </div>
  );
}

export default Staff;
