import React, { useState } from 'react';
import { getStatisticsReport } from '../../../services/reportsService';

const s = {
  contenedor: { padding: '32px 24px', boxSizing: 'border-box', maxWidth: '1100px', margin: '0 auto' },
  titulo: { fontSize: '32px', fontWeight: '800', color: 'var(--color-texto)', marginBottom: '8px', letterSpacing: '-0.5px' },
  bajada: { fontSize: '15px', color: 'var(--color-texto-suave)', marginBottom: '28px', lineHeight: 1.5 },
  contenedorPills: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  pillRapida: { padding: '8px 16px', background: 'var(--color-primario-suave, #f0fbfb)', color: 'var(--color-primario-oscuro, #0d7377)', border: '1px solid var(--color-borde)', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
  cardFiltros: { background: '#fff', border: '1px solid var(--color-borde)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--sombra)', marginBottom: '32px' },
  filaFiltros: { display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' },
  grupo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--color-texto-suave)' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', fontSize: '14px', color: 'var(--color-texto)', outline: 'none' },
  boton: { border: 'none', color: '#fff', background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))', borderRadius: '8px', padding: '11px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', height: '42px' },
  botonCargando: { border: 'none', color: '#fff', background: '#cbd5e1', borderRadius: '8px', padding: '11px 24px', fontSize: '14px', fontWeight: '700', cursor: 'not-allowed', height: '42px' },
  error: { padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: '500' },
  gridResumen: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' },
  tarjetaMini: { background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-borde)', boxShadow: 'var(--sombra)', display: 'flex', flexDirection: 'column', gap: '4px' },
  labelMini: { fontSize: '11px', fontWeight: '700', color: 'var(--color-primario)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  valorMini: { fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--color-texto)', letterSpacing: '-0.5px' },
  seccionReporte: { background: '#fff', padding: '28px', borderRadius: '14px', border: '1px solid var(--color-borde)', boxShadow: 'var(--sombra)', marginBottom: '32px' },
  subtitulo: { fontSize: '20px', fontWeight: '800', marginBottom: '18px', color: 'var(--color-texto)' },
  wrapperTabla: { overflowX: 'auto', marginTop: '12px' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', background: 'var(--color-primario-suave, #f0fbfb)', color: 'var(--color-primario-oscuro, #0d7377)', fontSize: '13px', fontWeight: '700', borderBottom: '2px solid var(--color-borde)' },
  td: { padding: '14px 16px', borderBottom: '1px solid var(--color-borde)', color: 'var(--color-texto)', fontSize: '14px' },
  gridDividido: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '32px' },
  badgePorcentaje: { background: 'var(--color-secundario-suave, #fff7ed)', color: 'var(--color-secundario-oscuro, #c2410c)', padding: '4px 10px', borderRadius: '999px', fontSize: '13px', fontWeight: '700', display: 'inline-block' },
  
  /* Estilo estético inicial restaurado para gráficos evolutivos */
  contenedorGrafico: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '220px', borderLeft: '2px solid var(--color-borde)', borderBottom: '2px solid var(--color-borde)', padding: '16px 8px 0 8px', marginTop: '20px', position: 'relative' },
  columnaBarra: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px', height: '100%', justifyContent: 'flex-end' },
  barraFisica: (pct, colorGrad) => ({ width: '60%', maxWidth: '40px', height: `${Math.max(parseFloat(pct) || 0, 4)}%`, background: colorGrad, borderRadius: '6px 6px 0 0', position: 'relative', display: 'flex', justifyContent: 'center', transition: 'all 0.3s ease' }),
  tooltipVolatil: { position: 'absolute', top: '-26px', fontSize: '11px', fontWeight: '700', color: 'var(--color-texto)', background: '#fff', border: '1px solid var(--color-borde)', padding: '2px 6px', borderRadius: '4px', boxShadow: 'var(--sombra)' },
  etiquetaX: { fontSize: '11px', fontWeight: '600', color: 'var(--color-texto-suave)', textAlign: 'center', marginTop: '4px' },
  
  /* Grid adaptable para el Mapa de Calor completo */
  gridCalorDinamico: (columnas) => ({ display: 'grid', gridTemplateColumns: `120px repeat(${columnas}, minmax(60px, 1fr))`, gap: '6px', marginTop: '16px' }),
  celdaCalorCabecera: { fontWeight: '700', fontSize: '12px', color: 'var(--color-texto)', padding: '10px 4px', textAlign: 'center', background: '#f8fafc', borderRadius: '4px' },
  celdaCalorDia: { fontWeight: '600', fontSize: '13px', color: 'var(--color-texto)', padding: '8px', display: 'flex', alignItems: 'center' },
  celdaBloque: (sat) => {
    let bg = '#f1f5f9';
    let color = 'var(--color-texto-suave)';
    if (sat > 80) { bg = '#115e59'; color = '#fff'; }       // Teals Degradados estéticos
    else if (sat > 50) { bg = '#0d9488'; color = '#fff'; }
    else if (sat > 25) { bg = '#2dd4bf'; color = '#115e59'; }
    else if (sat > 0) { bg = '#ccfbf1'; color = '#134e4a'; }
    return { background: bg, color: color, padding: '12px 4px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: '700', border: '1px solid rgba(0,0,0,0.01)', transition: 'background 0.2s' };
  }
};

