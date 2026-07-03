import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStatisticsReport } from '../../../services/reportsService';
import { s } from './reportesStyles';

export default function ClientesReportes() {
  const navigate = useNavigate();
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');

  // Estados de ordenamiento para las tablas
  const [sortConcurrencia, setSortConcurrencia] = useState({ llave: null, direccion: 'asc' });
  const [sortOferta, setSortOferta] = useState({ llave: null, direccion: 'asc' });

  const formatearFecha = (d) => {
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  };

  // Atajos rápidos de fecha
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
    setErrorValidacion(''); 
    setReporte(null); 
    setFiltroEspecialidad('');
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
    if (!fechaInicio || !fechaFin) { 
      setErrorValidacion('Por favor, selecciona ambas fechas para continuar.'); 
      return; 
    }
    if (fechaInicio > fechaFin) {
      setErrorValidacion('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }
    consultarFechas(fechaInicio, fechaFin);
  };

  // Funciones de ordenamiento
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
  const listaHorarios = reporte?.mapa_calor?.[0] ? Object.keys(reporte.mapa_calor[0].horas).sort() : [];

  return (
    <div style={s.contenedor}>
      {/* Título con botón de Atrás al HUB */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
        <h1 style={{ ...s.titulo, marginBottom: 0 }}>Control de Clientes y Asistencias</h1>
        <button 
          style={{ ...s.boton, background: '#e2e8f0', color: '#0f172a', border: '1px solid #cbd5e1' }} 
          onClick={() => navigate('/admin/reportes')}
        >
          ← Volver al Hub
        </button>
      </div>
      <p style={s.bajada}>Monitoreo del comportamiento de los alumnos y la deserción.</p>

      {/* Atajos Rápidos */}
      <div style={s.contenedorPills}>
        <button type="button" onClick={setearUltimaSemana} style={s.pillRapida} disabled={cargando}>Última semana</button>
        <button type="button" onClick={setearUltimoMes} style={s.pillRapida} disabled={cargando}>Último mes</button>
        <button type="button" onClick={setearUltimoAnio} style={s.pillRapida} disabled={cargando}>Último año</button>
      </div>

      {/* Formulario con validación */}
      <div style={s.cardFiltros}>
        <form onSubmit={manejarGeneracionManual} style={s.filaFiltros}>
          <div style={s.grupo}>
            <label style={s.label} htmlFor="fechaInicio">Fecha de inicio</label>
            <input id="fechaInicio" type="date" style={s.input} value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
          </div>
          <div style={s.grupo}>
            <label style={s.label} htmlFor="fechaFin">Fecha de fin</label>
            <input id="fechaFin" type="date" style={s.input} value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
          </div>
          <button type="submit" style={cargando ? s.botonCargando : s.boton} disabled={cargando}>
            {cargando ? 'Generando...' : 'Generar Reporte'}
          </button>
        </form>
      </div>

      {errorValidacion && <div style={s.error}>{errorValidacion}</div>}

      {reporte && (
        <>
          {/* Tarjetas Resumen */}
          <div style={s.gridResumen}>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Tasa Ausentismo Promedio</span>
              <p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>{reporte.resumen.tasa_ausentismo}%</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Nuevos Registros</span>
              <p style={s.valorMini}>{reporte.resumen.nuevos_registros}</p>
            </div>
          </div>

          {/* Filtro de Especialidad */}
          <div style={{ ...s.cardFiltros, background: 'var(--color-primario-suave, #f0fbfb)', border: '1px solid var(--color-primario)' }}>
            <div style={s.grupo}>
              <label style={{ ...s.label, color: 'var(--color-primario-oscuro)', fontWeight: '700' }} htmlFor="filtroEsp">Filtrar Segmento Operativo / Especialidad</label>
              <select id="filtroEsp" style={s.select} value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
                <option value="">Mostrar todo (Perspectiva Global)</option>
                {opcionesEspecialidades.map((op, i) => <option key={i} value={op}>{op}</option>)}
              </select>
            </div>
          </div>

          {filtroEspecialidad && (
            <div style={s.bannerFiltroActivo}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#166534', letterSpacing: '-0.3px' }}>
                Especialidad Seleccionada: {filtroEspecialidad}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                Estadísticas específicas de esta especialidad aplicadas de forma estricta en el Dashboard.
              </p>
            </div>
          )}

          {/* Rendimiento por Especialidad (Tablas) */}
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

            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-primario-oscuro)' }}>2. Planificación de Oferta y Aprovechamiento de Cupos Iniciales</h3>
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

          {/* Sancionados Originales */}
          <div style={s.seccionReporte}>
            <h2 style={{ ...s.subtitulo, color: '#b91c1c' }}>Cuentas Suspendidas por Inasistencia</h2>
            <div style={s.wrapperTabla}>
              <table style={s.tabla}>
                <thead>
                  <tr>
                    <th style={{ ...s.thOrdenable, background: '#fef2f2', color: '#991b1b', cursor: 'default' }}>Nombre</th>
                    <th style={{ ...s.thOrdenable, background: '#fef2f2', color: '#991b1b', cursor: 'default' }}>Motivo de la Suspensión</th>
                    <th style={{ ...s.thOrdenable, background: '#fef2f2', color: '#991b1b', cursor: 'default' }}>Inicio</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.sancionados?.map((user, idx) => (
                    <tr key={idx}>
                      <td style={s.td}><strong>{user.nombre}</strong></td>
                      <td style={s.td}>{user.motivo}</td>
                      <td style={s.td}><span style={s.badgePorcentaje}>{user.fecha_inicio}</span></td>
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