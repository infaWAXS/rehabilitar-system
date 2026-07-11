import React, { useState } from 'react';
import { getStaffReport } from '../../../services/reportsService';
import { s } from './reportesStyles';
import ReportesHeader from './components/ReportesHeader';
import ReportesExportar from './components/ReportesExportar';
import ReportesEmptyState from './components/ReportesEmptyState';

export default function StaffReportes() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [sortProfesores, setSortProfesores] = useState({ llave: null, direccion: 'asc' });

  const consultarFechas = async (inicio, fin) => {
    setErrorValidacion(''); setReporte(null); setFiltroEspecialidad('');
    try {
      setCargando(true);
      const data = await getStaffReport(inicio, fin);
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
    const direccion = sortProfesores.llave === llave && sortProfesores.direccion === 'asc' ? 'desc' : 'asc';
    setSortProfesores({ llave, direccion });
  };

  const procesarOrdenamiento = (datos, configuracion, llaveEspecialidad = null) => {
    if (!configuracion.llave) return datos;
    const copia = [...datos];
    copia.sort((a, b) => {
      let valA = a[configuracion.llave]; let valB = b[configuracion.llave];
      if (llaveEspecialidad && configuracion.llave === 'porcentaje_ocupacion_clases') {
        valA = a.por_especialidad?.[llaveEspecialidad]?.uso_cupos ?? 0; 
        valB = b.por_especialidad?.[llaveEspecialidad]?.uso_cupos ?? 0;
      } else if (llaveEspecialidad && configuracion.llave === 'total_alumnos_atendidos') {
        valA = a.por_especialidad?.[llaveEspecialidad]?.atendidos ?? 0; 
        valB = b.por_especialidad?.[llaveEspecialidad]?.atendidos ?? 0;
      } else if (llaveEspecialidad && configuracion.llave === 'total_cancelaciones_recibidas') {
        valA = a.por_especialidad?.[llaveEspecialidad]?.cancelados ?? 0; 
        valB = b.por_especialidad?.[llaveEspecialidad]?.cancelados ?? 0;
      } else if (llaveEspecialidad && configuracion.llave === 'cantidad_clases_dictadas') {
        valA = a.por_especialidad?.[llaveEspecialidad]?.cantidad_clases_dictadas ?? 0; 
        valB = b.por_especialidad?.[llaveEspecialidad]?.cantidad_clases_dictadas ?? 0;
      }
      if (typeof valA === 'string') return configuracion.direccion === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return configuracion.direccion === 'asc' ? valA - valB : valB - valA;
    });
    return copia;
  };

  const opcionesEspecialidades = reporte?.clases_lista ? [...new Set(reporte.clases_lista.map(c => c.tipo))].sort() : [];
  const profesoresOrdenados = reporte ? procesarOrdenamiento(reporte.profesores_mayor_concurrencia, sortProfesores, filtroEspecialidad) : [];
  
  let totalAtendidosGlobal = 0;
  let totalCanceladosGlobal = 0;
  let totalClasesDictadasGlobal = 0;
  let sumaCupos = 0;
  let countProfesConClases = 0;

  profesoresOrdenados.forEach((p) => {
    const atendidos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.atendidos ?? 0) : p.total_alumnos_atendidos;
    const cancelados = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cancelados ?? 0) : p.total_cancelaciones_recibidas;
    const cupos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.uso_cupos ?? 0.0) : p.porcentaje_ocupacion_clases;
    const clasesDictadas = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cantidad_clases_dictadas ?? 0) : p.cantidad_clases_dictadas;
    
    if (clasesDictadas > 0) {
      totalAtendidosGlobal += atendidos;
      totalCanceladosGlobal += cancelados;
      totalClasesDictadasGlobal += clasesDictadas;
      sumaCupos += cupos;
      countProfesConClases++;
    }
  });

  const promedioCuposGlobal = countProfesConClases > 0 ? (sumaCupos / countProfesConClases).toFixed(1) : 0;
  const hayDatos = totalClasesDictadasGlobal > 0;

  const profesoresRetencionFiltrados = reporte?.retencion?.filter(r => {
    return filtroEspecialidad ? r.especialidad === filtroEspecialidad : true;
  }).slice(0, 10);

  const absentismoFiltrado = reporte?.absentismo?.filter(a => {
    return filtroEspecialidad ? a.especialidad === filtroEspecialidad : true;
  }) || [];

  return (
    <div style={s.contenedor}>
      <ReportesHeader 
        titulo="Concurrencia y Performance de Profesores"
        bajada="Auditoría del personal médico, carga de trabajo y rendimiento por cupos."
        fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
        fechaFin={fechaFin} setFechaFin={setFechaFin}
        manejarSubmit={manejarGeneracionManual}
        cargando={cargando} errorValidacion={errorValidacion} consultarFechas={consultarFechas}
      />

      {reporte && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Prof. Tren Superior</span>
              <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>{reporte.resumen?.tren_superior || 0}</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Prof. Tren Inferior</span>
              <p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>{reporte.resumen?.tren_inferior || 0}</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Prof. Tren Medio</span>
              <p style={{ ...s.valorMini, color: '#0f766e' }}>{reporte.resumen?.tren_medio || 0}</p>
            </div>
          </div>

          <div style={{ ...s.cardFiltros, background: 'var(--color-primario-suave, #f0fbfb)', border: '1px solid var(--color-primario)' }}>
            <div style={s.grupo}>
              <label style={{ ...s.label, color: 'var(--color-primario-oscuro)', fontWeight: '700' }} htmlFor="filtroEsp">Filtrar Segmento Operativo / Especialidad</label>
              <select id="filtroEsp" style={s.select} value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
                <option value="">Mostrar todo (Perspectiva Global)</option>
                {opcionesEspecialidades.map((op, i) => <option key={i} value={op}>{op}</option>)}
              </select>
            </div>
          </div>

          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Concurrencia de Profesores
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
            </h2>
            
            {hayDatos ? (
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('nombre')}>Kinesiólogo</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('total_alumnos_atendidos')}>Alumnos Atendidos</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('total_cancelaciones_recibidas')}>Ausencias</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('cantidad_clases_dictadas')}>Clases Dadas</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('porcentaje_ocupacion_clases')}>Uso de Cupos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profesoresOrdenados.map((p, i) => {
                      const atendidos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.atendidos ?? 0) : p.total_alumnos_atendidos;
                      const cancelados = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cancelados ?? 0) : p.total_cancelaciones_recibidas;
                      const cupos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.uso_cupos ?? 0.0) : p.porcentaje_ocupacion_clases;
                      const clasesDictadas = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cantidad_clases_dictadas ?? 0) : p.cantidad_clases_dictadas;
                      
                      const matchesFiltro = !filtroEspecialidad || clasesDictadas > 0;
                      if (!matchesFiltro && filtroEspecialidad) return null;

                      return (
                        <tr key={i} style={{ background: filtroEspecialidad ? '#f0fdf4' : 'transparent' }}>
                          <td style={s.td}><strong>{p.nombre}</strong></td>
                          <td style={s.td}>{atendidos}</td>
                          <td style={s.td}>{cancelados}</td>
                          <td style={s.td}>{clasesDictadas}</td>
                          <td style={s.td}>
                            <span style={{ ...s.badgePorcentaje, background: '#eff6ff', color: '#1d4ed8' }}>{cupos}%</span>
                          </td>
                        </tr>
                      );
                    })}

                    <tr style={{ background: '#f8fafc', borderTop: '2px solid var(--color-borde)', fontWeight: 'bold' }}>
                      <td style={{ ...s.td, color: 'var(--color-primario-oscuro)' }}><strong>Totales / Promedios</strong></td>
                      <td style={s.td}>{totalAtendidosGlobal}</td>
                      <td style={s.td}>{totalCanceladosGlobal}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badgePorcentaje, background: '#e0f2fe', color: '#0369a1' }}>
                          {totalClasesDictadasGlobal}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.badgePorcentaje, background: '#eff6ff', color: '#1d4ed8' }}>
                          {promedioCuposGlobal}%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <ReportesEmptyState entidad="clases dictadas por los profesionales" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Absentismo del Staff (Registro de Faltas)
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
            </h2>
            <p style={s.bajada}>Muestra a los profesionales que tomaron una actividad pero finalizaron dándose de baja (sin volver a recuperarla).</p>
            
            {absentismoFiltrado.length > 0 ? (
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable}>Profesor</th>
                      <th style={s.thOrdenable}>Clase Ausentada</th>
                      <th style={s.thOrdenable}>Fecha Actividad</th>
                      <th style={s.thOrdenable}>Especialidad</th>
                      <th style={s.thOrdenable}>Última Acción (Baja)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentismoFiltrado.map((a, i) => (
                      <tr key={i}>
                        <td style={s.td}><strong>{a.profesor}</strong></td>
                        <td style={s.td}>{a.clase}</td>
                        <td style={s.td}>
                          <span style={{ fontSize: '13px', color: '#475569' }}>{a.fecha_actividad}</span>
                        </td>
                        <td style={s.td}>{a.especialidad}</td>
                        <td style={s.td}>
                          {/* SPLIT POR EL PUNTO DE LOS MILISEGUNDOS */}
                          <span style={{ ...s.badgePorcentaje, background: '#fee2e2', color: '#b91c1c' }}>
                            {a.fecha_baja ? String(a.fecha_baja).split('.')[0] : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ReportesEmptyState entidad="faltas registradas en el personal" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          {reporte?.profesores_eliminados?.length > 0 && (
            <div style={s.seccionReporte}>
              <h2 style={s.subtitulo}>Profesores Dados de Baja (Histórico)</h2>
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable}>Nombre</th>
                      <th style={s.thOrdenable}>Fecha de Baja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.profesores_eliminados.map((p, i) => (
                      <tr key={i}>
                        <td style={s.td}>{p.nombre}</td>
                        <td style={s.td}>{new Date(p.fecha_baja).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Retención de Alumno por Profesor (Clases Fijas)
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Últimas 4 Semanas Fijas</span>}
            </h2>
            <p style={s.bajada}>Mide la consistencia de los alumnos mes a mes en clases estables, independientemente del rango de fechas superior.</p>
            
            {profesoresRetencionFiltrados?.length > 0 ? (
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable}>Profesor</th>
                      <th style={s.thOrdenable}>Clase / Especialidad</th>
                      <th style={s.thOrdenable}>Semana 1</th>
                      <th style={s.thOrdenable}>Semana 2</th>
                      <th style={s.thOrdenable}>Semana 3</th>
                      <th style={s.thOrdenable}>Semana 4</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profesoresRetencionFiltrados.map((r, i) => (
                      <tr key={i}>
                        <td style={s.td}><strong>{r.profesor}</strong></td>
                        <td style={s.td}>{r.clase}</td>
                        <td style={s.td}><span style={{...s.badgePorcentaje, background: '#f1f5f9', color: '#475569'}}>{r.semana_1}</span></td>
                        <td style={s.td}><span style={{...s.badgePorcentaje, background: '#f1f5f9', color: '#475569'}}>{r.semana_2}</span></td>
                        <td style={s.td}><span style={{...s.badgePorcentaje, background: '#f1f5f9', color: '#475569'}}>{r.semana_3}</span></td>
                        <td style={s.td}><span style={{...s.badgePorcentaje, background: '#dcfce7', color: '#166534'}}>{r.semana_4}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ReportesEmptyState entidad="clases fijas para analizar retención" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          <ReportesExportar tipoReporte="Staff" />
        </>
      )}
    </div>
  );
}