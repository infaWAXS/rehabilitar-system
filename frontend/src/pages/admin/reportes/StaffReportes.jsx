import React, { useState } from 'react';
import { getStatisticsReport } from '../../../services/reportsService';
import { s } from './reportesStyles';

export default function StaffReportes() {
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

  return (
    <div style={s.contenedor}>
      <h1 style={s.titulo}>Concurrencia y Performance de Profesores</h1>
      
      <div style={s.cardFiltros}>
        <form onSubmit={consultarFechas} style={s.filaFiltros}>
          <div style={s.grupo}><input type="date" style={s.input} value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} /></div>
          <div style={s.grupo}><input type="date" style={s.input} value={fechaFin} onChange={e => setFechaFin(e.target.value)} /></div>
          <button type="submit" style={s.boton}>Ver Staff</button>
        </form>
      </div>

      {reporte && (
        <div style={s.seccionReporte}>
          <div style={{ marginBottom: '24px' }}>
             <select style={s.select} value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
                <option value="">Todos los profesores</option>
                {opcionesEspecialidades.map(op => <option key={op} value={op}>{op}</option>)}
             </select>
          </div>

          <table style={s.tabla}>
            <thead>
              <tr>
                <th style={s.thOrdenable}>Kinesiólogo</th>
                <th style={s.thOrdenable}>Alumnos Atendidos</th>
                <th style={s.thOrdenable}>Uso de Cupos</th>
              </tr>
            </thead>
            <tbody>
              {reporte.profesores_mayor_concurrencia?.map((p, i) => {
                const atendidos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.atendidos ?? 0) : p.total_alumnos_atendidos;
                const cupos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.uso_cupos ?? 0) : p.porcentaje_ocupacion_clases;
                const clasesDictadas = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cantidad_clases_dictadas ?? 0) : p.cantidad_clases_dictadas;
                const matches = !filtroEspecialidad || cupos > 0;
                
                return (
                  <tr key={i} style={{ opacity: matches ? 1 : 0.25, background: filtroEspecialidad && matches ? '#f0fdf4' : 'transparent' }}>
                    <td style={s.td}><strong>{p.nombre}</strong></td>
                    <td style={s.td}>{atendidos}</td>
                    <td style={s.td}><span style={{...s.badgePorcentaje, background: '#eff6ff', color: '#1d4ed8'}}>{cupos}%</span> ({clasesDictadas} clases)</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}