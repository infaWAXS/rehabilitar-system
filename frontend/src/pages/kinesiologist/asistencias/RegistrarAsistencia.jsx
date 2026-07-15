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
  finalizeAttendances,
  updateAttendanceComment,
  deleteAttendanceComment,
  generateAttendanceQr,
  getAttendanceSessionStatus,
} from '../../../services/attendanceService';

const s = {
  layout: (isMobile) => ({
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: '20px',
    alignItems: isMobile ? 'stretch' : 'flex-start',
    flexWrap: 'wrap',
  }),
  contenedor: { maxWidth: '640px' },
  cabecera: { marginBottom: '24px' },
  titulo: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', margin: '0 0 6px' },
  subtitulo: { fontSize: '14px', color: 'var(--color-texto-suave)' },
  actividadBanner: {
    background: 'var(--color-fondo-card)', borderRadius: '10px',
    padding: '14px 18px',
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
    padding: '6px 12px', borderRadius: '6px', border: 'none',
    background: color === 'rojo' ? '#fee2e2' : color === 'verde' ? '#dcfce7' : color === 'gris' ? '#f3f4f6' : '#eff6ff',
    color: color === 'rojo' ? '#dc2626' : color === 'verde' ? '#16a34a' : color === 'gris' ? '#4b5563' : '#2563eb',
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
    marginTop: '12px', lineHeight: 1.5,
  },
  // ── Layout de 3 columnas ──
  colIzquierda: (isMobile) => ({
    flex: isMobile ? '1 1 auto' : '0 0 340px',
    width: isMobile ? '100%' : '340px',
    display: 'flex', flexDirection: 'column', gap: '20px',
    order: isMobile ? 0 : 2,
  }),
  colCentro: (isMobile) => ({ flex: '1 1 360px', minWidth: 0, order: isMobile ? 0 : 1 }),
  colDerecha: (isMobile) => ({
    flex: isMobile ? '1 1 auto' : '0 0 250px',
    width: isMobile ? '100%' : '250px',
    order: isMobile ? 0 : 3,
  }),
  panel: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '20px', boxShadow: 'var(--sombra)',
  },
  qrPanelBody: { textAlign: 'center' },
  // ── Tarjeta de inscripto ──
  inscriptoCard: {
    border: '1px solid var(--color-borde)', borderRadius: '10px',
    padding: '14px 16px', marginBottom: '12px', background: 'var(--color-fondo)',
  },
  inscriptoHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '10px', marginBottom: '12px',
  },
  inscriptoNombre: { fontSize: '14px', fontWeight: '700', color: 'var(--color-texto)' },
  inscriptoDni: { fontSize: '12px', color: 'var(--color-texto-suave)', marginTop: '2px' },
  badgeAsistencia: (presente) => ({
    display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap',
    background: presente ? '#dcfce7' : '#f3f4f6',
    color: presente ? '#16a34a' : '#6b7280',
    border: `1px solid ${presente ? '#86efac' : '#e5e7eb'}`,
  }),
  comentarioBloque: {
    background: 'var(--color-fondo-card)', borderRadius: '8px',
    padding: '10px 12px', border: '1px solid var(--color-borde)',
  },
  comentarioLabel: {
    fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: '0.04em', color: 'var(--color-texto-suave)', marginBottom: '6px',
  },
  comentarioTexto: {
    fontSize: '13px', lineHeight: 1.5, marginBottom: '10px',
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  },
  comentarioTextarea: {
    width: '100%', padding: '8px 10px', borderRadius: '6px',
    border: '1px solid var(--color-borde)', fontSize: '13px',
    background: 'var(--color-fondo)', color: 'var(--color-texto)',
    boxSizing: 'border-box', resize: 'vertical', minHeight: '64px', marginBottom: '10px',
  },
  comentarioBotones: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  contador: {
    display: 'inline-block', marginLeft: '8px', padding: '1px 10px',
    borderRadius: '20px', fontSize: '13px', fontWeight: '700',
    background: 'var(--color-primario)', color: '#fff', verticalAlign: 'middle',
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

  // Finalización de clase (registra inasistencias y evalúa suspensiones)
  const [finalizando, setFinalizando] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState(null); // { tipo, mensaje }

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
      const comentario = comment.trim() || null;
      await registerAttendanceByDni({
        dni: dni.trim(),
        activity_id: Number(actividadId),
        comment: comentario,
      });
      setExitoForm(
        comentario
          ? 'Asistencia registrada correctamente junto con el comentario.'
          : 'Asistencia registrada correctamente.'
      );
      setDni('');
      setComment('');
      cargarAsistencias();
    } catch (e) {
      setErrorForm(e?.message || 'No se pudo registrar la asistencia.');
    } finally {
      setEnviando(false);
    }
  }

  async function handleFinalizar() {
    if (finalizando) return;
    const confirmar = window.confirm(
      'Al finalizar la clase, los inscriptos que no registraron asistencia quedarán como ausentes ' +
      'y se evaluará la suspensión automática por inasistencias. ¿Continuar?'
    );
    if (!confirmar) return;

    setFinalizando(true);
    setResultadoFinal(null);
    try {
      const res = await finalizeAttendances(actividadId);
      const suspendidos = res?.clientes_suspendidos ?? 0;
      const mensaje = suspendidos > 0
        ? `Clase finalizada. Se registraron ${res.ausentes_registrados} inasistencia(s) y se suspendieron ${suspendidos} cuenta(s) por asistencia. Se notificó el motivo a cada cliente.`
        : `Clase finalizada. Se registraron ${res.ausentes_registrados} inasistencia(s). Ninguna cuenta fue suspendida.`;
      setResultadoFinal({ tipo: 'exito', mensaje });
      cargarAsistencias();
    } catch (e) {
      setResultadoFinal({ tipo: 'error', mensaje: e?.message || 'No se pudo finalizar la clase.' });
    } finally {
      setFinalizando(false);
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

  // El código QR se renderiza en la columna derecha (más abajo).

  return (
    <LayoutPrivado>
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

      {!cargandoSesion && bloqueoPorSesion && (
        <div style={s.alerta('error')}>
          La clase aún no está en curso. Las funcionalidades de asistencia están bloqueadas.
        </div>
      )}

      <div style={s.layout(isMobile)}>
        {/* ── Columna izquierda: actividad + registro por DNI ── */}
        <div style={s.colIzquierda(isMobile)}>
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

        {/* Panel: Registrar asistencia por DNI */}
        <div style={s.panel}>
        <h2 style={s.seccionTitulo}>Registrar asistencia por DNI</h2>

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
        </div>
        </div>

        {/* ── Columna central: listado de inscriptos ── */}
        <div style={s.colCentro(isMobile)}>
          <div style={s.panel}>
            <h2 style={s.seccionTitulo}>
              Inscriptos
              {!cargandoLista && <span style={s.contador}>{asistencias.length}</span>}
            </h2>

            {errorLista && <div style={s.alerta('error')}>{errorLista}</div>}

            {cargandoLista ? (
              <div style={s.vacio}>Cargando inscriptos...</div>
            ) : asistencias.length === 0 ? (
              <div style={s.vacio}>No hay inscriptos en esta actividad.</div>
            ) : (
              asistencias.map((a) => {
                const presente = a.status === 'present';
                const editando = editandoId === a.id;
                return (
                  <div key={a.id} style={s.inscriptoCard}>
                    <div style={s.inscriptoHeader}>
                      <div>
                        <div style={s.inscriptoNombre}>{a.nombre} {a.apellido}</div>
                        <div style={s.inscriptoDni}>DNI {a.dni}</div>
                      </div>
                      <span style={s.badgeAsistencia(presente)}>
                        {presente ? 'Presente' : 'Ausente'}
                      </span>
                    </div>

                    <div style={s.comentarioBloque}>
                      <div style={s.comentarioLabel}>Comentario</div>
                      {editando ? (
                        <>
                          <textarea
                            style={s.comentarioTextarea}
                            value={comentarioEdit}
                            onChange={(e) => setComentarioEdit(e.target.value)}
                            placeholder="Escribí un comentario para este inscripto..."
                            autoFocus
                            disabled={guardando || controlesBloqueados}
                          />
                          <div style={s.comentarioBotones}>
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
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{
                            ...s.comentarioTexto,
                            color: a.comment ? 'var(--color-texto)' : 'var(--color-texto-suave)',
                            fontStyle: a.comment ? 'normal' : 'italic',
                          }}>
                            {a.comment || 'Sin comentario'}
                          </div>
                          <div style={s.comentarioBotones}>
                            <button
                              style={s.botonAccion('azul')}
                              onClick={() => iniciarEdicion(a)}
                              disabled={guardando || controlesBloqueados}
                            >
                              {a.comment ? 'Modificar' : 'Agregar'}
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
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Finalizar clase: registra inasistencias y evalúa suspensiones */}
            {!cargandoLista && asistencias.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-borde)' }}>
                {resultadoFinal && (
                  <div style={s.alerta(resultadoFinal.tipo === 'error' ? 'error' : 'exito')}>
                    {resultadoFinal.mensaje}
                  </div>
                )}
                <button
                  type="button"
                  style={{ ...s.botonPrimario, width: '100%', opacity: finalizando ? 0.7 : 1 }}
                  onClick={handleFinalizar}
                  disabled={finalizando}
                >
                  {finalizando ? 'Finalizando...' : 'Finalizar clase y registrar inasistencias'}
                </button>
                <p style={{ fontSize: '12px', color: 'var(--color-texto-suave)', marginTop: '8px', textAlign: 'center' }}>
                  Los ausentes quedarán registrados. Un cliente con más de 3 inasistencias o menos del 50% de asistencia mensual será suspendido automáticamente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Columna derecha: código QR ── */}
        <div style={s.colDerecha(isMobile)}>
          <div style={{ ...s.panel, ...s.qrPanelBody }}>
            <h3 style={s.qrTitulo}>Código QR de asistencia</h3>
            {qrData ? (
              <>
                <QRCodeSVG value={`${publicAppUrl}/asistencia/qr/${qrData.code}`} size={180} />
                <p style={s.qrTexto}>
                  Válido por 15 minutos. Los alumnos pueden escanearlo para registrar su asistencia.
                </p>
              </>
            ) : (
              <p style={s.qrTexto}>
                Generá un código QR desde el formulario para mostrarlo aquí. Los alumnos podrán escanearlo para registrar su asistencia.
              </p>
            )}
          </div>
        </div>
      </div>
    </LayoutPrivado>
  );
}
