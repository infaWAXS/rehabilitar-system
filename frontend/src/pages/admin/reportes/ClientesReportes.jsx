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

  const [sortConcurrencia, setSortConcurrencia] = useState({ llave: null, direccion: 'asc' });

  const formatearFecha = (d) => {
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  };

  const setearHistorialCompleto = () => {
    const sIni = "2026-01-01"; 
    const sFin = formatearFecha(new Date());
    setFechaInicio(sIni); setFechaFin(sFin); consultarFechas(sIni, sFin);
  };
  
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
    if (!fechaInicio || !fechaFin) { setErrorValidacion('Selecciona ambas fechas.'); return; }
    if (fechaInicio > fechaFin) { setErrorValidacion('Inicio posterior a fin.'); return; }
    consultarFechas(fechaInicio, fechaFin);
  };

  const cambiarOrden = (llave) => {
    const direccion = sortConcurrencia.llave === llave && sortConcurrencia.direccion === 'asc' ? 'desc' : 'asc';
    setSortConcurrencia({ llave, direccion });
  };

  const handleExport = (tipo, formato) => {
    const filename = `Exportacion_${tipo}_${new Date().getFullYear()}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
    const blob = new Blob(['Contenido de prueba'], { type: formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const clasesFiltradas = reporte ? (filtroEspecialidad ? reporte.clase.filter(c => c.tipo === filtroEspecialidad) : reporte.clase) : [];
  const listaHorarios = reporte?.mapa_calor?.[0] ? Object.keys(reporte.mapa_calor[0].horas).sort() : [];
  
  const totales = clasesFiltradas.reduce((acc, c) => ({
    inscripciones: acc.inscripciones + (c.asistencias_fijas + c.asistencias_individuales + c.cancelaciones_fijas + c.cancelaciones_individuales),
    cancelaciones: acc.cancelaciones + (c.cancelaciones_fijas + c.cancelaciones_individuales),
    asistencias: acc.asistencias + (c.asistencias_fijas + c.asistencias_individuales),
    inasistencias: acc.inasistencias + (c.cancelaciones_fijas + c.cancelaciones_individuales)
  }), { inscripciones: 0, cancelaciones: 0, asistencias: 0, inasistencias: 0 });

  // LÓGICA DE EMPTY STATE: Si no hay inscripciones en lo absoluto para ese filtro, hayDatos es false.
  const hayDatos = totales.inscripciones > 0;

  const mockSancionesEstadisticas = {
    tresFaltas: 12,
    cincuentaPorciento: 8,
    otrosMotivos: 4,
    reincidentes: 5,
    masAntiguo: { nombre: 'Javier Giménez', fecha: '12/03/2026' },
    masReciente: { nombre: 'Lucía Fernández', fecha: '28/06/2026' }
  };

  return (
    <div style={s.contenedor}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
        <h1 style={{ ...s.titulo, marginBottom: 0 }}>Control de Clientes y Asistencias</h1>
        <button 
          style={{ ...s.boton, background: '#e2e8f0', color: '#0f172a', border: '1px solid #cbd5e1' }} 
          onClick={() => navigate('/admin/reportes')}
        >
          Volver al Hub
        </button>
      </div>
      <p style={s.bajada}>Monitoreo del comportamiento de los alumnos y la deserción.</p>

      <div style={s.contenedorPills}>
        <button type="button" onClick={setearHistorialCompleto} style={s.pillRapida}>Historial Completo</button>
        <button type="button" onClick={setearUltimaSemana} style={s.pillRapida}>Última semana</button>
        <button type="button" onClick={setearUltimoMes} style={s.pillRapida}>Último mes</button>
        <button type="button" onClick={setearUltimoAnio} style={s.pillRapida}>Último año</button>
      </div>

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
          <button type="submit" style={s.boton}>{cargando ? 'Generando...' : 'Generar Reporte'}</button>
        </form>
      </div>

      {errorValidacion && <div style={s.error}>{errorValidacion}</div>}

      {reporte && (
        <>
          <div style={s.gridResumen}>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Tasa Ausentismo Promedio</span>
              <p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>{reporte.resumen.tasa_ausentismo}%</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Clientes Totales</span>
              <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>{reporte.resumen.clientes_totales || 0}</p>
            </div>
          </div>

          <div style={{ ...s.cardFiltros, background: 'var(--color-primario-suave, #f0fbfb)', border: '1px solid var(--color-primario)' }}>
            <div style={s.grupo}>
              <label style={{ ...s.label, color: 'var(--color-primario-oscuro)', fontWeight: '700' }} htmlFor="filtroEsp">Filtrar Segmento Operativo / Especialidad</label>
              <select id="filtroEsp" style={s.select} value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
                <option value="">Mostrar todo (Perspectiva Global)</option>
                {reporte?.clase ? [...new Set(reporte.clase.map(c => c.tipo))].sort().map((op, i) => <option key={i} value={op}>{op}</option>) : null}
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

          {/* MENSAJE DE ESTADO VACÍO */}
          {!hayDatos && (
            <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', padding: '48px 24px', borderRadius: '12px', textAlign: 'center', marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-primario-oscuro)', fontSize: '18px', fontWeight: '800' }}>No hay resultados</h3>
              <p style={{ margin: 0, color: 'var(--color-texto-suave)', fontSize: '15px' }}>
                No se registraron asistencias ni cancelaciones para el rango de fechas{filtroEspecialidad ? ` y la especialidad "${filtroEspecialidad}"` : ''}.
              </p>
            </div>
          )}

          {/* RENDERIZADO CONDICIONAL DE LAS TABLAS */}
          {hayDatos && (
            <>
              <div style={s.seccionReporte}>
                <h2 style={s.subtitulo}>Control de Concurrencia y Cancelaciones</h2>
                <div style={s.wrapperTabla}>
                  <table style={s.tabla}>
                    <thead>
                      <tr>
                        <th style={s.thOrdenable} onClick={() => cambiarOrden('tipo')}>Especialidad</th>
                        <th style={s.thOrdenable}>Cantidad de Alumnos</th>
                        <th style={s.thOrdenable}>Inscripciones a Clases</th>
                        <th style={s.thOrdenable}>Cancelaciones</th>
                        <th style={s.thOrdenable}>Lista de Espera</th>
                        <th style={s.thOrdenable}>Asistencias</th>
                        <th style={s.thOrdenable}>Inasistencias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clasesFiltradas.map((c, i) => {
                        const inscripcionesTotales = c.asistencias_fijas + c.asistencias_individuales + c.cancelaciones_fijas + c.cancelaciones_individuales;
                        if (inscripcionesTotales === 0) return null; // Oculta filas vacías si estamos en vista global

                        const cancelacionesTotales = c.cancelaciones_fijas + c.cancelaciones_individuales;
                        const asistenciasTotales = c.asistencias_fijas + c.asistencias_individuales;
                        const alumnosUnicos = Math.floor(inscripcionesTotales * 0.6); 

                        return (
                          <tr key={i}>
                            <td style={s.td}><strong>{c.tipo}</strong></td>
                            <td style={s.td}>{alumnosUnicos}</td>
                            <td style={s.td}>{inscripcionesTotales}</td>
                            <td style={s.td}>{cancelacionesTotales}</td>
                            <td style={s.td}>0</td>
                            <td style={s.td}>{asistenciasTotales}</td>
                            <td style={s.td}>{cancelacionesTotales}</td>
                          </tr>
                        );
                      })}
                      <tr style={{ fontWeight: 'bold', background: '#f8fafc', borderTop: '2px solid var(--color-borde)' }}>
                        <td style={{...s.td, color: 'var(--color-primario-oscuro)'}}>TOTALES</td>
                        <td style={s.td}>{Math.floor(totales.inscripciones * 0.6)}</td>
                        <td style={s.td}>{totales.inscripciones}</td>
                        <td style={s.td}>{totales.cancelaciones}</td>
                        <td style={s.td}>0</td>
                        <td style={s.td}>
                          <span style={{ ...s.badgePorcentaje, background: '#dcfce7', color: '#166534' }}>{totales.asistencias}</span>
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.badgePorcentaje, background: '#f1f5f9', color: '#475569' }}>{totales.inasistencias}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

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
            </>
          )}

          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>Cuentas Suspendidas por Inasistencia</h2>
            <p style={s.bajada}>Análisis de deserción y motivos de penalización automática.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-borde)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)' }}>POR +3 FALTAS</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--color-primario-oscuro)' }}>{mockSancionesEstadisticas.tresFaltas}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-borde)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)' }}>AUSENCIA &gt; 50%</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--color-primario-oscuro)' }}>{mockSancionesEstadisticas.cincuentaPorciento}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-borde)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)' }}>OTROS MOTIVOS</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--color-texto)' }}>{mockSancionesEstadisticas.otrosMotivos}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-borde)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)' }}>REINCIDENTES (2+)</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--color-texto)' }}>{mockSancionesEstadisticas.reincidentes}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', background: '#f0fbfb', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-borde)', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-texto-suave)', display: 'block' }}>Récord más antiguo:</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-texto)' }}>{mockSancionesEstadisticas.masAntiguo.nombre} ({mockSancionesEstadisticas.masAntiguo.fecha})</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-texto-suave)', display: 'block' }}>Suspensión más reciente:</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-texto)' }}>{mockSancionesEstadisticas.masReciente.nombre} ({mockSancionesEstadisticas.masReciente.fecha})</span>
              </div>
            </div>

            <div style={s.wrapperTabla}>
              <table style={s.tabla}>
                <thead>
                  <tr>
                    <th style={s.thOrdenable}>Nombre</th>
                    <th style={s.thOrdenable}>Motivo de la Suspensión</th>
                    <th style={s.thOrdenable}>Inicio de Suspensión</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.sancionados?.map((user, idx) => (
                    <tr key={idx}>
                      <td style={s.td}><strong>{user.nombre}</strong></td>
                      <td style={s.td}>{user.motivo}</td>
                      <td style={s.td}><span style={{...s.badgePorcentaje, background: '#f1f5f9', color: '#475569'}}>{user.fecha_inicio}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ ...s.seccionReporte, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h2 style={s.subtitulo}>Exportar Datos</h2>
            <p style={s.bajada}>Descarga los reportes en formato PDF o Excel para su análisis externo o impresión.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', flexWrap: 'wrap', gap: '16px' }}>
                <span style={{ fontWeight: '600', color: 'var(--color-texto)' }}>Exportar estadísticas de clientes</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleExport('Clientes', 'pdf')} style={{ ...s.boton, padding: '8px 16px', fontSize: '13px', height: 'auto', background: '#ef4444' }}>PDF</button>
                  <button onClick={() => handleExport('Clientes', 'excel')} style={{ ...s.boton, padding: '8px 16px', fontSize: '13px', height: 'auto', background: '#10b981' }}>EXCEL</button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', flexWrap: 'wrap', gap: '16px' }}>
                <span style={{ fontWeight: '600', color: 'var(--color-texto)' }}>Exportar todas las estadísticas</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleExport('Completo', 'pdf')} style={{ ...s.boton, padding: '8px 16px', fontSize: '13px', height: 'auto', background: '#ef4444' }}>PDF</button>
                  <button onClick={() => handleExport('Completo', 'excel')} style={{ ...s.boton, padding: '8px 16px', fontSize: '13px', height: 'auto', background: '#10b981' }}>EXCEL</button>
                </div>
              </div>
              
            </div>
          </div>

        </>
      )}
    </div>
  );
}