import React, { useState } from 'react';
import { getFinancialReport } from '../../../services/reportsService';
import { s } from './reportesStyles';
import ReportesHeader from './components/ReportesHeader';
import ReportesExportar from './components/ReportesExportar';
import ReportesEmptyState from './components/ReportesEmptyState';

// IMPORTACIONES PARA EXPORTACIÓN
import { baseTableStyles, inicializarPDF, generarPrefacioExcel, exportarAExcel } from './utils/reportesUtils';
import ReportesAlertaModal from './components/ReportesAlertaModal';
import autoTable from 'jspdf-autotable';


export default function FinanzasReportes() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [alertaCustom, setAlertaCustom] = useState({ visible: false, mensaje: "" });

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


  
  // ────────────────────────────────────────────────────────────────────────
  // LÓGICA DE FILTRADO REACTIVO
  // ────────────────────────────────────────────────────────────────────────
// Listado oficial de especializaciones permitidas en el sistema
  const ESPECIALIZACIONES = [
    'Kinesiologia deportiva', 'Fisioterapia', 'Kinesiologia neurologica',
    'Rehabilitacion cardiovascular', 'Kinesiologia traumatologica', 'Pilates terapeutico',
    'Kinesiologia pediatrica', 'Osteopatia', 'Acupuntura', 'Masoterapia',
    'Kinesiologia respiratoria', 'Rehabilitacion post-quirurgica',
    'Kinesiologia gerontologica', 'Electroterapia',
  ];

  const opcionesEspecialidades = [...ESPECIALIZACIONES].sort();

