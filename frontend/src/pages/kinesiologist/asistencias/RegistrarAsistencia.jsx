// Responsable: Ezequiel
// HU: Registrar asistencia por DNI · Dejar/Modificar/Eliminar comentario
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getActivityById } from '../../../services/activitiesService';
import {
  registerAttendanceByDni,
  getAttendancesByActivity,
  initializeAttendances,
  updateAttendanceComment,
  deleteAttendanceComment,
  generateAttendanceQr,
  getAttendanceSessionStatus,
} from '../../../services/attendanceService';

const s = {
  layout: (isMobile) => ({
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '0' : '24px',
    alignItems: 'flex-start',
  }),
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
    // Boton de regreso con fondo blanco y centrado
  botonRegreso: {
    display: 'inline-block', marginBottom: '20px', padding: '8px 16px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', background: '#fff',
    color: 'var(--color-texto)', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
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
  // Panel del código QR
  qrPanel: {
    background: 'var(--color-fondo-card)', borderRadius: '10px',
    padding: '20px', textAlign: 'center', flexShrink: 0,
    marginBottom: '24px',
  },
  qrTitulo: {
    fontSize: '14px', fontWeight: '700', color: 'var(--color-texto)',
    margin: '0 0 12px',
  },
  qrTexto: {
    fontSize: '12px', color: 'var(--color-texto-suave)',
    marginTop: '12px', maxWidth: '200px',
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

  // Edición inline de comentario
  const [editandoId, setEditandoId] = useState(null);
  const [comentarioEdit, setComentarioEdit] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Código QR de asistencia
  const [qrData, setQrData] = useState(null);
  const [generandoQr, setGenerandoQr] = useState(false);
  const [errorQr, setErrorQr] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Sesión de actividad
  const [sesionActiva, setSesionActiva] = useState(false);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [restriccionesActivas, setRestriccionesActivas] = useState(true);
  const publicAppUrl = process.env.REACT_APP_PUBLIC_URL || window.location.origin;

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth <= 768);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    getActivityById(actividadId)
      .then(setActividad)
      .catch(() => {})
      .finally(() => setCargandoAct(false));
  }, [actividadId]);

