import React, { useState } from 'react';
import { getStatisticsReport } from '../../../services/reportsService';
import { s } from './reportesStyles';

export default function FinanzasReportes() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);

  const consultarFechas = async (e) => {
    e.preventDefault();
    setCargando(true);
    const data = await getStatisticsReport(fechaInicio, fechaFin);
    setReporte(data);
    setCargando(false);
  };

  return (
    <div style={s.contenedor}>
      <h1 style={s.titulo}>Reporte Financiero y Pagos</h1>
      <p style={s.bajada}>Control de caja, contabilidad e ingresos por planes.</p>

      <div style={s.cardFiltros}>
        <form onSubmit={consultarFechas} style={s.filaFiltros}>
          <div style={s.grupo}>
            <label style={s.label}>Fecha inicio</label>
            <input type="date" style={s.input} value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
          </div>
          <div style={s.grupo}>
            <label style={s.label}>Fecha fin</label>
            <input type="date" style={s.input} value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
          </div>
          <button type="submit" style={s.boton}>{cargando ? 'Analizando...' : 'Ver Finanzas'}</button>
        </form>
      </div>

      {reporte && (
        <div style={s.gridResumen}>
          <div style={s.tarjetaMini}>
            <span style={s.labelMini}>Ingresos por Planes (Rango)</span>
            <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>${Number(reporte.resumen.ingresos_totales).toLocaleString('es-AR')}</p>
          </div>
        </div>
        /* Aquí irán los futuros gráficos de Mercado Pago vs Efectivo */
      )}
    </div>
  );
}