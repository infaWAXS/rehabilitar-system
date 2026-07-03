import React, { useState } from 'react';
import { getStatisticsReport } from '../../../services/reportsService';
import { s } from './reportesStyles';
import ReportesHeader from './components/ReportesHeader';
import ReportesExportar from './components/ReportesExportar';
import ReportesEmptyState from './components/ReportesEmptyState';

export default function FinanzasReportes() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');

  const consultarFechas = async (inicio, fin) => {
    setErrorValidacion(''); 
    setReporte(null);
    try {
      setCargando(true);
      const data = await getStatisticsReport(inicio, fin);
      setReporte(data);
    } catch (err) {
      setErrorValidacion(err.message || 'No se pudo procesar el reporte financiero.');
    } finally {
      setCargando(false);
    }
  };

  const manejarGeneracionManual = (e) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin) { 
      setErrorValidacion('Selecciona ambas fechas para continuar.'); 
      return; 
    }
    if (fechaInicio > fechaFin) { 
      setErrorValidacion('La fecha de inicio no puede ser posterior a la fecha de fin.'); 
      return; 
    }
    consultarFechas(fechaInicio, fechaFin);
  };

  // Validamos si hay ingresos en el rango total o en el desglose mensual
  const hayDatos = reporte && (
    reporte.resumen.ingresos_totales > 0 || 
    (reporte.evolucion_temporal?.datos && reporte.evolucion_temporal.datos.some(d => d.ingresos_brutos > 0))
  );

  return (
    <div style={s.contenedor}>
      
      {/* 1. CABECERA MODULAR */}
      <ReportesHeader 
        titulo="Reporte Financiero y Pagos"
        bajada="Control de caja, contabilidad e ingresos por planes."
        fechaInicio={fechaInicio}
        setFechaInicio={setFechaInicio}
        fechaFin={fechaFin}
        setFechaFin={setFechaFin}
        manejarSubmit={manejarGeneracionManual}
        cargando={cargando}
        errorValidacion={errorValidacion}
        consultarFechas={consultarFechas}
      />

      {reporte && (
        <>
          {/* 2. EMPTY STATE */}
          {!hayDatos && (
            <ReportesEmptyState entidad="ingresos financieros ni ventas de planes" filtroEspecialidad="" />
          )}

          {/* 3. MÓDULOS DE DATOS */}
          {hayDatos && (
            <>
              {/* Tarjetas de Resumen Financiero */}
              <div style={s.gridResumen}>
                <div style={s.tarjetaMini}>
                  <span style={s.labelMini}>Ingresos por Planes (Rango)</span>
                  <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>
                    ${Number(reporte.resumen.ingresos_totales).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {/* Dejamos el espacio listo para el balance de suscripciones activas vs vencidas */}
                <div style={{ ...s.tarjetaMini, background: '#f8fafc', border: '1px dashed var(--color-borde)', justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-texto-suave)' }}>+ Balance de Suscripciones (Próximamente)</span>
                </div>
              </div>

              {/* Evolución Financiera Mensual (Conectado a BD) */}
              <div style={s.seccionReporte}>
                <h2 style={s.subtitulo}>Evolución Financiera Mensual</h2>
                <p style={s.bajada}>Ganancias brutas generadas por mes vinculadas al historial de planes.</p>
                
                <div style={s.contenedorGrafico}>
                  {reporte.evolucion_temporal?.datos && (() => {
                    const datosMeses = reporte.evolucion_temporal.datos;
                    const maxIngreso = Math.max(...datosMeses.map(d => d.ingresos_brutos), 1); 

                    return datosMeses.map((d, i) => {
                      const alturaPorcentaje = (d.ingresos_brutos / maxIngreso) * 100;
                      const textoTooltip = d.ingresos_brutos >= 1000 
                        ? `$${(d.ingresos_brutos / 1000).toFixed(0)}k` 
                        : `$${d.ingresos_brutos}`;

                      return (
                        <div key={i} style={s.columnaBarra}>
                          <div style={s.barraFisica(alturaPorcentaje, 'linear-gradient(180deg, #10b981, #a7f3d0)')}>
                            <span style={s.tooltipVolatil}>{textoTooltip}</span>
                          </div>
                          <span style={s.etiquetaX}>{d.mes_corto}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Mockup visual para el cruce de Métodos de Pago */}
              <div style={s.seccionReporte}>
                <h2 style={s.subtitulo}>Cruce de Ingresos: Digital vs Efectivo</h2>
                <p style={s.bajada}>Comparativa de ingresos automatizados (Mercado Pago / Tarjeta) frente a cobros manuales en caja.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '24px' }}>
                  <div style={{ padding: '24px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1d4ed8', display: 'block', marginBottom: '8px' }}>PAGOS DIGITALES (MP)</span>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#1e3a8a' }}>$0,00</p>
                    <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>0 transacciones registradas</span>
                  </div>
                  <div style={{ padding: '24px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', display: 'block', marginBottom: '8px' }}>EFECTIVO (CAJA)</span>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#166534' }}>
                      ${Number(reporte.resumen.ingresos_totales).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                    <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600' }}>El 100% de la facturación actual</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 4. EXPORTACIÓN MODULAR */}
          <ReportesExportar tipoReporte="Financieros" />
        </>
      )}
    </div>
  );
}