useEffect(() => {
    let mounted = true;

    async function cargarEstadoSesion() {
      setCargandoSesion(true);
      try {
        const data = await getAttendanceSessionStatus(actividadId);
        if (!mounted) return;
        setSesionActiva(Boolean(data?.session_active));
        setRestriccionesActivas(Boolean(data?.restrictions_enforced));
      } catch (_) {
        if (!mounted) return;
        setSesionActiva(false);
        setRestriccionesActivas(false);
      } finally {
        if (mounted) setCargandoSesion(false);
      }
    }

    cargarEstadoSesion();
    const interval = setInterval(cargarEstadoSesion, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [actividadId]);

  const bloqueoPorSesion = restriccionesActivas && !sesionActiva;
  const controlesBloqueados = cargandoSesion || bloqueoPorSesion;

  const cargarAsistencias = useCallback(() => {
    setCargandoLista(true);
    setErrorLista('');
    const inicializar = !controlesBloqueados
      ? initializeAttendances(actividadId).catch(() => {})
      : Promise.resolve();

    inicializar.finally(() => {
      getAttendancesByActivity(actividadId)
        .then(setAsistencias)
        .catch(() => setErrorLista('No se pudieron cargar las asistencias.'))
        .finally(() => setCargandoLista(false));
    });
  }, [actividadId, controlesBloqueados]);
  useEffect(() => { cargarAsistencias(); }, [cargarAsistencias]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (controlesBloqueados) return;
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

  async function handleGenerarQr() {
    if (controlesBloqueados) return;
    setGenerandoQr(true);
    setErrorQr('');
    try {
      const data = await generateAttendanceQr(actividadId);
      setQrData(data);
    } catch (e) {
      setErrorQr(e?.message || 'No se pudo generar el código QR.');
    } finally {
      setGenerandoQr(false);
    }
  }

  function iniciarEdicion(asistencia) {
    if (controlesBloqueados) return;
    setEditandoId(asistencia.id);
    setComentarioEdit(asistencia.comment || '');
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setComentarioEdit('');
  }

  async function guardarComentario(id) {
    if (controlesBloqueados) return;
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
    if (controlesBloqueados) return;
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

  const qrPanel = qrData && (
    <div style={s.qrPanel}>
      <h3 style={s.qrTitulo}>Código QR de asistencia</h3>
      <QRCodeSVG value={`${publicAppUrl}/asistencia/qr/${qrData.code}`} size={180} />
      <p style={s.qrTexto}>
        Válido por 15 minutos. Los alumnos pueden escanearlo para registrar su asistencia.
      </p>
    </div>
  );

  return (
    <LayoutPrivado>
      <div style={s.layout(isMobile)}>
        <div style={s.contenedor}>
          <button
              type="button"
              style={s.botonRegreso}
              onClick={() => navigate('/profesor/actividades')}
            >
              Volver
        </button>
          <div style={s.cabecera}>
            <h1 style={s.titulo}>Asistencias</h1>
            <p style={s.subtitulo}>Registrar asistencias y gestionar comentarios.</p>
          </div>

        {/* Banner de actividad */}
        {cargandoAct ? (
          <div style={s.actividadBanner}><span style={s.actividadNombre}>Cargando actividad...</span></div>
        ) : actividad ? (
          <div style={s.actividadBanner}>
            <div style={s.actividadNombre}>{actividad.name}</div>
            <div style={s.actividadDetalle}>
              {actividad.activity_type === 'fixed' ? 'Fija' : 'Individual'}
              {actividad.specialization ? ` · ${actividad.specialization}` : ''}
              {actividad.specific_date ? (
                (() => {
                  const fecha = new Date(`${actividad.specific_date}T00:00:00`);
                  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                  const dia = dias[fecha.getDay()];
                  const dia_num = fecha.getDate().toString().padStart(2, '0');
                  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
                  const anio = fecha.getFullYear();
                  const fechaStr = ` · ${dia} ${dia_num}/${mes}/${anio}`;
                  return actividad.time_slot ? `${fechaStr} · ${actividad.time_slot}` : fechaStr;
                })()
              ) : (
                actividad.schedule ? ` · ${actividad.schedule}` : ''
              )}
            </div>
            <div style={s.estadoSesion(sesionActiva && !cargandoSesion)}>
              {cargandoSesion ? 'Estado: verificando...' : (sesionActiva ? 'En curso' : 'Fuera de curso')}
            </div>
          </div>
        ) : null}

        {/* Sección: Registrar nueva asistencia */}
        <h2 style={s.seccionTitulo}>Registrar nueva asistencia</h2>

        {errorForm && <div style={s.alerta('error')}>{errorForm}</div>}
        {exitoForm && <div style={s.alerta('exito')}>{exitoForm}</div>}
        {!cargandoSesion && bloqueoPorSesion && (
          <div style={s.alerta('error')}>
            La clase aún no está en curso. Las funcionalidades de asistencia están bloqueadas.
          </div>
        )}

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
              disabled={enviando || controlesBloqueados}
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
              disabled={enviando || controlesBloqueados}
            />
          </div>
          {errorQr && <div style={s.alerta('error')}>{errorQr}</div>}

          <div style={s.botones}>
            <button
              type="button"
              style={{ ...s.botonSecundario, opacity: generandoQr ? 0.7 : 1 }}
              onClick={handleGenerarQr}
              disabled={generandoQr}
            >
              {generandoQr ? 'Generando...' : 'Generar QR'}
            </button>
            <button
              type="submit"
              style={{ ...s.botonPrimario, opacity: enviando ? 0.7 : 1 }}
              disabled={enviando || !dni.trim() || controlesBloqueados}
            >
              {enviando ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>

        {isMobile && qrPanel}

        <div style={s.divisor} />

        {/* Sección: Asistencias registradas */}
        <h2 style={s.seccionTitulo}>
          Asistencias registradas
          {!cargandoLista && ` (${asistencias.length})`}
        </h2>

        {errorLista && <div style={s.alerta('error')}>{errorLista}</div>}

        {cargandoLista ? (
          <div style={s.vacio}>Cargando asistencias...</div>
        ) : asistencias.length === 0 ? (
          <div style={s.vacio}>No hay asistencias registradas para esta actividad.</div>
        ) : (
          <table style={s.tabla}>
            <thead>
              <tr>
                <th style={s.th}>Cliente</th>
                <th style={s.th}>DNI</th>
                <th style={s.th}>Estado</th>
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
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                      fontSize: '12px', fontWeight: '600',
                      background: a.status === 'present' ? '#dcfce7' : '#f3f4f6',
                      color: a.status === 'present' ? '#16a34a' : '#6b7280',
                    }}>
                      {a.status === 'present' ? 'Presente' : 'Ausente'}
                    </span>
                  </td>
                  <td style={s.td}>
                    {editandoId === a.id ? (
                      <input
                        style={s.inputInline}
                        value={comentarioEdit}
                        onChange={(e) => setComentarioEdit(e.target.value)}
                        autoFocus
                        disabled={guardando || controlesBloqueados}
                      />
                    ) : (
                      <span style={{ color: a.comment ? 'inherit' : 'var(--color-texto-suave)' }}>
                        {a.comment || '-'}
                      </span>
                    )}
                  </td>
                  <td style={s.td}>
                    {editandoId === a.id ? (
                      <>
                        <button
                          style={s.botonAccion('verde')}
                          onClick={() => guardarComentario(a.id)}
                          disabled={guardando || !comentarioEdit.trim() || controlesBloqueados}
                        >
                          Guardar
                        </button>
                        <button
                          style={s.botonAccion('gris')}
                          onClick={cancelarEdicion}
                          disabled={guardando || cargandoSesion}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          style={s.botonAccion('azul')}
                          onClick={() => iniciarEdicion(a)}
                          disabled={guardando || controlesBloqueados}
                        >
                          {a.comment ? 'Editar' : 'Agregar'}
                        </button>
                        {a.comment && (
                          <button
                            style={s.botonAccion('rojo')}
                            onClick={() => eliminarComentario(a.id)}
                            disabled={guardando || controlesBloqueados}
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
        {!isMobile && qrPanel}
      </div>
    </LayoutPrivado>
  );
}
