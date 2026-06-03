import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getActivities, cancelActivity, getActivityAvailability } from '../../../services/activitiesService';
import { getRole } from '../../../services/authService';

const TIPO_LABEL = { fixed: 'Fija', individual: 'Individual' };

const CHIP_TIPO = {
  fixed:      { background: '#dbeafe', color: '#1d4ed8' },
  individual: { background: '#f3e8ff', color: '#7e22ce' },
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
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    background: '#fff', borderRadius: '12px', padding: '20px', maxWidth: '420px', width: '100%',
    boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
  },
  modalTitulo: { fontSize: '16px', fontWeight: '700', marginBottom: '8px' },
  modalTexto: { fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '12px' },
  modalBotones: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  modalCancelar: { padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', cursor: 'pointer' },
  modalConfirmar: { padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'var(--color-primario)', color: '#fff', cursor: 'pointer' },
};

function formatearHorario(actividad) {
  if (actividad.specific_date && actividad.time_slot) {
    const fecha = new Date(`${actividad.specific_date}T00:00:00`);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dia = dias[fecha.getDay()];
    return `${dia} · ${actividad.specific_date} · ${actividad.time_slot}`;
  }
  if (actividad.specific_date) return actividad.specific_date;
  if (actividad.time_slot) return actividad.time_slot;
  return actividad.schedule || '—';
}

function formatearProfesor(actividad) {
  return actividad.professor || <span style={{ color: 'var(--color-texto-suave)' }}>Sin profesor asignado</span>;
}

function ListaActividades() {
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [cuposDisponibles, setCuposDisponibles] = useState({});
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, name }
  const rol = getRole();
  const basePath = rol === 'admin' ? '/admin/actividades' : '/recepcionista/actividades';

  const cargar = () => {
    setCargando(true);
    setError('');
    getActivities({ status: 'active' })
      .then(async (data) => {
        const lista = (Array.isArray(data) ? data : []).filter(actividadSigueVigente);
        setActividades(lista);
        const results = await Promise.allSettled(lista.map((a) => getActivityAvailability(a.id)));
        const mapa = {};
        results.forEach((res, i) => {
          if (res.status === 'fulfilled') mapa[lista[i].id] = res.value.available_spots;
        });
        setCuposDisponibles(mapa);
      })
      .catch(() => setError('No se pudieron cargar las actividades.'))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const requestCancelar = (id, nombre) => {
    setConfirmTarget({ id, name: nombre });
    setConfirmVisible(true);
  };

  const confirmarCancelacion = async () => {
    if (!confirmTarget) return;
    setError('');
    try {
      await cancelActivity(confirmTarget.id);
      setConfirmVisible(false);
      setConfirmTarget(null);
      cargar();
    } catch {
      setError('No se pudo cancelar la actividad.');
      setConfirmVisible(false);
      setConfirmTarget(null);
    }
  };

  const cancelarModal = () => {
    setConfirmVisible(false);
    setConfirmTarget(null);
  };

  return (
    <LayoutPrivado titulo="Actividades">
      <div style={s.cabecera}>
        <h2 style={s.titulo}>Actividades</h2>
        {rol === 'admin' && (
          <Link to={`${basePath}/crear`} style={s.botonCrear}>+ Nueva actividad</Link>
        )}
      </div>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.card}>
        {cargando ? (
          <div style={s.vacio}>Cargando…</div>
        ) : actividades.length === 0 ? (
          <div style={s.vacio}>No hay actividades activas. <Link to={`${basePath}/crear`} style={s.link}>Creá una</Link>.</div>
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
                    <Link to={`${basePath}/${a.id}`} style={s.link}>{a.name}</Link>
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
                  <td style={s.td}>{cuposDisponibles[a.id] !== undefined ? `${cuposDisponibles[a.id]} / ${a.capacity}` : a.capacity}</td>
                  <td style={s.td}>
                    <div style={s.accionesCell}>
                      <Link to={`${basePath}/${a.id}`} style={s.botonVer}>
                        Ver listado
                      </Link>
                      {rol === 'admin' && (
                        <>
                          <Link to={`${basePath}/editar/${a.id}`} style={s.botonEditar}>
                            Editar
                          </Link>
                          <button style={s.botonCancelar} onClick={() => requestCancelar(a.id, a.name)}>
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

      {confirmVisible && (
        <div style={s.overlay} onClick={cancelarModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitulo}>Confirmar cancelación</div>
            <div style={s.modalTexto}>{`¿Cancelar la actividad "${confirmTarget?.name}"?`}</div>
            <div style={s.modalBotones}>
              <button style={s.modalCancelar} onClick={cancelarModal}>Cancelar</button>
              <button style={s.modalConfirmar} onClick={confirmarCancelacion}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </LayoutPrivado>
  );
}

export default ListaActividades;
