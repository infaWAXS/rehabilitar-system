import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getActivities, resignActivity } from '../../../services/activitiesService';
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

  // Modal renunciar
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // Modal Sprint 2
  const [sprint2Modal, setSprint2Modal] = useState(false);

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
            <div>
              <div style={s.nombreAct}>{a.name}</div>
              <div style={s.detalle}>
                {a.activity_type === 'fixed' ? 'Fija' : 'Individual'}
              </div>
              {a.specialization && <div style={s.detalle}>{a.specialization}</div>}
              {a.specific_date ? (
                <div style={s.detalle}>
                  {(() => {
                    const fecha = new Date(`${a.specific_date}T00:00:00`);
                    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const dia = dias[fecha.getDay()];
                    const dia_num = fecha.getDate().toString().padStart(2, '0');
                    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
                    const anio = fecha.getFullYear();
                    const fechaStr = `${dia} ${dia_num}/${mes}/${anio}`;
                    return a.time_slot ? `${fechaStr} · ${a.time_slot}` : fechaStr;
                  })()}
                </div>
              ) : (
                a.schedule && <div style={s.detalle}>{a.schedule}</div>
              )}
            </div>
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
      <h2 style={s.seccionTitulo}>Actividades que podés asumir</h2> Pendiente para sprint 2 

      {!cargando && actividadesParaAsumir.length === 0 ? (
        <div style={s.vacio}>No hay actividades disponibles para tu especialidad.</div>
      ) : (
        actividadesParaAsumir.map((a) => (
          <div key={a.id} style={s.tarjeta}>
            <div>
              <div style={s.nombreAct}>{a.name}</div>
              <div style={s.detalle}>
                {a.activity_type === 'fixed' ? 'Fija' : 'Individual'} &middot; {a.schedule || a.time_slot}
              </div>
              <div style={s.detalle}>{a.specialization}</div>
            </div>
            <button
              style={s.botonAsumir}
              onClick={() => setSprint2Modal(true)}
            >
              Asumir
            </button>
          </div>
        ))
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