import React, { useState } from 'react';
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
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');

  const consultarFechas = async (inicio, fin) => {
    setErrorValidacion(''); 
    setReporte(null);
    setFiltroEspecialidad('');
    try {
      setCargando(true);
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
    if (!fechaInicio || !fechaFin) { setErrorValidacion('Selecciona ambas fechas para continuar.'); return; }
    if (fechaInicio > fechaFin) { setErrorValidacion('La fecha de inicio no puede ser posterior a la fecha de fin.'); return; }
    consultarFechas(fechaInicio, fechaFin);
  };

  const hayDatos = reporte && (
    (reporte.finanzas?.ingresos_totales > 0) || 
    (reporte.evolucion_temporal?.datos && reporte.evolucion_temporal.datos.some(d => d.ingresos_brutos > 0))
  );

  // ────────────────────────────────────────────────────────────────────────
  // LÓGICA DE FILTRADO REACTIVO
  // ────────────────────────────────────────────────────────────────────────
  const opcionesEspecialidades = reporte?.especialidades?.sort() || [];

  // Tarjetas Superiores y Desglose
  const ingresosPlanesRender = filtroEspecialidad ? 0 : (reporte?.finanzas?.desglose?.planes || 0);
  const ingresosSenasRender = filtroEspecialidad ? 0 : (reporte?.finanzas?.desglose?.senas || 0);
  const ingresosIndivRender = filtroEspecialidad 
    ? (reporte?.finanzas?.desglose?.individuales_por_especialidad?.[filtroEspecialidad] || 0) 
    : (reporte?.finanzas?.desglose?.individuales || 0);
  
  const ingresosTotalesRender = ingresosPlanesRender + ingresosIndivRender + ingresosSenasRender;
  const suscripcionesRender = filtroEspecialidad ? '-' : (reporte?.finanzas?.suscripciones_activas || 0);
  const ingresoPromedioRender = filtroEspecialidad ? '-' : `$${Number(reporte?.finanzas?.ingreso_promedio || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

  // Top Clases (Agrupadas si es global, filtradas si es especialidad)
  let clasesParaMostrar = [];
  if (reporte?.finanzas?.todas_clases) {
    if (filtroEspecialidad) {
      clasesParaMostrar = reporte.finanzas.todas_clases.filter(c => c.especialidad === filtroEspecialidad);
    } else {
      const agrupadoC = {};
      reporte.finanzas.todas_clases.forEach(c => {
        if (!agrupadoC[c.nombre]) agrupadoC[c.nombre] = 0;
        agrupadoC[c.nombre] += c.recaudacion;
      });
      clasesParaMostrar = Object.keys(agrupadoC).map(nombre => ({ nombre, recaudacion: agrupadoC[nombre] }));
    }
    clasesParaMostrar = clasesParaMostrar.sort((a, b) => b.recaudacion - a.recaudacion).slice(0, 5);
  }

// Top Profesores
  let profesParaMostrar = [];
  if (reporte?.finanzas?.todos_profesores) {
    if (filtroEspecialidad) {
      profesParaMostrar = reporte.finanzas.todos_profesores.filter(p => p.especialidad === filtroEspecialidad);
    } else {
      const agrupadoP = {};
      reporte.finanzas.todos_profesores.forEach(p => {
        if (!agrupadoP[p.nombre]) agrupadoP[p.nombre] = 0;
        agrupadoP[p.nombre] += p.recaudacion; // <--- AQUÍ ESTABA EL ERROR DE TIPEO
      });
      profesParaMostrar = Object.keys(agrupadoP).map(nombre => ({ nombre, recaudacion: agrupadoP[nombre] }));
    }
    profesParaMostrar = profesParaMostrar.sort((a, b) => b.recaudacion - a.recaudacion).slice(0, 5);
  }

  return (
    <div style={s.contenedor}>
      <ReportesHeader 
        titulo="Reporte Financiero y Pagos"
        bajada="Control de caja, contabilidad e ingresos por planes y clases."
        fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
        fechaFin={fechaFin} setFechaFin={setFechaFin}
        manejarSubmit={manejarGeneracionManual}
        cargando={cargando} errorValidacion={errorValidacion} consultarFechas={consultarFechas}
      />

      {reporte && (
        <>
          {!hayDatos && <ReportesEmptyState entidad="ingresos financieros ni ventas de planes" filtroEspecialidad="" />}

          {hayDatos && (
            <>
              {/* FILTRO DE ESPECIALIDAD */}
              <div style={{ ...s.cardFiltros, background: 'var(--color-primario-suave, #f0fbfb)', border: '1px solid var(--color-primario)', marginBottom: '24px' }}>
                <div style={s.grupo}>
                  <label style={{ ...s.label, color: 'var(--color-primario-oscuro)', fontWeight: '700' }} htmlFor="filtroEsp">Filtrar Facturación por Segmento / Especialidad</label>
                  <select id="filtroEsp" style={s.select} value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
                    <option value="">Mostrar Facturación Global (Planes + Clases)</option>
                    {opcionesEspecialidades.map((op, i) => <option key={i} value={op}>{op}</option>)}
                  </select>
                </div>
              </div>

              {/* TARJETAS DE RESUMEN */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={s.tarjetaMini}>
                  <span style={s.labelMini}>Ingresos Totales {filtroEspecialidad && "(Solo Clases)"}</span>
                  <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>
                    ${Number(ingresosTotalesRender).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div style={s.tarjetaMini}>
                  <span style={s.labelMini}>Suscripciones Activas</span>
                  <p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>{suscripcionesRender}</p>
                </div>
                <div style={s.tarjetaMini}>
                  <span style={s.labelMini}>Ingreso Promedio Global</span>
                  <p style={{ ...s.valorMini, color: 'var(--color-texto)' }}>{ingresoPromedioRender}</p>
                </div>
              </div>

              {/* EVOLUCIÓN FINANCIERA */}
              <div style={s.seccionReporte}>
                <h2 style={s.subtitulo}>
                  Evolución Financiera {reporte.evolucion_temporal?.granularidad ? `(${reporte.evolucion_temporal.granularidad})` : ''}
                  {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
                </h2>
                <p style={s.bajada}>Ganancias brutas generadas en el tiempo, según el filtro aplicado.</p>
                
                <div style={s.contenedorGrafico}>
                  {reporte.evolucion_temporal?.datos && (() => {
                    const datosMeses = reporte.evolucion_temporal.datos;
                    // El máximo se recalcula en base al filtro para que las barras se escalen bien
                    const maxIngreso = Math.max(...datosMeses.map(d => filtroEspecialidad ? (d.por_especialidad?.[filtroEspecialidad] || 0) : d.ingresos_brutos), 1); 

                    return datosMeses.map((d, i) => {
                      const valorRender = filtroEspecialidad ? (d.por_especialidad?.[filtroEspecialidad] || 0) : d.ingresos_brutos;
                      const alturaPorcentaje = (valorRender / maxIngreso) * 100;
                      const textoTooltip = valorRender >= 1000 ? `$${(valorRender / 1000).toFixed(0)}k` : `$${valorRender}`;

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

              {/* CRUCE DE INGRESOS */}
              <div style={s.seccionReporte}>
                <h2 style={s.subtitulo}>
                  Cruce de Ingresos y Facturación
                  {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
                </h2>
                <p style={s.bajada}>Comparativa del origen de las ganancias. Al aplicar filtros específicos, los ingresos globales (como planes) no se contabilizan.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '24px' }}>
                  <div style={{ padding: '24px', background: filtroEspecialidad ? '#f1f5f9' : '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>POR PLANES (GLOBAL)</span>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: filtroEspecialidad ? '#94a3b8' : '#1e293b' }}>
                      ${Number(ingresosPlanesRender).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </p>
                  </div>

                  <div style={{ padding: '24px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', display: 'block', marginBottom: '8px' }}>POR CLASES INDIVIDUALES</span>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#166534' }}>
                       ${Number(ingresosIndivRender).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </p>
                  </div>

                  <div style={{ padding: '24px', background: filtroEspecialidad ? '#f1f5f9' : '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1d4ed8', display: 'block', marginBottom: '8px' }}>POR SEÑAS / RESERVAS</span>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: filtroEspecialidad ? '#94a3b8' : '#1e3a8a' }}>
                       ${Number(ingresosSenasRender).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* RANKINGS FINANCIEROS */}
          {hayDatos && (
              <div style={s.seccionReporte}>
                <h2 style={s.subtitulo}>
                  Rankings de Recaudación (Top 5)
                  {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
                </h2>
                <p style={s.bajada}>Mejores rendimientos financieros por clase individual y por profesional en el rango seleccionado.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '24px' }}>
                  
                  <div style={{ background: '#ffffff', border: '1px solid var(--color-borde, #e2e8f0)', borderRadius: '8px', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: 'var(--color-primario-oscuro)', borderBottom: '2px solid #f8fafc', paddingBottom: '12px' }}>
                      Clases Más Rentables
                    </h3>
                    {clasesParaMostrar.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {clasesParaMostrar.map((clase, idx) => (
                          <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: idx !== clasesParaMostrar.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-texto, #334155)' }}>
                              <span style={{ color: 'var(--color-texto-suave, #94a3b8)', marginRight: '8px', fontWeight: '700' }}>#{idx + 1}</span> 
                              {clase.nombre}
                            </span>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-secundario-oscuro, #15803d)' }}>
                              ${Number(clase.recaudacion).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--color-texto-suave, #64748b)', textAlign: 'center', margin: '32px 0' }}>No hay registros de ingresos para este filtro.</p>
                    )}
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid var(--color-borde, #e2e8f0)', borderRadius: '8px', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: 'var(--color-primario-oscuro)', borderBottom: '2px solid #f8fafc', paddingBottom: '12px' }}>
                      Profesionales con Mayor Recaudación
                    </h3>
                    {profesParaMostrar.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {profesParaMostrar.map((prof, idx) => (
                          <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: idx !== profesParaMostrar.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-texto, #334155)' }}>
                              <span style={{ color: 'var(--color-texto-suave, #94a3b8)', marginRight: '8px', fontWeight: '700' }}>#{idx + 1}</span> 
                              {prof.nombre}
                            </span>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-secundario-oscuro, #15803d)' }}>
                              ${Number(prof.recaudacion).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--color-texto-suave, #64748b)', textAlign: 'center', margin: '32px 0' }}>No hay registros de ingresos para este filtro.</p>
                    )}
                  </div>

                </div>
              </div>
          )}

          <ReportesExportar tipoReporte="Financieros" />
        </>
      )}
    </div>
  );
}