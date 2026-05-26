// Responsable: Ezequiel
// HU: Registrar asistencia por DNI Â· Dejar/Modificar/Eliminar comentario
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getActivityById } from '../../../services/activitiesService';
import {
  registerAttendanceByDni,
  getAttendancesByActivity,
  updateAttendanceComment,
  deleteAttendanceComment,
} from '../../../services/attendanceService';

const s = {
  contenedor: { maxWidth: '640px' },
  cabecera: { marginBottom: '24px' },
  titulo: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', margin: '0 0 6px' },
  subtitulo: { fontSize: '14px', color: 'var(--color-texto-suave)' },
  actividadBanner: {
    background: 'var(--color-fondo-card)', borderRadius: '10px',
    padding: '14px 18px', marginBottom: '28px',
    borderLeft: '4px solid var(--color-primario)',
  },
  actividadNombre: { fontSize: '15px', fontWeight: '600', color: 'var(--color-texto)' },
  actividadDetalle: { fontSize: '13px', color: 'var(--color-texto-suave)', marginTop: '2px' },
  seccionTitulo: {
    fontSize: '16px', fontWeight: '700', color: 'var(--color-texto)',
    margin: '0 0 16px', paddingBottom: '8px',
    borderBottom: '1px solid var(--color-borde)',
  },
  grupo: { marginBottom: '16px' },
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
    boxSizing: 'border-box', resize: 'vertical', minHeight: '72px',
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
    padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
    background: tipo === 'error' ? '#fef2f2' : '#f0fdf4',
    border: `1px solid ${tipo === 'error' ? '#fecaca' : '#bbf7d0'}`,
    color: tipo === 'error' ? '#dc2626' : '#15803d',
  }),
  divisor: { borderTop: '1px solid var(--color-borde)', margin: '32px 0 28px' },
  // Lista de asistencias
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', fontSize: '12px', fontWeight: '600',
    color: 'var(--color-texto-suave)', padding: '8px 10px',
    borderBottom: '1px solid var(--color-borde)', textTransform: 'uppercase',
  },
  td: {
    padding: '12px 10px', fontSize: '13px', color: 'var(--color-texto)',
    borderBottom: '1px solid var(--color-borde)', verticalAlign: 'middle',
  },
  tdSuave: {
    padding: '12px 10px', fontSize: '13px', color: 'var(--color-texto-suave)',
    borderBottom: '1px solid var(--color-borde)', verticalAlign: 'middle',
  },
  botonAccion: (color) => ({
    padding: '4px 10px', borderRadius: '6px', border: 'none',
    background: color === 'rojo' ? '#fee2e2' : color === 'verde' ? '#dcfce7' : '#eff6ff',
    color: color === 'rojo' ? '#dc2626' : color === 'verde' ? '#16a34a' : '#2563eb',
    fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginRight: '4px',
  }),
  inputInline: {
    padding: '6px 10px', borderRadius: '6px',
    border: '1px solid var(--color-borde)', fontSize: '13px',
    background: 'var(--color-fondo)', color: 'var(--color-texto)',
    width: '200px',
  },
  vacio: {
    textAlign: 'center', padding: '24px',
    color: 'var(--color-texto-suave)', fontSize: '13px',
    background: 'var(--color-fondo-card)', borderRadius: '10px',
  },
};

