import React, { useState } from 'react';
import { getStatisticsReport } from '../../../services/reportsService';
import { s } from './reportesStyles';

export default function SalasReportes() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');

  const consultarFechas = async (e) => {
    e.preventDefault();
    const data = await getStatisticsReport(fechaInicio, fechaFin);
    setReporte(data);
  };

  const opcionesEspecialidades = reporte?.clase ? [...new Set(reporte.clase.map(c => c.tipo))].sort() : [];
  const listaHorarios = reporte?.mapa_calor?.[0] ? Object.keys(reporte.mapa_calor[0].horas).sort() : [];

  return (
    <div style={s.contenedor}>
      <h1 style={s.titulo}>Logística de Salas y Actividades</h1>
      
      <div style={s.cardFiltros}>
        <form onSubmit={consultarFechas} style={s.filaFiltros}>
          <div style={s.grupo}><input type="date" style={s.input} value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} /></div>
          <div style={s.grupo}><input type="date" style={s.input} value={fechaFin} onChange={e => setFechaFin(e.target.value)} /></div>
          <button type="submit" style={s.boton}>Cargar Mapas</button>
        </form>
      </div>

      {reporte && (
        <>
          <div style={{ ...s.cardFiltros, background: '#f0fbfb' }}>
            <div style={s.grupo}>
              <label style={s.label}>🎯 Filtrar Especialidad</label>
              <select style={s.select} value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
                <option value="">Mostrar todo (Global)</option>
                {opcionesEspecialidades.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>
          </div>

          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>Mapa de Calor: Ocupación (Aulas)</h2>
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
          </div>

          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>Ocupación Fija por Sala</h2>
            <table style={s.tabla}>
              <thead><tr><th style={s.thOrdenable}>Espacio</th><th style={s.thOrdenable}>Ocupación Promedio</th></tr></thead>
              <tbody>
                {reporte.ocupacion_aulas?.map((a, i) => {
                  const pctRender = filtroEspecialidad ? (a.por_especialidad?.[filtroEspecialidad] ?? 0) : a.porcentaje_ocupacion;
                  const usosRender = filtroEspecialidad ? (a.por_especialidad?.[`${filtroEspecialidad}_cantidad_usos`] ?? 0) : a.cantidad_usos;
                  const matches = !filtroEspecialidad || pctRender > 0;
                  return (
                    <tr key={i} style={{ opacity: matches ? 1 : 0.25, background: filtroEspecialidad && matches ? '#f0fdf4' : 'transparent' }}>
                      <td style={s.td}>{a.aula}</td>
                      <td style={s.td}><span style={s.badgePorcentaje}>{pctRender}%</span> ({usosRender} usos)</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}