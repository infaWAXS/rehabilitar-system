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

  const opcionesEspecialidades = reporte?.clase ? [...new Set(reporte.clase.map(c => c.tipo))].sort() : [];
  const listaHorarios = reporte?.mapa_calor?.[0] ? Object.keys(reporte.mapa_calor[0].horas).sort() : [];
  
  // Validaciones separadas
  const totalUsosGlobal = reporte?.ocupacion_aulas?.reduce((acc, a) => acc + (a.cantidad_usos ?? 0), 0) || 0;
  
  const totalUsosFiltrados = reporte?.ocupacion_aulas?.reduce((acc, a) => {
    const usos = filtroEspecialidad ? (a.por_especialidad?.[`${filtroEspecialidad}_cantidad_usos`] ?? 0) : (a.cantidad_usos ?? 0);
    return acc + usos;
  }, 0) || 0;

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
              Mapa de Calor: Ocupación de Infraestructura (Aulas)
              <span style={s.badgeGlobalTitulo}>Global (Fijo)</span>
            </h2>
            <p style={s.bajada}>Porcentaje de espacios físicos utilizados en base a todas las clases dadas.</p>
            {totalUsosGlobal > 0 ? (
              <div style={s.wrapperTabla}>
                <div style={s.gridCalorDinamico(listaHorarios.length)}>
                  <div style={s.celdaCalorCabecera}>Día / Módulo</div>
                  {listaHorarios.map(h => <div key={h} style={s.celdaCalorCabecera}>{h} hs</div>)}
                  {reporte.mapa_infraestructura?.map((row, i) => (
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
            ) : (
              <ReportesEmptyState entidad="usos de infraestructura" filtroEspecialidad="" />
            )}
          </div>

          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Ocupación Fija por Sala
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
            </h2>
            {totalUsosFiltrados > 0 ? (
              <table style={s.tabla}>
                <thead><tr><th style={s.thOrdenable}>Espacio Físico</th><th style={s.thOrdenable}>Ocupación Promedio</th></tr></thead>
                <tbody>
                  {reporte.ocupacion_aulas?.map((a, i) => {
                    const pctRender = filtroEspecialidad ? (a.por_especialidad?.[filtroEspecialidad] ?? 0) : a.porcentaje_ocupacion;
                    const usosRender = filtroEspecialidad ? (a.por_especialidad?.[`${filtroEspecialidad}_cantidad_usos`] ?? 0) : a.cantidad_usos;
                    const matches = !filtroEspecialidad || pctRender > 0;
                    if (!matches && filtroEspecialidad) return null;

                    return (
                      <tr key={i} style={{ background: filtroEspecialidad ? '#f0fdf4' : 'transparent' }}>
                        <td style={s.td}><strong>{a.aula}</strong></td>
                        <td style={s.td}>
                          <span style={s.badgePorcentaje}>{pctRender}%</span> 
                          <span style={{ fontSize: '12px', color: 'var(--color-texto-suave)', marginLeft: '12px', fontWeight: '500' }}>({usosRender} usos)</span>
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