// Tarjetas Superiores y Desglose
  const ingresosPlanesRender = filtroEspecialidad 
    ? (reporte?.finanzas?.desglose?.suscripciones_por_especialidad?.[filtroEspecialidad] || 0) * (reporte?.finanzas?.desglose?.planes / (reporte?.finanzas?.suscripciones_activas || 1)) 
    : (reporte?.finanzas?.desglose?.planes || 0);
  const ingresosSenasRender = filtroEspecialidad 
    ? (reporte?.finanzas?.desglose?.senas_por_especialidad?.[filtroEspecialidad] || 0) 
    : (reporte?.finanzas?.desglose?.senas || 0);
  const ingresosIndivRender = filtroEspecialidad 
    ? (reporte?.finanzas?.desglose?.individuales_por_especialidad?.[filtroEspecialidad] || 0) 
    : (reporte?.finanzas?.desglose?.individuales || 0);
  
  // 1. Primero se calcula el total
  const ingresosTotalesRender = ingresosPlanesRender + ingresosIndivRender + ingresosSenasRender;
  const suscripcionesRender = filtroEspecialidad 
    ? (reporte?.finanzas?.desglose?.suscripciones_por_especialidad?.[filtroEspecialidad] || 0) 
    : (reporte?.finanzas?.suscripciones_activas || 0);
  const ingresoPromedioRender = filtroEspecialidad ? '-' : `$${Number(reporte?.finanzas?.ingreso_promedio || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

  // 🚨 2. AHORA SÍ: Definimos hayDatos acá abajo, con las variables ya inicializadas
  const hayDatos = reporte && (
    filtroEspecialidad 
      ? (ingresosTotalesRender > 0) 
      : (reporte.finanzas?.ingresos_totales > 0 || reporte.evolucion_temporal?.datos?.some(d => d.ingresos_brutos > 0))
  );

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
        agrupadoP[p.nombre] += p.recaudacion; 
      });
      profesParaMostrar = Object.keys(agrupadoP).map(nombre => ({ nombre, recaudacion: agrupadoP[nombre] }));
    }
    profesParaMostrar = profesParaMostrar.sort((a, b) => b.recaudacion - a.recaudacion).slice(0, 5);
  }

  const tieneDatosParaExportar = filtroEspecialidad 
    ? (ingresosTotalesRender > 0) 
    : (reporte?.finanzas?.ingresos_totales > 0 || reporte?.finanzas?.suscripciones_activas > 0);

const handleExport = (formato) => {
    if (!reporte) return;

    // 🚨 BLOQUEO PREVENTIVO: Si no hay ingresos, se abre el modal del sistema
    if (!tieneDatosParaExportar) {
      setAlertaCustom({
        visible: true,
        mensaje: "No se puede exportar el reporte porque no se registran movimientos ni ingresos para el período o la especialidad seleccionada."
      });
      return;
    }

    const anioActual = new Date().getFullYear();
    const tituloFiltro = filtroEspecialidad ? `_${filtroEspecialidad}` : '_Global';
    const filename = `Reporte_Financiero${tituloFiltro}_${anioActual}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;

    const fechaInicioLegible = reporte.rango_fechas?.inicio || fechaInicio.split('-').reverse().join('/');
    const fechaFinLegible = reporte.rango_fechas?.fin || fechaFin.split('-').reverse().join('/');
    const subTextoRango = `Período auditado: del ${fechaInicioLegible} al ${fechaFinLegible}`;

    if (formato === 'excel') {
      const prefacio = generarPrefacioExcel("REPORTE FINANCIERO Y CONTROL DE PAGOS", subTextoRango);

      // Pestaña 1: Resumen General
      const dataResumenRaw = [
        { "Métrica": "Ingresos Totales (Rango)", "Valor": `$${ingresosTotalesRender.toLocaleString('es-AR')}` },
        { "Métrica": "Suscripciones Activas", "Valor": filtroEspecialidad ? "N/A" : suscripcionesRender },
        { "Métrica": "Ingreso Promedio por Cliente", "Valor": ingresoPromedioRender },
        { "Métrica": "Ingresos por Planes (Suscripciones)", "Valor": `$${ingresosPlanesRender.toLocaleString('es-AR')}` },
        { "Métrica": "Ingresos por Clases Individuales", "Valor": `$${ingresosIndivRender.toLocaleString('es-AR')}` },
        { "Métrica": "Ingresos por Señas / Reservas", "Valor": `$${ingresosSenasRender.toLocaleString('es-AR')}` }
      ];

      // Pestaña 2: Evolución Temporal
      const dataEvolucionRaw = reporte.evolucion_temporal?.datos 
        ? reporte.evolucion_temporal.datos.map(d => {
            const valorFiltro = filtroEspecialidad ? (d.por_especialidad?.[filtroEspecialidad] || 0) : d.ingresos_brutos;
            return {
              "Período": d.mes_corto,
              "Ingresos Brutos": `$${valorFiltro.toLocaleString('es-AR')}`
            };
          }) 
        : [];

      // Pestaña 3: Rankings
      const dataRankingsRaw = [];
      const maxFilas = Math.max(clasesParaMostrar.length, profesParaMostrar.length);
      for (let i = 0; i < maxFilas; i++) {
        dataRankingsRaw.push({
          "Posición": `#${i + 1}`,
          "Clase Más Rentable": clasesParaMostrar[i]?.nombre || "-",
          "Recaudación (Clase)": clasesParaMostrar[i] ? `$${clasesParaMostrar[i].recaudacion.toLocaleString('es-AR')}` : "-",
          "Profesor Más Rentable": profesParaMostrar[i]?.nombre || "-",
          "Recaudación (Profesor)": profesParaMostrar[i] ? `$${profesParaMostrar[i].recaudacion.toLocaleString('es-AR')}` : "-"
        });
      }

      // Empaquetamos las láminas correspondientes
      const laminas = [
        {
          nombre: "Resumen General",
          cols: [{ wch: 40 }, { wch: 25 }],
          data: [
            ...prefacio,
            Object.keys(dataResumenRaw[0]),
            ...dataResumenRaw.map(obj => Object.values(obj))
          ]
        },
        {
          nombre: "Evolución Financiera",
          // 🚨 MODIFICADO: Solo se incluye la pestaña si el segmento actual tiene ingresos reales
          incluir: dataEvolucionRaw.length > 0 && ingresosTotalesRender > 0, 
          cols: [{ wch: 20 }, { wch: 25 }],
          data: [
            ...prefacio,
            Object.keys(dataEvolucionRaw[0] || {}),
            ...dataEvolucionRaw.map(obj => Object.values(obj))
          ]
        },
        {
          nombre: "Rankings Top 5",
          // 🚨 MODIFICADO: Solo se incluye si hay registros en las listas filtradas
          incluir: (clasesParaMostrar.length > 0 || profesParaMostrar.length > 0) && ingresosTotalesRender > 0,
          cols: [{ wch: 10 }, { wch: 30 }, { wch: 25 }, { wch: 30 }, { wch: 25 }],
          data: [
            ...prefacio,
            Object.keys(dataRankingsRaw[0] || {}),
            ...dataRankingsRaw.map(obj => Object.values(obj))
          ]
        }
      ];

      exportarAExcel(filename, laminas);

    } else if (formato === 'pdf') {
      const { doc, currentY: startY } = inicializarPDF("Reporte Financiero y Pagos", subTextoRango, filtroEspecialidad);
      let currentY = startY;

      const checkPageBreak = (espacioNecesario) => {
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        if (currentY + espacioNecesario >= pageHeight - 10) { doc.addPage(); currentY = 14; }
      };

      // 1. Resumen General (Siempre se imprime)
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Ingresos Totales (Rango): $${ingresosTotalesRender.toLocaleString('es-AR')}`, 14, currentY); currentY += 6;
      doc.text(`Suscripciones Activas: ${filtroEspecialidad ? 'N/A' : suscripcionesRender}`, 14, currentY); currentY += 6;
      doc.text(`Ingreso Promedio por Cliente: ${ingresoPromedioRender}`, 14, currentY); currentY += 14;

      // 🚨 CONTROL ESTRICTO DE TABLAS: Solo imprimimos desgloses si hay ingresos reales (> $0)
      if (ingresosTotalesRender > 0) {
        
        // Tabla A: Desglose de ingresos
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Cruce de Ingresos y Facturación", 14, currentY);
        doc.setFont("helvetica", "normal");
        
        autoTable(doc, {
          ...baseTableStyles,
          startY: currentY + 4,
          head: [['Concepto de Ingreso', 'Monto Facturado']],
          body: [
            ['Por Planes (Suscripciones)', `$${ingresosPlanesRender.toLocaleString('es-AR')}`],
            ['Por Clases Individuales', `$${ingresosIndivRender.toLocaleString('es-AR')}`],
            ['Por Señas / Reservas', `$${ingresosSenasRender.toLocaleString('es-AR')}`]
          ],
          columnStyles: { 0: { cellWidth: 90 }, 1: { halign: 'right', cellWidth: 50 } }
        });
        currentY = doc.lastAutoTable.finalY + 14;

        // Tabla B: Evolución Temporal
        if (reporte.evolucion_temporal?.datos && reporte.evolucion_temporal.datos.length > 0) {
          checkPageBreak(45);
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text(`Evolución Financiera (${reporte.evolucion_temporal.granularidad})`, 14, currentY);
          doc.setFont("helvetica", "normal");
          
          const bodyEvolucion = reporte.evolucion_temporal.datos.map(d => {
            const valorFiltro = filtroEspecialidad ? (d.por_especialidad?.[filtroEspecialidad] || 0) : d.ingresos_brutos;
            return [d.mes_corto, `$${valorFiltro.toLocaleString('es-AR')}`];
          });

          autoTable(doc, {
            ...baseTableStyles,
            startY: currentY + 4,
            head: [['Período', 'Ingresos Brutos']],
            body: bodyEvolucion,
            columnStyles: { 0: { cellWidth: 50, halign: 'center' }, 1: { cellWidth: 50, halign: 'right' } }
          });
          currentY = doc.lastAutoTable.finalY + 14;
        }

        // Tabla C: Rankings (Top 5)
        if (clasesParaMostrar.length > 0 || profesParaMostrar.length > 0) {
          checkPageBreak(60);
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Rankings de Recaudación (Top 5)", 14, currentY);
          doc.setFont("helvetica", "normal");
          currentY += 4;

          if (clasesParaMostrar.length > 0) {
            autoTable(doc, {
              ...baseTableStyles,
              startY: currentY,
              head: [['Top', 'Clases Más Rentables', 'Recaudación']],
              body: clasesParaMostrar.map((c, i) => [`#${i + 1}`, c.nombre, `$${c.recaudacion.toLocaleString('es-AR')}`]),
              columnStyles: { 0: { cellWidth: 20, halign: 'center' }, 1: { cellWidth: 70 }, 2: { cellWidth: 40, halign: 'right' } }
            });
            currentY = doc.lastAutoTable.finalY + 10;
          }

          if (profesParaMostrar.length > 0) {
            checkPageBreak(40);
            autoTable(doc, {
              ...baseTableStyles,
              startY: currentY,
              head: [['Top', 'Profesionales con Mayor Recaudación', 'Recaudación']],
              body: profesParaMostrar.map((p, i) => [`#${i + 1}`, p.nombre, `$${p.recaudacion.toLocaleString('es-AR')}`]),
              columnStyles: { 0: { cellWidth: 20, halign: 'center' }, 1: { cellWidth: 70 }, 2: { cellWidth: 40, halign: 'right' } }
            });
          }
        }
      }
      doc.save(filename);
    }
  };