export default function RegistrarAsistencia() {
  const { id: actividadId } = useParams();
  const navigate = useNavigate();

  const [actividad, setActividad] = useState(null);
  const [cargandoAct, setCargandoAct] = useState(true);

  // Formulario registro
  const [dni, setDni] = useState('');
  const [comment, setComment] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [exitoForm, setExitoForm] = useState('');

  // Lista asistencias
  const [asistencias, setAsistencias] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState('');

  // EdiciÃ³n inline de comentario
  const [editandoId, setEditandoId] = useState(null);
  const [comentarioEdit, setComentarioEdit] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    getActivityById(actividadId)
      .then(setActividad)
      .catch(() => {})
      .finally(() => setCargandoAct(false));
  }, [actividadId]);

  const cargarAsistencias = useCallback(() => {
    setCargandoLista(true);
    setErrorLista('');
    getAttendancesByActivity(actividadId)
      .then(setAsistencias)
      .catch(() => setErrorLista('No se pudieron cargar las asistencias.'))
      .finally(() => setCargandoLista(false));
  }, [actividadId]);

  useEffect(() => { cargarAsistencias(); }, [cargarAsistencias]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!dni.trim()) return;
    setEnviando(true);
    setErrorForm('');
    setExitoForm('');
    try {
      await registerAttendanceByDni({
        dni: dni.trim(),
        activity_id: Number(actividadId),
        comment: comment.trim() || null,
      });
      setExitoForm(`Asistencia registrada correctamente.`);
      setDni('');
      setComment('');
      cargarAsistencias();
    } catch (e) {
      setErrorForm(e?.message || 'No se pudo registrar la asistencia.');
    } finally {
      setEnviando(false);
    }
  }

  function iniciarEdicion(asistencia) {
    setEditandoId(asistencia.id);
    setComentarioEdit(asistencia.comment || '');
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setComentarioEdit('');
  }

  async function guardarComentario(id) {
    if (!comentarioEdit.trim()) return;
    setGuardando(true);
    try {
      const actualizado = await updateAttendanceComment(id, comentarioEdit.trim());
      setAsistencias((prev) =>
        prev.map((a) => a.id === id ? { ...a, comment: actualizado.comment } : a)
      );
      setEditandoId(null);
    } catch (e) {
      setErrorLista(e?.message || 'No se pudo guardar el comentario.');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarComentario(id) {
    setGuardando(true);
    try {
      await deleteAttendanceComment(id);
      setAsistencias((prev) =>
        prev.map((a) => a.id === id ? { ...a, comment: null } : a)
      );
    } catch (e) {
      setErrorLista(e?.message || 'No se pudo eliminar el comentario.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <LayoutPrivado>
      <div style={s.contenedor}>
        <div style={s.cabecera}>
          <h1 style={s.titulo}>Asistencias</h1>
          <p style={s.subtitulo}>RegistrÃ¡ asistencias y gestionÃ¡ comentarios.</p>
        </div>

        {/* Banner de actividad */}
        {cargandoAct ? (
          <div style={s.actividadBanner}><span style={s.actividadNombre}>Cargando actividad...</span></div>
        ) : actividad ? (
          <div style={s.actividadBanner}>
            <div style={s.actividadNombre}>{actividad.name}</div>
            <div style={s.actividadDetalle}>
              {actividad.activity_type === 'fixed' ? 'Fija' : 'Individual'}
              {actividad.schedule ? ` Â· ${actividad.schedule}` : ''}
              {actividad.specialization ? ` Â· ${actividad.specialization}` : ''}
            </div>
          </div>
        ) : null}

        {/* â”€â”€ SecciÃ³n: Registrar nueva asistencia â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <h2 style={s.seccionTitulo}>Registrar nueva asistencia</h2>

        {errorForm && <div style={s.alerta('error')}>{errorForm}</div>}
        {exitoForm && <div style={s.alerta('exito')}>{exitoForm}</div>}

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
              placeholder="Ej: Buen desempeÃ±o"
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
              Volver
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

        <div style={s.divisor} />

        {/* â”€â”€ SecciÃ³n: Asistencias registradas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <h2 style={s.seccionTitulo}>
          Asistencias registradas
          {!cargandoLista && ` (${asistencias.length})`}
        </h2>

        {errorLista && <div style={s.alerta('error')}>{errorLista}</div>}

        {cargandoLista ? (
          <div style={s.vacio}>Cargando asistencias...</div>
        ) : asistencias.length === 0 ? (
          <div style={s.vacio}>AÃºn no hay asistencias registradas para esta actividad.</div>
        ) : (
          <table style={s.tabla}>
            <thead>
              <tr>
                <th style={s.th}>Cliente</th>
                <th style={s.th}>DNI</th>
                <th style={s.th}>Comentario</th>
                <th style={s.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.map((a) => (
                <tr key={a.id}>
                  <td style={s.td}>{a.nombre} {a.apellido}</td>
                  <td style={s.tdSuave}>{a.dni}</td>
                  <td style={s.td}>
                    {editandoId === a.id ? (
                      <input
                        style={s.inputInline}
                        value={comentarioEdit}
                        onChange={(e) => setComentarioEdit(e.target.value)}
                        autoFocus
                        disabled={guardando}
                      />
                    ) : (
                      <span style={{ color: a.comment ? 'inherit' : 'var(--color-texto-suave)' }}>
                        {a.comment || 'â€”'}
                      </span>
                    )}
                  </td>
                  <td style={s.td}>
                    {editandoId === a.id ? (
                      <>
                        <button
                          style={s.botonAccion('verde')}
                          onClick={() => guardarComentario(a.id)}
                          disabled={guardando || !comentarioEdit.trim()}
                        >
                          Guardar
                        </button>
                        <button
                          style={s.botonAccion('gris')}
                          onClick={cancelarEdicion}
                          disabled={guardando}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          style={s.botonAccion('azul')}
                          onClick={() => iniciarEdicion(a)}
                          disabled={guardando}
                        >
                          {a.comment ? 'Editar' : 'Agregar'}
                        </button>
                        {a.comment && (
                          <button
                            style={s.botonAccion('rojo')}
                            onClick={() => eliminarComentario(a.id)}
                            disabled={guardando}
                          >
                            Eliminar
                          </button>
                        )}
                      </>
                    )}
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
