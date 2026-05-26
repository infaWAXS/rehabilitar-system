// Responsable: Ezequiel
// HU: Registrar asistencia por DNI
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getActivityById } from '../../../services/activitiesService';
import { registerAttendanceByDni } from '../../../services/attendanceService';

const s = {
  contenedor: { maxWidth: '520px' },
  cabecera: { marginBottom: '28px' },
  titulo: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', margin: '0 0 6px' },
  subtitulo: { fontSize: '14px', color: 'var(--color-texto-suave)' },
  actividad: {
    background: 'var(--color-fondo-card)', borderRadius: '10px',
    padding: '14px 18px', marginBottom: '24px',
    borderLeft: '4px solid var(--color-primario)',
  },
  actividadNombre: { fontSize: '15px', fontWeight: '600', color: 'var(--color-texto)' },
  actividadDetalle: { fontSize: '13px', color: 'var(--color-texto-suave)', marginTop: '2px' },
  grupo: { marginBottom: '18px' },
  label: {
    display: 'block', fontSize: '13px', fontWeight: '600',
    color: 'var(--color-texto)', marginBottom: '6px',
  },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', fontSize: '14px',
    background: 'var(--color-fondo)', color: 'var(--color-texto)',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', fontSize: '14px',
    background: 'var(--color-fondo)', color: 'var(--color-texto)',
    boxSizing: 'border-box', resize: 'vertical', minHeight: '80px',
  },
  opcional: { fontSize: '12px', color: 'var(--color-texto-suave)', fontWeight: '400' },
  botones: { display: 'flex', gap: '10px', marginTop: '8px' },
  botonPrimario: {
    flex: 1, padding: '11px', borderRadius: '8px', border: 'none',
    background: 'var(--color-primario)', color: '#fff',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  botonSecundario: {
    padding: '11px 20px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', background: 'transparent',
    color: 'var(--color-texto)', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  alerta: (tipo) => ({
    padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px',
    background: tipo === 'error' ? '#fef2f2' : '#f0fdf4',
    border: `1px solid ${tipo === 'error' ? '#fecaca' : '#bbf7d0'}`,
    color: tipo === 'error' ? '#dc2626' : '#15803d',
  }),
  exito: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '32px', textAlign: 'center',
  },
  exitoIcono: { fontSize: '40px', marginBottom: '12px' },
  exitoTitulo: { fontSize: '17px', fontWeight: '700', color: '#15803d', marginBottom: '8px' },
  exitoTexto: { fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '20px' },
};

export default function RegistrarAsistencia() {
  const { id: actividadId } = useParams();
  const navigate = useNavigate();

  const [actividad, setActividad] = useState(null);
  const [cargandoAct, setCargandoAct] = useState(true);

  const [dni, setDni] = useState('');
  const [comment, setComment] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [registrado, setRegistrado] = useState(null); // objeto asistencia

  useEffect(() => {
    getActivityById(actividadId)
      .then(setActividad)
      .catch(() => setError('No se pudo cargar la actividad.'))
      .finally(() => setCargandoAct(false));
  }, [actividadId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!dni.trim()) return;

    setEnviando(true);
    setError('');
    try {
      const resultado = await registerAttendanceByDni({
        dni: dni.trim(),
        activity_id: Number(actividadId),
        comment: comment.trim() || null,
      });
      setRegistrado(resultado);
      setDni('');
      setComment('');
    } catch (e) {
      setError(e?.message || 'No se pudo registrar la asistencia.');
    } finally {
      setEnviando(false);
    }
  }

  function registrarOtro() {
    setRegistrado(null);
    setError('');
  }

  return (
    <LayoutPrivado>
      <div style={s.contenedor}>
        <div style={s.cabecera}>
          <h1 style={s.titulo}>Registrar Asistencia</h1>
          <p style={s.subtitulo}>Ingresá el DNI del cliente para registrar su presencia.</p>
        </div>

        {/* Actividad en contexto */}
        {cargandoAct ? (
          <div style={s.actividad}><span style={s.actividadNombre}>Cargando actividad...</span></div>
        ) : actividad ? (
          <div style={s.actividad}>
            <div style={s.actividadNombre}>{actividad.name}</div>
            <div style={s.actividadDetalle}>
              {actividad.activity_type === 'fixed' ? 'Fija' : 'Individual'}
              {actividad.schedule ? ` · ${actividad.schedule}` : ''}
              {actividad.specialization ? ` · ${actividad.specialization}` : ''}
            </div>
          </div>
        ) : null}

        {error && <div style={s.alerta('error')}>{error}</div>}

        {/* Formulario o confirmación de éxito */}
        {registrado ? (
          <div style={s.exito}>
            <div style={s.exitoIcono}>✅</div>
            <div style={s.exitoTitulo}>Asistencia registrada</div>
            <div style={s.exitoTexto}>
              La asistencia fue registrada correctamente.
              {registrado.comment && (
                <><br />Comentario: <em>"{registrado.comment}"</em></>
              )}
            </div>
            <div style={s.botones}>
              <button style={s.botonSecundario} onClick={() => navigate('/profesor/actividades')}>
                Volver a Actividades
              </button>
              <button style={s.botonPrimario} onClick={registrarOtro}>
                Registrar otro
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={s.grupo}>
              <label style={s.label} htmlFor="dni">DNI del cliente</label>
              <input
                id="dni"
                style={s.input}
                type="text"
                placeholder="Ej: 12345678"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                disabled={enviando}
                autoFocus
                required
              />
            </div>

            <div style={s.grupo}>
              <label style={s.label} htmlFor="comment">
                Comentario <span style={s.opcional}>(opcional)</span>
              </label>
              <textarea
                id="comment"
                style={s.textarea}
                placeholder="Ej: Buen desempeño"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={enviando}
              />
            </div>

            <div style={s.botones}>
              <button
                type="button"
                style={s.botonSecundario}
                onClick={() => navigate('/profesor/actividades')}
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{ ...s.botonPrimario, opacity: enviando ? 0.7 : 1 }}
                disabled={enviando || !dni.trim()}
              >
                {enviando ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </LayoutPrivado>
  );
}
