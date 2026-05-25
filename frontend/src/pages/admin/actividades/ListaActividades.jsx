import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getActivities, cancelActivity } from '../../../services/activitiesService';
import { getRole } from '../../../services/authService';

const TIPO_LABEL = { fixed: 'Fija', individual: 'Individual' };

const CHIP_TIPO = {
  fixed:      { background: '#dbeafe', color: '#1d4ed8' },
  individual: { background: '#f3e8ff', color: '#7e22ce' },
};

const s = {
  cabecera: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  titulo: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', margin: 0 },
  botonCrear: {
    padding: '10px 20px', borderRadius: '8px', border: 'none',
    background: 'var(--color-primario)', color: '#fff',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none',
    display: 'inline-block',
  },
  card: { background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '0', boxShadow: 'var(--sombra)', overflowX: 'auto' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--color-texto-suave)', borderBottom: '1px solid var(--color-borde)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '12px 14px', borderBottom: '1px solid var(--color-borde)', color: 'var(--color-texto)' },
  chip: { display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' },
  vacio: { textAlign: 'center', padding: '48px', color: 'var(--color-texto-suave)', fontSize: '15px' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' },
  link: { color: 'var(--color-primario)', textDecoration: 'none', fontWeight: '600' },
  botonCancelar: {
    padding: '5px 12px', borderRadius: '6px', border: '1px solid #fca5a5',
    background: 'transparent', color: '#dc2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
  },
  botonEditar: {
    padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--color-borde)',
    background: 'transparent', color: 'var(--color-texto)', fontSize: '12px', fontWeight: '600',
    cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
  },
  botonVer: {
    padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--color-primario)',
    background: 'transparent', color: 'var(--color-primario)', fontSize: '12px', fontWeight: '600',
    textDecoration: 'none', display: 'inline-block',
  },
  accionesCell: { display: 'flex', gap: '6px', alignItems: 'center' },
};

function formatearHorario(actividad) {
  if (actividad.activity_type === 'individual') {
    if (actividad.specific_date && actividad.time_slot) {
      return `${actividad.specific_date} · ${actividad.time_slot}`;
    }
    if (actividad.specific_date) return actividad.specific_date;
    if (actividad.time_slot) return actividad.time_slot;
    return '—';
  }

  return actividad.schedule || '—';
}

function formatearProfesor(actividad) {
  return actividad.professor || <span style={{ color: 'var(--color-texto-suave)' }}>Sin profesor asignado</span>;
}

function ListaActividades() {
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const rol = getRole();

  const cargar = () => {
    setCargando(true);
    setError('');
    getActivities({ status: 'active' })
      .then((data) => setActividades(Array.isArray(data) ? data : []))
      .catch(() => setError('No se pudieron cargar las actividades.'))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const handleCancelar = async (id, nombre) => {
    if (!window.confirm(`¿Cancelar la actividad "${nombre}"?`)) return;
    try {
      await cancelActivity(id);
      cargar();
    } catch {
      setError('No se pudo cancelar la actividad.');
    }
  };

  return (
    <LayoutPrivado titulo="Actividades">
      <div style={s.cabecera}>
        <h2 style={s.titulo}>Actividades</h2>
        {rol === 'admin' && (
          <Link to="/admin/actividades/crear" style={s.botonCrear}>+ Nueva actividad</Link>
        )}
      </div>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.card}>
        {cargando ? (
          <div style={s.vacio}>Cargando…</div>
        ) : actividades.length === 0 ? (
          <div style={s.vacio}>No hay actividades activas. <Link to="/admin/actividades/crear" style={s.link}>Creá una</Link>.</div>
        ) : (
          <table style={s.tabla}>
            <thead>
              <tr>
                <th style={s.th}>Nombre</th>
                <th style={s.th}>Sala</th>
                <th style={s.th}>Tipo</th>
                <th style={s.th}>Horario</th>
                <th style={s.th}>Profesor</th>
                <th style={s.th}>Precio</th>
                <th style={s.th}>Cupos</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {actividades.map((a) => (
                <tr key={a.id}>
                  <td style={s.td}>
                    <Link to={`/admin/actividades/${a.id}`} style={s.link}>{a.name}</Link>
                  </td>
                  <td style={s.td}>Sala {a.room_id}</td>
                  <td style={s.td}>
                    <span style={{ ...s.chip, ...(CHIP_TIPO[a.activity_type] ?? {}) }}>
                      {TIPO_LABEL[a.activity_type] ?? a.activity_type}
                    </span>
                  </td>
                  <td style={s.td}>{formatearHorario(a)}</td>
                  <td style={s.td}>{formatearProfesor(a)}</td>
                  <td style={s.td}>${Number(a.price).toLocaleString('es-AR')}</td>
                  <td style={s.td}>{a.capacity}</td>
                  <td style={s.td}>
                    <div style={s.accionesCell}>
                      <Link to={`/admin/actividades/${a.id}`} style={s.botonVer}>
                        Ver listado
                      </Link>
                      {rol === 'admin' && (
                        <>
                          <Link to={`/admin/actividades/editar/${a.id}`} style={s.botonEditar}>
                            Editar
                          </Link>
                          <button style={s.botonCancelar} onClick={() => handleCancelar(a.id, a.name)}>
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </LayoutPrivado>
  );
}

export default ListaActividades;