return (
    <div style={s.contenedor}>
      
      {/* 1. CABECERA MODULAR */}
      <ReportesHeader 
        titulo="Reporte Financiero y Pagos"
        bajada="Control de caja, contabilidad e ingresos por planes e individuales."
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
          {/* 2. FILTRO DE ESPECIALIDAD */}
          <div style={{ ...s.cardFiltros, background: 'var(--color-primario-suave, #f0fbfb)', border: '1px solid var(--color-primario)', marginBottom: '24px' }}>
            <div style={s.grupo}>
              <label style={{ ...s.label, color: 'var(--color-primario-oscuro)', fontWeight: '700' }} htmlFor="filtroEsp">
                Filtrar Facturación por Segmento / Especialidad
              </label>
              <select id="filtroEsp" style={s.select} value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
                <option value="">Mostrar Facturación Global (Planes + Clases)</option>
                {opcionesEspecialidades.map((op, i) => (
                  <option key={i} value={op}>{op}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. TARJETAS DE RESUMEN FINANCIERO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Ingresos Totales {filtroEspecialidad && "(Solo Clases)"}</span>
              <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>
                ${Number(ingresosTotalesRender).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Suscripciones Activas (En Rango)</span>
              <p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>
                {suscripcionesRender}
              </p>
            </div>

            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Ingreso Promedio por Cliente</span>
              <p style={{ ...s.valorMini, color: 'var(--color-texto)' }}>
                {ingresoPromedioRender}
              </p>
            </div>
          </div>

          {/* 4. EVOLUCIÓN FINANCIERA */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Evolución Financiera {reporte.evolucion_temporal?.granularidad ? `(${reporte.evolucion_temporal.granularidad})` : ''}
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
            </h2>
            <p style={s.bajada}>Ganancias brutas generadas en el tiempo, según el filtro aplicado.</p>
            
            {ingresosTotalesRender > 0 && reporte.evolucion_temporal?.datos ? (
              <div style={s.contenedorGrafico}>
                {(() => {
                  const datosMeses = reporte.evolucion_temporal.datos;
                  const maxIngreso = Math.max(...datosMeses.map(d => filtroEspecialidad ? (d.por_especialidad?.[filtroEspecialidad] || 0) : d.ingresos_brutos), 1); 

                  return datosMeses.map((d, i) => {
                    const valorRender = filtroEspecialidad ? (d.por_especialidad?.[filtroEspecialidad] || 0) : d.ingresos_brutos;
                    const alturaPorcentaje = (valorRender / maxIngreso) * 100;
                    const textoTooltip = valorRender >= 1000 
                      ? `$${(valorRender / 1000).toFixed(0)}k` 
                      : `$${valorRender}`;

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
            ) : (
              <ReportesEmptyState entidad="flujos de evolución de ingresos financieros" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          {/* 5. CRUCE DE INGRESOS Y FACTURACIÓN */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Cruce de Ingresos y Facturación
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
            </h2>
            <p style={s.bajada}>Comparativa del origen de las ganancias. Al aplicar filtros específicos, los ingresos correspondientes a la especialidad seleccionada se contabilizan detalladamente.</p>
            
            {ingresosTotalesRender > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '24px' }}>
                <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>POR PLANES (Suscripciones)</span>
                  <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>
                    ${Number(ingresosPlanesRender).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div style={{ padding: '24px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', display: 'block', marginBottom: '8px' }}>POR CLASES INDIVIDUALES</span>
                  <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#166534' }}>
                     ${Number(ingresosIndivRender).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div style={{ padding: '24px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1d4ed8', display: 'block', marginBottom: '8px' }}>POR SEÑAS / RESERVAS</span>
                  <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#1e3a8a' }}>
                     ${Number(ingresosSenasRender).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ) : (
              <ReportesEmptyState entidad="ganancias ni desgloses de cajas" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          {/* 6. RANKINGS FINANCIEROS */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Rankings de Recaudación (Top 5)
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
            </h2>
            <p style={s.bajada}>Mejores rendimientos financieros por clase y por profesional en el rango seleccionado.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '24px' }}>
              
              {/* Columna: Top 5 Clases */}
              <div style={{ background: '#ffffff', border: '1px solid var(--color-borde, #e2e8f0)', borderRadius: '8px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: 'var(--color-primario-oscuro)', borderBottom: '2px solid #f8fafc', paddingBottom: '12px' }}>
                  Clases Most Rentables
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
                  <ReportesEmptyState entidad="ventas en clases" filtroEspecialidad={filtroEspecialidad} />
                )}
              </div>

              {/* Columna: Top 5 Profesores */}
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
                  <ReportesEmptyState entidad="recaudación por profesores" filtroEspecialidad={filtroEspecialidad} />
                )}
              </div>

            </div>
          </div>

          {/* EXPORTACIÓN MODULAR */}
          <ReportesExportar tipoReporte="Financieros" onExport={handleExport} />
        </>
      )}
      
      {/* MODAL DE ALERTA PROPIO */}
      <ReportesAlertaModal 
        visible={alertaCustom.visible}
        mensaje={alertaCustom.mensaje}
        onClose={() => setAlertaCustom({ visible: false, mensaje: "" })}
      />
    </div>
  );
}