export default function ReportesAdmin() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');

  const formatearFecha = (d) => {
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  };

  const consultarFechas = async (inicio, fin) => {
    setErrorValidacion(''); setReporte(null);
    try {
      setCargando(true);
      const data = await getStatisticsReport(inicio, fin);
      setReporte(data);
    } catch (err) {
      setErrorValidacion(err.message || 'No se pudo procesar el reporte.');
    } finally {
      setCargando(false);
    }
  };

  const manejarGeneracionManual = (e) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin) { setErrorValidacion('Por favor, selecciona ambas fechas.'); return; }
    consultarFechas(fechaInicio, fechaFin);
  };

  const setearUltimaSemana = () => {
    const hoy = new Date(); const ini = new Date(); ini.setDate(hoy.getDate() - 7);
    setFechaInicio(formatearFecha(ini)); setFechaFin(formatearFecha(hoy));
    consultarFechas(formatearFecha(ini), formatearFecha(hoy));
  };

  const setearUltimoMes = () => {
    const hoy = new Date(); const ini = new Date(); ini.setMonth(hoy.getMonth() - 1);
    setFechaInicio(formatearFecha(ini)); setFechaFin(formatearFecha(hoy));
    consultarFechas(formatearFecha(ini), formatearFecha(hoy));
  };

  const setearUltimoAnio = () => {
    const hoy = new Date(); const ini = new Date(); ini.setFullYear(hoy.getFullYear() - 1);
    setFechaInicio(formatearFecha(ini)); setFechaFin(formatearFecha(hoy));
    consultarFechas(formatearFecha(ini), formatearFecha(hoy));
  };

  // Extraemos las claves de horas disponibles en el JSON para mapear dinámicamente las cabeceras del Heatmap
  const listaHorarios = reporte?.mapa_calor?.[0] ? Object.keys(reporte.mapa_calor[0].horas).sort() : [];

  return (
    <div style={s.contenedor}>
      <h1 style={s.titulo}>Reportes Estadísticos</h1>
      <p style={s.bajada}>Métricas consolidadas de rendimiento del centro, concurrencia de alumnos e ingresos brutos por planes.</p>

      {/* Accesos Rápidos */}
      <div style={s.contenedorPills}>
        <button type="button" onClick={setearUltimaSemana} style={s.pillRapida} disabled={cargando}>📅 Última semana</button>
        <button type="button" onClick={setearUltimoMes} style={s.pillRapida} disabled={cargando}>📊 Último mes</button>
        <button type="button" onClick={setearUltimoAnio} style={s.pillRapida} disabled={cargando}>📈 Último año</button>
      </div>

      <div style={s.cardFiltros}>
        <form onSubmit={manejarGeneracionManual} style={s.filaFiltros}>
          <div style={s.grupo}>
            <label style={s.label} htmlFor="fechaInicio">Fecha de inicio</label>
            <input id="fechaInicio" type="date" style={s.input} value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div style={s.grupo}>
            <label style={s.label} htmlFor="fechaFin">Fecha de fin</label>
            <input id="fechaFin" type="date" style={s.input} value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
          <button type="submit" style={cargando ? s.botonCargando : s.boton} disabled={cargando}>
            {cargando ? 'Analizando...' : 'Generar Reporte'}
          </button>
        </form>
      </div>

      {errorValidacion && <div style={s.error}>{errorValidacion}</div>}

      {reporte && (
        <>
          {/* Bloque Resumen */}
          <div style={s.gridResumen}>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Nuevos Registros</span>
              <p style={s.valorMini}>{reporte.resumen.nuevos_registros}</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Ingresos por Planes</span>
              <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>
                ${Number(reporte.resumen.ingresos_totales).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Cuentas Suspendidas Activas</span>
              <p style={{ ...s.valorMini, color: '#dc2626' }}>{reporte.resumen.clientes_suspendidos}</p>
              <span style={{ fontSize: '11px', color: 'var(--color-texto-suave)' }}>clientes penalizados vigentes</span>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Tasa de Ausentismo Promedio</span>
              <p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>{reporte.resumen.tasa_ausentismo}%</p>
              <span style={{ fontSize: '11px', color: 'var(--color-texto-suave)' }}>porcentaje general de faltas</span>
            </div>
          </div>

          {/* Tabla de Especialidades */}
          {/* ── SECCIÓN MODIFICADA: RENDIMIENTO POR ESPECIALIDAD (2 TABLAS) ── */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>Rendimiento por Especialidad / Tipo de Clase</h2>
            <p style={s.label}>Análisis integral de flujo de concurrencia, deserción de turnos y balance de cupos del establecimiento.</p>
            
            {/* 1ra Tabla: Control de Asistencias y Cancelaciones */}
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginTop: '24px', marginBottom: '8px', color: 'var(--color-primario-oscuro)' }}>
              1. Control de Concurrencia y Cancelaciones
            </h3>
            <div style={s.wrapperTabla}>
              <table style={s.tabla}>
                <thead>
                  <tr>
                    <th style={s.th}>Especialidad</th>
                    <th style={s.th}>Asistencias Totales</th>
                    <th style={s.th}>Asistencias Fijas</th>
                    <th style={s.th}>Asistencias Indiv.</th>
                    <th style={s.th}>Cancelaciones Fijas</th>
                    <th style={s.th}>Cancelaciones Indiv.</th>
                    <th style={s.th}>Porcentaje de Cancelación</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.clase.map((c, index) => (
                    <tr key={index}>
                      <td style={s.td}><strong>{c.tipo}</strong></td>
                      <td style={s.td}><strong>{c.asistencias_fijas + c.asistencias_individuales}</strong></td>
                      <td style={s.td}>{c.asistencias_fijas}</td>
                      <td style={s.td}>{c.asistencias_individuales}</td>
                      <td style={s.td}>{c.cancelaciones_fijas}</td>
                      <td style={s.td}>{c.cancelaciones_individuales}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badgePorcentaje, background: '#fef2f2', color: '#991b1b' }}>
                          {c.porcentaje_cancelacion}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Separador de diseño sutil */}
            <div style={{ margin: '32px 0 24px 0', borderTop: '1px dashed var(--color-borde)' }} />

            {/* 2da Tabla: Planificación de Oferta y Aprovechamiento de Cupos */}
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-primario-oscuro)' }}>
              2. Planificación de Oferta y Aprovechamiento de Cupos Iniciales
            </h3>
            <div style={s.wrapperTabla}>
              <table style={s.tabla}>
                <thead>
                  <tr>
                    <th style={s.th}>Especialidad</th>
                    <th style={s.th}>Clases Fijas Ofertadas</th>
                    <th style={s.th}>Cupos Iniciales Fijos</th>
                    <th style={s.th}>Ocupación Fijas</th>
                    <th style={s.th}>Clases Indiv. Ofertadas</th>
                    <th style={s.th}>Cupos Iniciales Indiv.</th>
                    <th style={s.th}>Ocupación Individuales</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.clase.map((c, index) => (
                    <tr key={index}>
                      <td style={s.td}><strong>{c.tipo}</strong></td>
                      <td style={s.td}>{c.cant_fijas}</td>
                      <td style={s.td}><span style={{ color: 'var(--color-texto-suave)' }}>{c.cupos_iniciales_fijas} lugares</span></td>
                      <td style={s.td}>
                        <span style={{ ...s.badgePorcentaje, background: c.cupos_iniciales_fijos === 0 ? '#f1f5f9' : '#f3e8ff', color: c.cupos_iniciales_fijos === 0 ? '#64748b' : '#7e22ce' }}>
                          {c.ocupacion_fijas}%
                        </span>
                      </td>
                      <td style={s.td}>{c.cant_individuales}</td>
                      <td style={s.td}><span style={{ color: 'var(--color-texto-suave)' }}>{c.cupos_iniciales_indiv} lugares</span></td>
                      <td style={s.td}>
                        <span style={{ ...s.badgePorcentaje, background: c.cupos_iniciales_indiv === 0 ? '#f1f5f9' : '#e0f2fe', color: c.cupos_iniciales_indiv === 0 ? '#64748b' : '#0369a1' }}>
                          {c.ocupacion_indiv}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── NUEVO APARTADO: MOTIVOS DE SANCIONES ────────────────────────── */}
          <div style={s.seccionReporte}>
            <h2 style={{ ...s.subtitulo, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚫 Auditoría de Clientes Penalizados Vigentes
            </h2>
            <p style={s.label}>Listado detallado de los usuarios con suspensiones activas en el sistema, motivos de la sanción y fecha de vigencia.</p>
            
            <div style={s.wrapperTabla}>
              <table style={s.tabla}>
                <thead>
                  <tr>
                    <th style={{ ...s.th, background: '#fef2f2', color: '#991b1b' }}>Nombre Completo</th>
                    <th style={{ ...s.th, background: '#fef2f2', color: '#991b1b' }}>Motivo de la Suspensión</th>
                    <th style={{ ...s.th, background: '#fef2f2', color: '#991b1b', width: '180px' }}>Inicio de Suspensión</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.sancionados && reporte.sancionados.length > 0 ? (
                    reporte.sancionados.map((user, idx) => (
                      <tr key={idx}>
                        <td style={s.td}><strong>{user.nombre}</strong></td>
                        <td style={{ ...s.td, color: 'var(--color-texto-suave)', fontSize: '13px', lineHeight: '1.4' }}>
                          {user.motivo}
                        </td>
                        <td style={s.td}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                            📅 {user.fecha_inicio}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ ...s.td, textAlign: 'center', color: 'var(--color-texto-suave)', padding: '24px' }}>
                        No hay clientes con suspensiones activas en este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mapa de Calor Horario Completo (Grid Multi-Horas) */}
          {reporte.mapa_calor && listaHorarios.length > 0 && (
            <div style={s.seccionReporte}>
              <h2 style={s.subtitulo}>Mapa de Calor Horario (Grid)</h2>
              <p style={s.bajada}>Mapeo integral de la ocupación del centro por franja horaria. Ayuda a identificar cuellos de botella u horarios desaprovechados.</p>
              
              <div style={s.wrapperTabla}>
                <div style={s.gridCalorDinamico(listaHorarios.length)}>
                  <div style={s.celdaCalorCabecera}>Día / Módulo</div>
                  {listaHorarios.map((hora, idx) => (
                    <div key={idx} style={s.celdaCalorCabecera}>{hora} hs</div>
                  ))}

                  {reporte.mapa_calor.map((row, i) => (
                    <React.Fragment key={i}>
                      <div style={s.celdaCalorDia}><strong>{row.dia}</strong></div>
                      {listaHorarios.map((hora, idx) => (
                        <div key={idx} style={s.celdaBloque(row.horas[hora])} title={`Día ${row.dia} a las ${hora}`}>
                          {row.horas[hora]}%
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bloques Divididos (Aulas y Profesores) */}
          <div style={s.gridDividido}>
            <div style={s.seccionReporte}>
              <h2 style={s.subtitulo}>Ocupación de Salas</h2>
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.th}>Espacio Físico</th>
                      <th style={s.th}>Capacidad Máxima</th>
                      <th style={s.th}>Ocupación Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.ocupacion_aulas.map((a, index) => (
                      <tr key={index}>
                        <td style={s.td}>{a.aula}</td>
                        <td style={s.td}>{a.capacidad_maxima ? `${a.capacidad_maxima} alumnos` : 'N/C'}</td>
                        <td style={s.td}><span style={s.badgePorcentaje}>{a.porcentaje_ocupacion}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={s.seccionReporte}>
              <h2 style={s.subtitulo}>Concurrencia de Profesores</h2>
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.th}>Kinesiólogo</th>
                      <th style={s.th}>Alumnos Atendidos</th>
                      <th style={s.th}>Ausencias / Cancelados</th>
                      <th style={s.th}>Uso de Cupos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.profesores_mayor_concurrencia.map((p, index) => (
                      <tr key={index}>
                        <td style={s.td}><strong>{p.nombre}</strong></td>
                        <td style={s.td}>{p.total_alumnos_atendidos}</td>
                        <td style={s.td}>{p.total_cancelaciones_recibidas}</td>
                        <td style={s.td}><span style={{ ...s.badgePorcentaje, background: '#eff6ff', color: '#1d4ed8' }}>{p.porcentaje_ocupacion_clases}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Históricos Mensuales Estéticos Originales abajo de todo */}
          {reporte.evolucion_temporal?.datos?.length > 0 && (
            <div style={s.gridDividido}>
              <div style={s.seccionReporte}>
                <h2 style={s.subtitulo}>Evolución: Ocupación de Salas</h2>
                <span style={s.label}>Eje Y: Ocupación Promedio (%) | Histórico Mensual</span>
                <div style={s.contenedorGrafico}>
                  {reporte.evolucion_temporal.datos.map((d, i) => (
                    <div key={i} style={s.columnaBarra}>
                      <div style={s.barraFisica(d.ocupacion_salas_especialidades, 'linear-gradient(180deg, var(--color-primario), #a5f3fc)')}>
                        <span style={s.tooltipVolatil}>{d.ocupacion_salas_especialidades}%</span>
                      </div>
                      <span style={s.etiquetaX}>{d.etiqueta}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={s.seccionReporte}>
                <h2 style={s.subtitulo}>Evolución: Uso de Cupos (Profesores)</h2>
                <span style={s.label}>Eje Y: Uso de Cupos (%) | Histórico Mensual</span>
                <div style={s.contenedorGrafico}>
                  {reporte.evolucion_temporal.datos.map((d, i) => (
                    <div key={i} style={s.columnaBarra}>
                      <div style={s.barraFisica(d.uso_cupos_profesores, 'linear-gradient(180deg, var(--color-secundario), #fde68a)')}>
                        <span style={s.tooltipVolatil}>{d.uso_cupos_profesores}%</span>
                      </div>
                      <span style={s.etiquetaX}>{d.etiqueta}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}