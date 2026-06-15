import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getActivities, resignActivity, assumeActivity } from '../../../services/activitiesService';
import { getAttendanceSessionStatus } from '../../../services/attendanceService';
import { getCurrentUser } from '../../../services/usersService';

const s = {
  cabecera: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
  },
  titulo: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', margin: 0 },
  botonSugerir: {
    padding: '10px 20px', borderRadius: '8px', border: 'none',
    background: 'var(--color-primario)', color: '#fff',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  seccionTitulo: {
    fontSize: '18px', fontWeight: '600', color: 'var(--color-texto)',
    margin: '32px 0 16px',
  },
  tarjeta: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '16px 20px', boxShadow: 'var(--sombra)',
    marginBottom: '12px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', gap: '12px',
    flexWrap: 'wrap',
  },
  nombreAct: { fontSize: '15px', fontWeight: '600', color: 'var(--color-texto)' },
  detalle: { fontSize: '13px', color: 'var(--color-texto-suave)', marginTop: '2px' },
  estadoSesion: (activo) => ({
    display: 'inline-block',
    marginTop: '8px',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '700',
    background: activo ? '#dcfce7' : '#fee2e2',
    color: activo ? '#166534' : '#b91c1c',
    border: `1px solid ${activo ? '#86efac' : '#fecaca'}`,
  }),
  botonRenunciar: {
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    background: '#fee2e2', color: '#dc2626',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  botonAsistencia: {
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    background: 'var(--color-primario)', color: '#fff',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  botonAsumir: {
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    background: '#dcfce7', color: '#16a34a',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  vacio: {
    textAlign: 'center', padding: '32px',
    color: 'var(--color-texto-suave)', fontSize: '14px',
    background: 'var(--color-fondo-card)', borderRadius: '12px',
  },
  alerta: (tipo) => ({
    padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
    background: tipo === 'error' ? '#fef2f2' : '#f0fdf4',
    border: `1px solid ${tipo === 'error' ? '#fecaca' : '#bbf7d0'}`,
    color: tipo === 'error' ? '#dc2626' : '#15803d',
  }),
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '28px 32px', maxWidth: '440px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalTitulo: { fontSize: '17px', fontWeight: '700', marginBottom: '12px', color: 'var(--color-texto)' },
  modalTexto: { fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '20px' },
  modalBotones: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  botonSecundario: {
    padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-borde)',
    background: 'transparent', color: 'var(--color-texto)', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer',
  },
  botonPrimario: {
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    background: '#dc2626', color: '#fff', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer',
  },
};

export default function MisActividades() {
  const nombreProfesor = `${localStorage.getItem('user_name') || ''} ${localStorage.getItem('user_lastname') || ''}`.trim();
  const navigate = useNavigate();

  const [actividades, setActividades] = useState([]);
  const [actividadesParaAsumir, setActividadesParaAsumir] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [estadoSesiones, setEstadoSesiones] = useState({});

  // Modal renunciar
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // Modal Sprint 2
  const [sprint2Modal, setSprint2Modal] = useState(false);

  // Modal asumir
  const [assumeTarget, setAssumeTarget] = useState(null);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const [todasActs, meData] = await Promise.all([
          getActivities(),
          getCurrentUser(),
        ]);

        const especialidad = meData?.specialization || '';

        const misActs = todasActs.filter(
          (a) => a.status === 'active' && a.professor === nombreProfesor
        );

        const paraAsumir = todasActs.filter(
          (a) =>
            a.status === 'active' &&
            !a.professor &&
            especialidad &&
            a.specialization === especialidad
        );

        setActividades(misActs);
        setActividadesParaAsumir(paraAsumir);

        const actividadesParaEstado = [...misActs, ...paraAsumir];
        if (actividadesParaEstado.length > 0) {
          const estados = await Promise.all(
            actividadesParaEstado.map(async (act) => {
              try {
                const data = await getAttendanceSessionStatus(act.id);
                return [act.id, Boolean(data?.session_active)];
              } catch {
                return [act.id, false];
              }
            })
          );
          setEstadoSesiones(Object.fromEntries(estados));
        } else {
          setEstadoSesiones({});
        }
      } catch (e) {
        setError('No se pudieron cargar las actividades.');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [nombreProfesor]);

  async function confirmarRenuncia() {
    if (!confirmTarget) return;
    setProcesando(true);
    setError('');
    try {
      await resignActivity(confirmTarget.id);
      setActividades((prev) => prev.filter((a) => a.id !== confirmTarget.id));
      setExito(`Renunciaste a la actividad "${confirmTarget.nombre}" correctamente.`);
      setConfirmTarget(null);
    } catch (e) {
      setError(e?.message || 'No se pudo renunciar a la actividad.');
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarAsumir() {
    if (!assumeTarget) return;
    setProcesando(true);
    setError('');
    try {
      const activityActualizada = await assumeActivity(assumeTarget.id);
      setActividades((prev) => [...prev, activityActualizada]);
      setActividadesParaAsumir((prev) => prev.filter((a) => a.id !== assumeTarget.id));
      setExito(`Asumiste la actividad "${assumeTarget.nombre}" correctamente.`);
      setAssumeTarget(null);
    } catch (e) {
      setError(e?.message || 'No se pudo asumir la actividad.');
    } finally {
      setProcesando(false);
    }
  }

  function obtenerRangoHorario(activity) {
    const scheduleMatches = (activity.schedule || '').match(/(\d{1,2}:\d{2})/g);
    if (scheduleMatches && scheduleMatches.length >= 2) {
      return `${scheduleMatches[0]} - ${scheduleMatches[1]}`;
    }

    if (activity.time_slot) {
      const [hh, mm] = activity.time_slot.split(':').map(Number);
      if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
        const inicio = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        const fin = `${String((hh + 1) % 24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        return `${inicio} - ${fin}`;
      }
    }

    return 'Horario no definido';
  }

  function obtenerDiaYFecha(activity) {
    if (activity.specific_date) {
      const fecha = new Date(`${activity.specific_date}T00:00:00`);
      if (!Number.isNaN(fecha.getTime())) {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dia = dias[fecha.getDay()];
        const dia_num = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia} · ${dia_num}/${mes}/${anio}`;
      }
    }

    const diaTexto = (activity.schedule || '').split('·')[0]?.trim();
    if (diaTexto) {
      return `${diaTexto} · Fecha no definida`;
    }

    return 'Día no definido · Fecha no definida';
  }

  function renderInfoActividad(activity) {
    const enCurso = Boolean(estadoSesiones[activity.id]);
    return (
      <>
        <div style={s.nombreAct}>
          {activity.name} <span style={s.estadoSesion(enCurso)}>{enCurso ? 'En curso' : 'Fuera de curso'}</span>
        </div>
        <div style={s.detalle}>{activity.activity_type === 'fixed' ? 'Fija' : 'Individual'}</div>
        <div style={s.detalle}>{activity.specialization || 'No definida'}</div>
        <div style={s.detalle}>{obtenerDiaYFecha(activity)}</div>
        <div style={s.detalle}>{obtenerRangoHorario(activity)}</div>
      </>
    );
  }

  return (
    <LayoutPrivado>
      <div style={s.cabecera}>
        <h1 style={s.titulo}>Mis Actividades</h1>
        <button style={s.botonSugerir} onClick={() => setSprint2Modal(true)}>
          + Sugerir Actividad
        </button>
      </div>

      {error && <div style={s.alerta('error')}>{error}</div>}
      {exito && <div style={s.alerta('exito')}>{exito}</div>}

      {cargando ? (
        <div style={s.vacio}>Cargando actividades...</div>
      ) : actividades.length === 0 ? (
        <div style={s.vacio}>No tenés actividades asignadas actualmente.</div>
      ) : (
        actividades.map((a) => (
          <div key={a.id} style={s.tarjeta}>
            <div>{renderInfoActividad(a)}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                style={s.botonAsistencia}
                onClick={() => navigate(`/profesor/actividades/${a.id}/asistencias`)}
              >
                Registrar Asistencia
              </button>
              <button
                style={s.botonRenunciar}
                onClick={() => setConfirmTarget({ id: a.id, nombre: a.name })}
              >
                Renunciar
              </button>
            </div>
          </div>
        ))
      )}

      {/* Sección: Actividades que podés asumir */}
      <h2 style={s.seccionTitulo}>Actividades que podés asumir</h2>

      {!cargando && actividadesParaAsumir.length === 0 ? (
        <div style={s.vacio}>No hay actividades disponibles para tu especialidad.</div>
      ) : (
        actividadesParaAsumir.map((a) => (
          <div key={a.id} style={s.tarjeta}>
            <div>{renderInfoActividad(a)}</div>
            <button
              style={s.botonAsumir}
              onClick={() => setAssumeTarget({ id: a.id, nombre: a.name })}
            >
              Asumir
            </button>
          </div>
        ))
      )}

      {/* Modal: confirmar asumir */}
      {assumeTarget && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalTitulo}>Confirmar asignación</div>
            <div style={s.modalTexto}>
              ¿Querés asumir la actividad <strong>{assumeTarget.nombre}</strong>?
            </div>
            <div style={s.modalBotones}>
              <button
                style={s.botonSecundario}
                onClick={() => setAssumeTarget(null)}
                disabled={procesando}
              >
                Cancelar
              </button>
              <button
                style={{ ...s.botonPrimario, background: 'var(--color-primario)' }}
                onClick={confirmarAsumir}
                disabled={procesando}
              >
                {procesando ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar renuncia */}
      {confirmTarget && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalTitulo}>Confirmar renuncia</div>
            <div style={s.modalTexto}>
              ¿Estás seguro/a de que querés renunciar a la actividad{' '}
              <strong>{confirmTarget.nombre}</strong>?
            </div>
            <div style={s.modalBotones}>
              <button
                style={s.botonSecundario}
                onClick={() => setConfirmTarget(null)}
                disabled={procesando}
              >
                Cancelar
              </button>
              <button
                style={s.botonPrimario}
                onClick={confirmarRenuncia}
                disabled={procesando}
              >
                {procesando ? 'Procesando...' : 'Sí, renunciar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Sprint 2 */}
      {sprint2Modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalTitulo}>Funcionalidad en desarrollo</div>
            <div style={s.modalTexto}>
              Esta funcionalidad estará disponible en el Sprint 2.
            </div>
            <div style={s.modalBotones}>
              <button style={s.botonSecundario} onClick={() => setSprint2Modal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutPrivado>
  );
}