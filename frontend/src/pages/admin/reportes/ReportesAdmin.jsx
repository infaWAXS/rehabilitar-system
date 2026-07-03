import React, { useState } from 'react';
import { getStatisticsReport } from '../../../services/reportsService';

const s = {
  contenedor: { padding: '32px 24px', boxSizing: 'border-box', maxWidth: '1100px', margin: '0 auto' },
  titulo: { fontSize: '32px', fontWeight: '800', color: 'var(--color-texto)', marginBottom: '8px', letterSpacing: '-0.5px' },
  bajada: { fontSize: '15px', color: 'var(--color-texto-suave)', marginBottom: '28px', lineHeight: 1.5 },
  contenedorPills: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  pillRapida: { padding: '8px 16px', background: 'var(--color-primario-suave, #f0fbfb)', color: 'var(--color-primario-oscuro, #0d7377)', border: '1px solid var(--color-borde)', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
  cardFiltros: { background: '#fff', border: '1px solid var(--color-borde)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--sombra)', marginBottom: '20px' },
  filaFiltros: { display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' },
  grupo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--color-texto-suave)' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', fontSize: '14px', color: 'var(--color-texto)', outline: 'none' },
  select: { padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', fontSize: '14px', color: 'var(--color-texto)', outline: 'none', minWidth: '240px', cursor: 'pointer' },
  boton: { border: 'none', color: '#fff', background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))', borderRadius: '8px', padding: '11px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', height: '42px' },
  botonCargando: { border: 'none', color: '#fff', background: '#cbd5e1', borderRadius: '8px', padding: '11px 24px', fontSize: '14px', fontWeight: '700', cursor: 'not-allowed', height: '42px' },
  error: { padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: '500' },
  gridResumen: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' },
  tarjetaMini: { background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-borde)', boxShadow: 'var(--sombra)', display: 'flex', flexDirection: 'column', gap: '4px' },
  labelMini: { fontSize: '11px', fontWeight: '700', color: 'var(--color-primario)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  valorMini: { fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--color-texto)', letterSpacing: '-0.5px' },
  seccionReporte: { background: '#fff', padding: '28px', borderRadius: '14px', border: '1px solid var(--color-borde)', boxShadow: 'var(--sombra)', marginBottom: '32px' },
  subtitulo: { fontSize: '20px', fontWeight: '800', color: 'var(--color-texto)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  wrapperTabla: { overflowX: 'auto', marginTop: '12px' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  thOrdenable: { textAlign: 'left', padding: '14px 16px', background: 'var(--color-primario-suave, #f0fbfb)', color: 'var(--color-primario-oscuro, #0d7377)', fontSize: '13px', fontWeight: '700', borderBottom: '2px solid var(--color-borde)', cursor: 'pointer', userSelect: 'none', transition: 'background 0.2s' },
  td: { padding: '14px 16px', borderBottom: '1px solid var(--color-borde)', color: 'var(--color-texto)', fontSize: '14px' },
  gridDividido: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '32px' },
  badgePorcentaje: { background: 'var(--color-secundario-suave, #fff7ed)', color: 'var(--color-secundario-oscuro, #c2410c)', padding: '4px 10px', borderRadius: '999px', fontSize: '13px', fontWeight: '700', display: 'inline-block' },
  badgeFiltroTitulo: { background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' },
  badgeGlobalTitulo: { background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' },
  bannerFiltroActivo: { background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px', boxShadow: 'var(--sombra)' },
  contenedorGrafico: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '220px', borderLeft: '2px solid var(--color-borde)', borderBottom: '2px solid var(--color-borde)', padding: '16px 8px 0 8px', marginTop: '20px', position: 'relative' },
  columnaBarra: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px', height: '100%', justifyContent: 'flex-end' },
  barraFisica: (pct, colorGrad) => ({ width: '60%', maxWidth: '40px', height: `${Math.max(parseFloat(pct) || 0, 4)}%`, background: colorGrad, borderRadius: '6px 6px 0 0', position: 'relative', display: 'flex', justifyContent: 'center', transition: 'all 0.3s ease' }),
  tooltipVolatil: { position: 'absolute', top: '-26px', fontSize: '11px', fontWeight: '700', color: 'var(--color-texto)', background: '#fff', border: '1px solid var(--color-borde)', padding: '2px 6px', borderRadius: '4px', boxShadow: 'var(--sombra)' },
  etiquetaX: { fontSize: '11px', fontWeight: '600', color: 'var(--color-texto-suave)', textAlign: 'center', marginTop: '4px' },
  gridCalorDinamico: (columnas) => ({ display: 'grid', gridTemplateColumns: `120px repeat(${columnas}, minmax(60px, 1fr))`, gap: '6px', marginTop: '16px' }),
  celdaCalorCabecera: { fontWeight: '700', fontSize: '12px', color: 'var(--color-texto)', padding: '10px 4px', textAlign: 'center', background: '#f8fafc', borderRadius: '4px' },
  celdaCalorDia: { fontWeight: '600', fontSize: '13px', color: 'var(--color-texto)', padding: '8px', display: 'flex', alignItems: 'center' },
  celdaBloque: (sat) => {
    let bg = '#f1f5f9'; let color = 'var(--color-texto-suave)';
    if (sat > 80) { bg = '#115e59'; color = '#fff'; }       
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
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');

  const [sortConcurrencia, setSortConcurrencia] = useState({ llave: null, direccion: 'asc' });
  const [sortOferta, setSortOferta] = useState({ llave: null, direccion: 'asc' });
  const [sortSalas, setSortSalas] = useState({ llave: null, direccion: 'asc' });
  const [sortProfesores, setSortProfesores] = useState({ llave: null, direccion: 'asc' });

  const formatearFecha = (d) => {
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  };

  // CORREGIDO: Las funciones rápidas ahora actualizan visualmente los valores de los inputs
  const setearUltimaSemana = () => {
    const hoy = new Date(); const ini = new Date(); ini.setDate(hoy.getDate() - 7);
    const sIni = formatearFecha(ini); const sFin = formatearFecha(hoy);
    setFechaInicio(sIni); setFechaFin(sFin); consultarFechas(sIni, sFin);
  };

  const setearUltimoMes = () => {
    const hoy = new Date(); const ini = new Date(); ini.setMonth(hoy.getMonth() - 1);
    const sIni = formatearFecha(ini); const sFin = formatearFecha(hoy);
    setFechaInicio(sIni); setFechaFin(sFin); consultarFechas(sIni, sFin);
  };

  const setearUltimoAnio = () => {
    const hoy = new Date(); const ini = new Date(); ini.setFullYear(hoy.getFullYear() - 1);
    const sIni = formatearFecha(ini); const sFin = formatearFecha(hoy);
    setFechaInicio(sIni); setFechaFin(sFin); consultarFechas(sIni, sFin);
  };

  const consultarFechas = async (inicio, fin) => {
    setErrorValidacion(''); setReporte(null); setFiltroEspecialidad('');
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

  const cambiarOrden = (llave, estadoActual, setEstado) => {
    const direccion = estadoActual.llave === llave && estadoActual.direccion === 'asc' ? 'desc' : 'asc';
    setEstado({ llave, direccion });
  };

  const renderFlecha = (llave, estado) => {
    if (estado.llave !== llave) return ' ↕';
    return estado.direccion === 'asc' ? ' ▲' : ' ▼';
  };

  const procesarOrdenamiento = (datos, configuracion, llaveEspecialidad = null) => {
    if (!configuracion.llave) return datos;
    const copia = [...datos];
    copia.sort((a, b) => {
      let valA = a[configuracion.llave]; let valB = b[configuracion.llave];
      if (llaveEspecialidad && configuracion.llave === 'porcentaje_ocupacion') {
        valA = a.por_especialidad?.[llaveEspecialidad] ?? 0; valB = b.por_especialidad?.[llaveEspecialidad] ?? 0;
      } else if (llaveEspecialidad && ['total_alumnos_atendidos', 'total_cancelaciones_recibidas', 'porcentaje_ocupacion_clases'].includes(configuracion.llave)) {
        const subK = configuracion.llave === 'total_alumnos_atendidos' ? 'atendidos' : (configuracion.llave === 'total_cancelaciones_recibidas' ? 'cancelados' : 'uso_cupos');
        valA = a.por_especialidad?.[llaveEspecialidad]?.[subK] ?? 0; valB = b.por_especialidad?.[llaveEspecialidad]?.[subK] ?? 0;
      } else if (configuracion.llave === 'asistencias_totales') {
        valA = a.asistencias_fijas + a.asistencias_individuales; valB = b.asistencias_fijas + b.asistencias_individuales;
      }
      if (typeof valA === 'string') return configuracion.direccion === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return configuracion.direccion === 'asc' ? valA - valB : valB - valA;
    });
    return copia;
  };

  const opcionesEspecialidades = reporte?.clase ? [...new Set(reporte.clase.map(c => c.tipo))].sort() : [];
  const clasesConcurrenciaOrdenadas = reporte ? procesarOrdenamiento(reporte.clase, sortConcurrencia) : [];
  const clasesOfertaOrdenadas = reporte ? procesarOrdenamiento(reporte.clase, sortOferta) : [];
  const salasOrdenadas = reporte ? procesarOrdenamiento(reporte.ocupacion_aulas, sortSalas, filtroEspecialidad) : [];
  const profesoresOrdenados = reporte ? procesarOrdenamiento(reporte.profesores_mayor_concurrencia, sortProfesores, filtroEspecialidad) : [];
  const listaHorarios = reporte?.mapa_calor?.[0] ? Object.keys(reporte.mapa_calor[0].horas).sort() : [];

  return (
    <div style={s.contenedor}>
      <h1 style={s.titulo}>Reportes Estadísticos</h1>
      <p style={s.bajada}>Métricas consolidadas de rendimiento del centro, concurrencia de alumnos e ingresos brutos por planes.</p>

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

      {reporte && (
        <div style={{ ...s.cardFiltros, background: 'var(--color-primario-suave, #f0fbfb)', border: '1px solid var(--color-primario)', marginTop: '-16px' }}>
          <div style={s.grupo}>
            <label style={{ ...s.label, color: 'var(--color-primario-oscuro)', fontWeight: '700' }} htmlFor="filtroEsp">🎯 Filtrar Segmento Operativo / Especialidad</label>
            <select id="filtroEsp" style={s.select} value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
              <option value="">Mostrar todo (Perspectiva Global)</option>
              {opcionesEspecialidades.map((op, i) => <option key={i} value={op}>{op}</option>)}
            </select>
          </div>
        </div>
      )}

      {errorValidacion && <div style={s.error}>{errorValidacion}</div>}

      {reporte && (
        <>
          {/* Tarjetas de Resumen Global */}
          <div style={s.gridResumen}>
            <div style={s.tarjetaMini}><span style={s.labelMini}>Nuevos Registros</span><p style={s.valorMini}>{reporte.resumen.nuevos_registros}</p></div>
            <div style={s.tarjetaMini}><span style={s.labelMini}>Ingresos por Planes</span><p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>${Number(reporte.resumen.ingresos_totales).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p></div>
            <div style={s.tarjetaMini}><span style={s.labelMini}>Cuentas Suspendidas Activas</span><p style={{ ...s.valorMini, color: '#dc2626' }}>{reporte.resumen.clientes_suspendidos}</p></div>
            <div style={s.tarjetaMini}><span style={s.labelMini}>Tasa de Ausentismo Promedio</span><p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>{reporte.resumen.tasa_ausentismo}%</p></div>
          </div>

          {/* BANNER GRANDE: Notificación de Filtro Aplicado */}
          {filtroEspecialidad && (
            <div style={s.bannerFiltroActivo}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#166534', letterSpacing: '-0.3px' }}>
                🎯 Especialidad Seleccionada: {filtroEspecialidad}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                Estadísticas específicas de esta especialidad aplicadas de forma estricta en el Dashboard.
              </p>
            </div>
          )}

          {/* Rendimiento por Especialidad */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Rendimiento por Especialidad / Tipo de Clase
              {filtroEspecialidad && <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span>}
            </h2>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginTop: '24px', marginBottom: '8px', color: 'var(--color-primario-oscuro)' }}>1. Control de Concurrencia y Cancelaciones</h3>
            <div style={s.wrapperTabla}>
              <table style={s.tabla}>
                <thead>
                  <tr>
                    <th style={s.thOrdenable} onClick={() => cambiarOrden('tipo', sortConcurrencia, setSortConcurrencia)}>Especialidad{renderFlecha('tipo', sortConcurrencia)}</th>
                    <th style={s.thOrdenable} onClick={() => cambiarOrden('asistencias_totales', sortConcurrencia, setSortConcurrencia)}>Asistencias Totales{renderFlecha('asistencias_totales', sortConcurrencia)}</th>
                    <th style={s.thOrdenable} onClick={() => cambiarOrden('asistencias_fijas', sortConcurrencia, setSortConcurrencia)}>Asistencias Fijas{renderFlecha('asistencias_fijas', sortConcurrencia)}</th>
                    <th style={s.thOrdenable} onClick={() => cambiarOrden('asistencias_individuales', sortConcurrencia, setSortConcurrencia)}>Asistencias Indiv.{renderFlecha('asistencias_individuales', sortConcurrencia)}</th>
                    <th style={s.thOrdenable} onClick={() => cambiarOrden('cancelaciones_fijas', sortConcurrencia, setSortConcurrencia)}>Cancelaciones Fijas{renderFlecha('cancelaciones_fijas', sortConcurrencia)}</th>
                    <th style={s.thOrdenable} onClick={() => cambiarOrden('cancelaciones_individuales', sortConcurrencia, setSortConcurrencia)}>Cancelaciones Indiv.{renderFlecha('cancelaciones_individuales', sortConcurrencia)}</th>
                    <th style={s.thOrdenable} onClick={() => cambiarOrden('porcentaje_cancelacion', sortConcurrencia, setSortConcurrencia)}>Porcentaje de Cancelación{renderFlecha('porcentaje_cancelacion', sortConcurrencia)}</th>
                  </tr>
                </thead>
                <tbody>
                  {clasesConcurrenciaOrdenadas.map((c, idx) => {
                    const matches = !filtroEspecialidad || c.tipo === filtroEspecialidad;
                    return (
                      <tr key={idx} style={{ opacity: matches ? 1 : 0.25, transition: 'opacity 0.2s', background: filtroEspecialidad && matches ? '#f0fdf4' : 'transparent' }}>
                        <td style={s.td}><strong>{c.tipo}</strong></td>
                        <td style={s.td}><strong>{c.asistencias_fijas + c.asistencias_individuales}</strong></td>
                        <td style={s.td}>{c.asistencias_fijas}</td>
                        <td style={s.td}>{c.asistencias_individuales}</td>
                        <td style={s.td}>{c.cancelaciones_fijas}</td>
                        <td style={s.td}>{c.cancelaciones_individuales}</td>
                        <td style={s.td}><span style={{ ...s.badgePorcentaje, background: '#fef2f2', color: '#991b1b' }}>{c.porcentaje_cancelacion}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ margin: '32px 0 24px 0', borderTop: '1px dashed var(--color-borde)' }} />

            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-secundario-oscuro)' }}>2. Planificación de Oferta y Aprovechamiento de Cupos Iniciales</h3>
            <div style={s.wrapperTabla}>
              <table style={s.tabla}>
                <thead>
                  <tr>
                    <th style={s.thOrdenable} onClick={() => cambiarOrden('tipo', sortOferta, setSortOferta)}>Especialidad{renderFlecha('tipo', sortOferta)}</th>
                    <th style={s.thOrdenable} onClick={() => cambiarOrden('cant_fijas', sortOferta, setSortOferta)}>Clases Fijas Ofertadas{renderFlecha('cant_fijas', sortOferta)}</th>
                    <th style={s.thOrdenable} onClick={() => cambiarOrden('cupos_iniciales_fijas', sortOferta, setSortOferta)}>Cupos Iniciales Fijos{renderFlecha('cupos_iniciales_fijas', sortOferta)}</th>
                    <th style={s.thOrdenable} onClick={() => cambiarOrden('ocupacion_fijas', sortOferta, setSortOferta)}>Ocupación Fijas{renderFlecha('ocupacion_fijas', sortOferta)}</th>
                    <th style={s.thOrdenable} onClick={() => cambiarOrden('cant_individuales', sortOferta, setSortOferta)}>Clases Indiv. Ofertadas{renderFlecha('cant_individuales', sortOferta)}</th>
                    <th style={s.thOrdenable} onClick={() => cambiarOrden('cupos_iniciales_indiv', sortOferta, setSortOferta)}>Cupos Iniciales Indiv.{renderFlecha('cupos_iniciales_indiv', sortOferta)}</th>
                    <th style={s.thOrdenable} onClick={() => cambiarOrden('ocupacion_indiv', sortOferta, setSortOferta)}>Ocupación Individuales{renderFlecha('ocupacion_indiv', sortOferta)}</th>
                  </tr>
                </thead>
                <tbody>
                  {clasesOfertaOrdenadas.map((c, idx) => {
                    const matches = !filtroEspecialidad || c.tipo === filtroEspecialidad;
                    return (
                      <tr key={idx} style={{ opacity: matches ? 1 : 0.25, transition: 'opacity 0.2s', background: filtroEspecialidad && matches ? '#f0fdf4' : 'transparent' }}>
                        <td style={s.td}><strong>{c.tipo}</strong></td>
                        <td style={s.td}>{c.cant_fijas}</td>
                        <td style={s.td}>{c.cupos_iniciales_fijas} lugares</td>
                        <td style={s.td}><span style={s.badgePorcentaje}>{c.ocupacion_fijas}%</span></td>
                        <td style={s.td}>{c.cant_individuales}</td>
                        <td style={s.td}>{c.cupos_iniciales_indiv} lugares</td>
                        <td style={s.td}><span style={s.badgePorcentaje}>{c.ocupacion_indiv}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MAPA DE CALOR 1: Concurrencia de Alumnos */}
          {reporte.mapa_calor && (
            <div style={s.seccionReporte}>
              <h2 style={s.subtitulo}>
                Mapa de Calor: Concurrencia de Alumnos (Grid)
                {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
              </h2>
              <p style={s.bajada}>Ocupación real basada en el flujo de asistencia sobre cupos ofertados (08:00 a 20:00 hs).</p>
              <div style={s.wrapperTabla}>
                <div style={s.gridCalorDinamico(listaHorarios.length)}>
                  <div style={s.celdaCalorCabecera}>Día / Módulo</div>
                  {listaHorarios.map((h, i) => <div key={i} style={s.celdaCalorCabecera}>{h} hs</div>)}
                  {reporte.mapa_calor.map((row, i) => (
                    <React.Fragment key={i}>
                      <div style={s.celdaCalorDia}><strong>{row.dia}</strong></div>
                      {listaHorarios.map((h, idx) => {
                        const cellData = row.horas[h];
                        const valorPct = filtroEspecialidad ? (cellData?.[filtroEspecialidad] ?? 0.0) : (cellData?.general ?? 0.0);
                        return <div key={idx} style={s.celdaBloque(valorPct)}>{valorPct}%</div>;
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MAPA DE CALOR 2: Uso de Infraestructura de Aulas (NUEVO) */}
          {reporte.mapa_infraestructura && (
            <div style={s.seccionReporte}>
              <h2 style={s.subtitulo}>
                Mapa de Calor: Ocupación de Infraestructura (Aulas)
                <span style={s.badgeGlobalTitulo}>Global (Fijo)</span>
              </h2>
              <p style={s.bajada}>Porcentaje de espacios físicos (salas) comprometidos con clases asignadas del total del centro, sin importar especialidad.</p>
              <div style={s.wrapperTabla}>
                <div style={s.gridCalorDinamico(listaHorarios.length)}>
                  <div style={s.celdaCalorCabecera}>Día / Módulo</div>
                  {listaHorarios.map((h, i) => <div key={i} style={s.celdaCalorCabecera}>{h} hs</div>)}
                  {reporte.mapa_infraestructura.map((row, i) => (
                    <React.Fragment key={i}>
                      <div style={s.celdaCalorDia}><strong>{row.dia}</strong></div>
                      {listaHorarios.map((h, idx) => {
                        const valorPct = row.horas[h] ?? 0.0;
                        return <div key={idx} style={s.celdaBloque(valorPct)}>{valorPct}%</div>;
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ocupación de Salas y Concurrencia de Profesores (Enmascaramiento Dinámico) */}
          <div style={s.gridDividido}>
            <div style={s.seccionReporte}>
              <h2 style={s.subtitulo}>
                Ocupación de Salas
                {filtroEspecialidad && <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span>}
              </h2>
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('aula', sortSalas, setSortSalas)}>Espacio Físico{renderFlecha('aula', sortSalas)}</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('capacidad_maxima', sortSalas, setSortSalas)}>Capacidad Máxima{renderFlecha('capacidad_maxima', sortSalas)}</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('porcentaje_ocupacion', sortSalas, setSortSalas)}>Ocupación Promedio{renderFlecha('porcentaje_ocupacion', sortSalas)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salasOrdenadas.map((a, i) => {
                      const pctRender = filtroEspecialidad ? (a.por_especialidad?.[filtroEspecialidad] ?? 0.0) : a.porcentaje_ocupacion;
                      // CORREGIDO: Enmascara con opacidad si esa sala no se usa para la especialidad seleccionada
                      const matchesFiltro = !filtroEspecialidad || pctRender > 0;
                      
                      return (
                        <tr key={i} style={{ opacity: matchesFiltro ? 1 : 0.25, transition: 'opacity 0.2s', background: filtroEspecialidad && matchesFiltro ? '#f0fdf4' : 'transparent' }}>
                          <td style={s.td}>{a.aula}</td>
                          <td style={s.td}>{a.capacidad_maxima} alumnos</td>
                          <td style={s.td}><span style={s.badgePorcentaje}>{pctRender}%</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={s.seccionReporte}>
              <h2 style={s.subtitulo}>
                Concurrencia de Profesores
                {filtroEspecialidad && <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span>}
              </h2>
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('nombre', sortProfesores, setSortProfesores)}>Kinesiólogo{renderFlecha('nombre', sortProfesores)}</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('total_alumnos_atendidos', sortProfesores, setSortProfesores)}>Alumnos Atendidos{renderFlecha('total_alumnos_atendidos', sortProfesores)}</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('total_cancelaciones_recibidas', sortProfesores, setSortProfesores)}>Ausencias{renderFlecha('total_cancelaciones_recibidas', sortProfesores)}</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('porcentaje_ocupacion_clases', sortProfesores, setSortProfesores)}>Uso de Cupos{renderFlecha('porcentaje_ocupacion_clases', sortProfesores)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profesoresOrdenados.map((p, i) => {
                      const atendidos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.atendidos ?? 0) : p.total_alumnos_atendidos;
                      const cancelados = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cancelados ?? 0) : p.total_cancelaciones_recibidas;
                      const cupos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.uso_cupos ?? 0.0) : p.porcentaje_ocupacion_clases;
                      // CORREGIDO: Enmascara con opacidad si el profesor no da clases en esta especialidad
                      const matchesFiltro = !filtroEspecialidad || cupos > 0;
                      
                      return (
                        <tr key={i} style={{ opacity: matchesFiltro ? 1 : 0.25, transition: 'opacity 0.2s', background: filtroEspecialidad && matchesFiltro ? '#f0fdf4' : 'transparent' }}>
                          <td style={s.td}><strong>{p.nombre}</strong></td>
                          <td style={s.td}>{atendidos}</td>
                          <td style={s.td}>{cancelados}</td>
                          <td style={s.td}><span style={{ ...s.badgePorcentaje, background: '#eff6ff', color: '#1d4ed8' }}>{cupos}%</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Comparativas de Evolución Mensual (Fijo/Global) */}
          {reporte.evolucion_temporal?.datos?.length > 0 && (
            <div style={s.gridDividido}>
              <div style={s.seccionReporte}>
                <h2 style={s.subtitulo}>Evolución: Ocupación de Salas</h2>
                <div style={s.contenedorGrafico}>
                  {reporte.evolucion_temporal.datos.map((d, i) => (
                    <div key={i} style={s.columnaBarra}>
                      <div style={s.barraFisica(d.ocupacion_salas_especialidades, 'linear-gradient(180deg, var(--color-primario), #a5f3fc)')}><span style={s.tooltipVolatil}>{d.ocupacion_salas_especialidades}%</span></div>
                      <span style={s.etiquetaX}>{d.etiqueta}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={s.seccionReporte}>
                <h2 style={s.subtitulo}>Evolución: Uso de Cupos (Profesores)</h2>
                <div style={s.contenedorGrafico}>
                  {reporte.evolucion_temporal.datos.map((d, i) => (
                    <div key={i} style={s.columnaBarra}>
                      <div style={s.barraFisica(d.uso_cupos_profesores, 'linear-gradient(180deg, var(--color-secundario), #fde68a)')}><span style={s.tooltipVolatil}>{d.uso_cupos_profesores}%</span></div>
                      <span style={s.etiquetaX}>{d.etiqueta}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sanciones Vigentes (Al final de todo y Fijo/Global) */}
          <div style={s.seccionReporte}>
            <h2 style={{ ...s.subtitulo, color: '#b91c1c' }}>🚫 Auditoría de Clientes Penalizados Vigentes</h2>
            <p style={s.label}>Listado detallado de los usuarios con suspensiones activas en el sistema, motivos de la sanción y fecha de vigencia.</p>
            <div style={s.wrapperTabla}>
              <table style={s.tabla}>
                <thead>
                  <tr>
                    <th style={{ ...s.thOrdenable, background: '#fef2f2', color: '#991b1b', cursor: 'default' }}>Nombre Completo</th>
                    <th style={{ ...s.thOrdenable, background: '#fef2f2', color: '#991b1b', cursor: 'default' }}>Motivo de la Suspensión</th>
                    <th style={{ ...s.thOrdenable, background: '#fef2f2', color: '#991b1b', width: '180px', cursor: 'default' }}>Inicio de Suspensión</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.sancionados?.map((user, idx) => (
                    <tr key={idx}>
                      <td style={s.td}><strong>{user.nombre}</strong></td>
                      <td style={{ ...s.td, color: 'var(--color-texto-suave)', fontSize: '13px', lineHeight: '1.4' }}>{user.motivo}</td>
                      <td style={s.td}><span style={{ display: 'inline-block', padding: '4px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>📅 {user.fecha_inicio}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}