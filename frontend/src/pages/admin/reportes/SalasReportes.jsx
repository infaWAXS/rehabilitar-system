import React, { useState } from 'react';
import { getRoomsReport } from '../../../services/reportsService';
import { s } from './reportesStyles';
import ReportesHeader from './components/ReportesHeader';
import ReportesExportar from './components/ReportesExportar';
import ReportesEmptyState from './components/ReportesEmptyState';

export default function SalasReportes() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');

  const consultarFechas = async (inicio, fin) => {
    setErrorValidacion(''); setReporte(null); setFiltroEspecialidad('');
    try {
      setCargando(true);
      const data = await getRoomsReport(inicio, fin);
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

  const opcionesEspecialidades = reporte?.ocupacion_aulas?.[0]?.por_especialidad 
    ? Object.keys(reporte.ocupacion_aulas[0].por_especialidad).filter(k => !k.includes('_cantidad_usos')).sort() 
    : [];

  const listaHorarios = reporte?.mapa_calor?.[0]?.horas 
    ? Object.keys(reporte.mapa_calor[0].horas).sort() 
    : [];
  
  const totalUsosGlobal = reporte?.ocupacion_aulas?.reduce((acc, a) => acc + (a.cantidad_usos ?? 0), 0) || 0;
  
  const totalUsosFiltrados = reporte?.ocupacion_aulas?.reduce((acc, a) => {
    const usos = filtroEspecialidad ? (a.por_especialidad?.[`${filtroEspecialidad}_cantidad_usos`] ?? 0) : (a.cantidad_usos ?? 0);
    return acc + usos;
  }, 0) || 0;

  // Filtrado Reactivo para el Top 5
  const topClasesFiltradas = reporte?.top_clases?.filter(c => 
    filtroEspecialidad ? c.especialidad === filtroEspecialidad : true
  ) || [];

  return (
    <div style={s.contenedor}>
      <ReportesHeader 
        titulo="Logística de Salas y Actividades"
        bajada="Optimización del espacio físico y control de ocupación edilicia."
        fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
        fechaFin={fechaFin} setFechaFin={setFechaFin}
        manejarSubmit={manejarGeneracionManual}
        cargando={cargando} errorValidacion={errorValidacion} consultarFechas={consultarFechas}
      />

      {reporte && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Ocupación Promedio de Salas</span>
              <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>{reporte.resumen?.ocupacion_promedio || 0}%</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Salas Reservadas</span>
              <p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>{reporte.resumen?.salas_reservadas || 0}</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Gente en Lista de Espera</span>
              <p style={{ ...s.valorMini, color: '#e11d48' }}>{reporte.resumen?.lista_espera || 0}</p>
            </div>
          </div>

          {/* MAPA 1: INFRAESTRUCTURA (AHORA ARRIBA DE TODO, ANTES DEL FILTRO) */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Mapa de Calor: Ocupación de Infraestructura (Aulas)
              <span style={s.badgeGlobalTitulo}>Global (Fijo)</span>
            </h2>
            <p style={s.bajada}>Cantidad de espacios físicos utilizados sobre el total de aulas disponibles en el rango.</p>
            {totalUsosGlobal > 0 ? (
              <div style={s.wrapperTabla}>
                <div style={s.gridCalorDinamico(listaHorarios.length)}>
                  <div style={s.celdaCalorCabecera}>Día / Módulo</div>
                  {listaHorarios.map(h => <div key={h} style={s.celdaCalorCabecera}>{h} hs</div>)}
                  {reporte.mapa_infraestructura?.map((row, i) => (
                    <React.Fragment key={i}>
                      <div style={s.celdaCalorDia}><strong>{row.dia}</strong></div>
                      {listaHorarios.map((h, idx) => {
                        const valorVisual = row.horas[h] || "0/0"; 
                        let pctColor = 0;
                        if (typeof valorVisual === 'string' && valorVisual.includes('/')) {
                          const [usadas, totales] = valorVisual.split('/').map(Number);
                          pctColor = totales > 0 ? (usadas / totales) * 100 : 0;
                        }
                        return <div key={idx} style={s.celdaBloque(pctColor)}>{valorVisual}</div>;
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <ReportesEmptyState entidad="usos de infraestructura" filtroEspecialidad="" />
            )}
          </div>

          {/* ÁREA DE FILTRO */}
          <div style={{ ...s.cardFiltros, background: 'var(--color-primario-suave, #f0fbfb)', border: '1px solid var(--color-primario)' }}>
            <div style={s.grupo}>
              <label style={{ ...s.label, color: 'var(--color-primario-oscuro)', fontWeight: '700' }} htmlFor="filtroEsp">Filtrar Segmento Operativo / Especialidad</label>
              <select id="filtroEsp" style={s.select} value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
                <option value="">Mostrar todo (Perspectiva Global)</option>
                {opcionesEspecialidades.map((op, i) => <option key={i} value={op}>{op}</option>)}
              </select>
            </div>
          </div>

          {/* TOP CLASES (AHORA FILTRADO Y DEBAJO DEL SELECT) */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Clases con Mayor Ocupación de Salas
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad} (Top 5)</span> : <span style={s.badgeGlobalTitulo}>Global (Top 5)</span>}
            </h2>
            <p style={s.bajada}>Las clases que más llenan el cupo de su aula asignada.</p>
            
            {topClasesFiltradas.length > 0 ? (
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable}>Nombre de la Clase</th>
                      <th style={s.thOrdenable}>Especialidad</th>
                      <th style={s.thOrdenable}>Aula</th>
                      <th style={s.thOrdenable}>Profesor</th>
                      <th style={s.thOrdenable}>Ocupación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClasesFiltradas.slice(0, 5).map((c, i) => (
                      <tr key={i}>
                        <td style={s.td}><strong>{c.nombre_clase}</strong></td>
                        <td style={s.td}>{c.especialidad}</td>
                        <td style={s.td}>{c.aula}</td>
                        <td style={s.td}>{c.profesor}</td>
                        <td style={s.td}>
                          <span style={{ ...s.badgePorcentaje, background: c.ocupacion > 80 ? '#dcfce7' : '#f1f5f9', color: c.ocupacion > 80 ? '#166534' : '#475569' }}>
                            {c.ocupacion}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
               <ReportesEmptyState entidad="clases reservadas" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          {/* TABLA DE SALAS */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Ocupación Fija por Sala (Métricas del Rango Seleccionado)
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
            </h2>
            <p style={s.bajada}>Rendimiento integral del aula cuando esta ha sido reservada.</p>
            {totalUsosFiltrados > 0 ? (
              <table style={s.tabla}>
                <thead>
                  <tr>
                    <th style={s.thOrdenable}>Espacio Físico</th>
                    <th style={s.thOrdenable}>Capacidad</th>
                    <th style={s.thOrdenable}>Usos</th>
                    <th style={s.thOrdenable}>Tasa Reserva</th>
                    <th style={s.thOrdenable}>Ocupación (Anotados)</th>
                    <th style={s.thOrdenable}>Presentismo</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.ocupacion_aulas?.map((a, i) => {
                    const pctRender = filtroEspecialidad ? (a.por_especialidad?.[filtroEspecialidad] ?? 0) : a.porcentaje_ocupacion;
                    const usosRender = filtroEspecialidad ? (a.por_especialidad?.[`${filtroEspecialidad}_cantidad_usos`] ?? 0) : a.cantidad_usos;
                    const matches = !filtroEspecialidad || pctRender > 0;
                    if (!matches && filtroEspecialidad) return null;

                    return (
                      <tr key={i} style={{ background: filtroEspecialidad ? '#f0fdf4' : 'transparent' }}>
                        <td style={s.td}><strong>{a.aula}</strong></td>
                        <td style={s.td}>{a.capacidad}</td>
                        <td style={s.td}>{usosRender}</td>
                        <td style={s.td}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>{a.porcentaje_reserva}%</span>
                        </td>
                        <td style={s.td}>
                          <span style={s.badgePorcentaje}>{pctRender}%</span> 
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.badgePorcentaje, background: '#dcfce7', color: '#166534' }}>{a.porcentaje_presentes}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <ReportesEmptyState entidad="usos de salas" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          <ReportesExportar tipoReporte="Salas" />
        </>
      )}
    </div>
  );
}