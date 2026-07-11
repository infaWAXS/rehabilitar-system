import React, { useState } from 'react';
// IMPORTANTE: Importar la nueva función del servicio
import { getFinancialReport } from '../../../services/reportsService';
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
      // Usamos el nuevo servicio que le pega a /finances
      const data = await getFinancialReport(inicio, fin);
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

  // Validamos si hay ingresos en el rango total o en el desglose
  const hayDatos = reporte && (
    (reporte.finanzas?.ingresos_totales > 0) || 
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={s.tarjetaMini}>
                  <span style={s.labelMini}>Ingresos Totales (Rango)</span>
                  <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>
                    ${Number(reporte.finanzas?.ingresos_totales || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div style={s.tarjetaMini}>
                  <span style={s.labelMini}>Suscripciones Activas (En Rango)</span>
                  <p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>
                    {reporte.finanzas?.suscripciones_activas || 0}
                  </p>
                </div>

                <div style={s.tarjetaMini}>
                  <span style={s.labelMini}>Ingreso Promedio por Cliente</span>
                  <p style={{ ...s.valorMini, color: 'var(--color-texto)' }}>
                    ${Number(reporte.finanzas?.ingreso_promedio || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Evolución Financiera Mensual (Dinámica) */}
              <div style={s.seccionReporte}>
                <h2 style={s.subtitulo}>
                  Evolución Financiera {reporte.evolucion_temporal?.granularidad ? `(${reporte.evolucion_temporal.granularidad})` : ''}
                </h2>
                <p style={s.bajada}>Ganancias brutas generadas en el tiempo, agrupadas según la extensión del rango seleccionado.</p>
                
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

              {/* Cruce de Ingresos: Planes vs Individuales vs Señas */}
              <div style={s.seccionReporte}>
                <h2 style={s.subtitulo}>Cruce de Ingresos y Facturación</h2>
                <p style={s.bajada}>Comparativa del origen de las ganancias en el rango de fechas marcado.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '24px' }}>
                  
                  <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>POR PLANES (SUSCRIPCIONES)</span>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>
                      ${Number(reporte.finanzas?.desglose?.planes || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div style={{ padding: '24px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', display: 'block', marginBottom: '8px' }}>POR CLASES INDIVIDUALES</span>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#166534' }}>
                       ${Number(reporte.finanzas?.desglose?.individuales || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div style={{ padding: '24px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1d4ed8', display: 'block', marginBottom: '8px' }}>POR SEÑAS / RESERVAS</span>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#1e3a8a' }}>
                       ${Number(reporte.finanzas?.desglose?.senas || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
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