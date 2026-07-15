import React, { useState } from 'react';
import { getClientsReport } from '../../../services/reportsService';
import { s } from './reportesStyles';
import ReportesHeader from './components/ReportesHeader';
import ReportesExportar from './components/ReportesExportar';
import ReportesEmptyState from './components/ReportesEmptyState';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function ClientesReportes() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');

  const [sortConcurrencia, setSortConcurrencia] = useState({ llave: null, direccion: 'asc' });

  const consultarFechas = async (inicio, fin) => {
    setErrorValidacion(''); setReporte(null); setFiltroEspecialidad('');
    try {
      setCargando(true);
      const data = await getClientsReport(inicio, fin);
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
    const direccion = sortConcurrencia.llave === llave && sortConcurrencia.direccion === 'asc' ? 'desc' : 'asc';
    setSortConcurrencia({ llave, direccion });
  };

  const clasesFiltradas = reporte 
    ? (filtroEspecialidad 
        ? reporte.clase.filter(c => c.tipo === filtroEspecialidad && c.is_clase_individual === true) 
        : reporte.clase.filter(c => c.is_clase_individual === false)) 
    : [];
  const listaHorarios = reporte?.mapa_calor?.[0] ? Object.keys(reporte.mapa_calor[0].horas).sort() : [];
  
  // Nuevo cálculo de totales basado en la nueva estructura de datos
  const totales = clasesFiltradas.reduce((acc, c) => ({
    clases: acc.clases + (c.cant_clases || 0),
    cupos: acc.cupos + (c.cupos_iniciales || 0),
    asistencias: acc.asistencias + (c.asistencias || 0),
    inasistencias: acc.inasistencias + (c.inasistencias || 0),
    cancelaciones: acc.cancelaciones + (c.cancelaciones || 0),
    espera: acc.espera + (c.lista_espera || 0)
  }), { clases: 0, cupos: 0, asistencias: 0, inasistencias: 0, cancelaciones: 0, espera: 0 });

  const hayDatos = totales.clases > 0;
  const motivosOcultos = ["Acumulación De 3 Faltas Consecutivas", "Inasistencia mayor al 50%"];

  const statsSanciones = React.useMemo(() => {
    if (!reporte?.sancionados || reporte.sancionados.length === 0) {
      return {
        tresFaltas: 0, cincuentaPorciento: 0, otrosMotivos: 0, reincidentes: 0,
        masAntiguo: { nombre: '-', fecha: '' }, masReciente: { nombre: '-', fecha: '' }
      };
    }

    const contadores = { tresFaltas: 0, cincuentaPorciento: 0, otrosMotivos: 0 };
    reporte.sancionados.forEach(user => {
      const motivoStr = user.motivo?.toLowerCase() || '';
      if (motivoStr.includes('3 faltas') || motivoStr.includes('tres faltas')) {
        contadores.tresFaltas++;
      } else if (motivoStr.includes('50%') || motivoStr.includes('cincuenta')) {
        contadores.cincuentaPorciento++;
      } else {
        contadores.otrosMotivos++;
      }
    });

    return { 
      ...contadores,
      reincidentes: reporte.sanciones_estadisticas?.reincidentes || 0,
      masAntiguo: reporte.sanciones_estadisticas?.masAntiguo || { nombre: '-', fecha: '' },
      masReciente: reporte.sanciones_estadisticas?.masReciente || { nombre: '-', fecha: '' }
    };
  }, [reporte]);

  const handleExport = (formato) => {
    if (!reporte) return;
    const anioActual = new Date().getFullYear();
    const tituloFiltro = filtroEspecialidad ? `_${filtroEspecialidad}` : '_Global';
    const filename = `Reporte_Clientes_Avanzado${tituloFiltro}_${anioActual}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;

    // Extraemos el rango de fechas proporcionado por el backend (o caemos en el estado local)
    const fechaInicioLegible = reporte.rango_fechas?.inicio || fechaInicio.split('-').reverse().join('/');
    const fechaFinLegible = reporte.rango_fechas?.fin || fechaFin.split('-').reverse().join('/');
    const subTextoRango = `Período auditado: del ${fechaInicioLegible} al ${fechaFinLegible}`;

    if (formato === 'excel') {
      const wb = XLSX.utils.book_new();

      // 🚨 MEJORA EXCEL: Insertar cabecera con el rango de fechas en cada pestaña antes de las tablas
      const prefacioMetadatos = [
        ["REPORTE DE CLIENTES Y ASISTENCIAS"],
        [subTextoRango.toUpperCase()],
        [] // Fila vacía de separación
      ];

      // Pestaña 1: Resumen General
      const dataResumen = [
        ...prefacioMetadatos,
        ["Métrica", "Valor"],
        ["Ausentismo Promedio", `${reporte.resumen.tasa_ausentismo}%`],
        ["Nuevos Registros", reporte.resumen.nuevos_registros || 0],
        ["Clientes Suspendidos", reporte.resumen.clientes_suspendidos_rango || 0]
      ];
      const wsResumen = XLSX.utils.aoa_to_sheet(dataResumen);
      wsResumen['!cols'] = [{ wch: 35 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen General");

      // Pestaña 2: Concurrencia
      const dataConcurrenciaRaw = clasesFiltradas.map(c => ({
        "Especialidad / Clase": c.nombre_clase || c.tipo,
        "Clases": c.cant_clases,
        "Cupos Iniciales": c.cupos_iniciales,
        "Asistencias": c.asistencias,
        "Inasistencias": c.inasistencias,
        "Cancelaciones": c.cancelaciones,
        "Lista Espera": c.lista_espera
      }));
      dataConcurrenciaRaw.push({
        "Especialidad / Clase": "TOTALES",
        "Clases": totales.clases,
        "Cupos Iniciales": totales.cupos,
        "Asistencias": totales.asistencias,
        "Inasistencias": totales.inasistencias,
        "Cancelaciones": totales.cancelaciones,
        "Lista Espera": totales.espera
      });
      // Convertimos la tabla de concurrencia a array de arrays (AOA) para anexarle la cabecera arriba
      const wsConcurrencia = XLSX.utils.aoa_to_sheet([
        ...prefacioMetadatos,
        Object.keys(dataConcurrenciaRaw[0]),
        ...dataConcurrenciaRaw.map(obj => Object.values(obj))
      ]);
      wsConcurrencia['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsConcurrencia, "Concurrencia");

      // Pestaña 3: Mapa de Calor
      if (reporte.mapa_calor && listaHorarios.length > 0) {
        const dataMapaCalor = reporte.mapa_calor.map(row => {
          const fila = { "Día / Módulo": row.dia };
          listaHorarios.forEach(h => {
            const cellData = row.horas[h];
            const valorPct = filtroEspecialidad ? (cellData?.[filtroEspecialidad] ?? 0.0) : (cellData?.general ?? 0.0);
            fila[`${h} hs`] = `${valorPct}%`;
          });
          return fila;
        });
        const wsMapa = XLSX.utils.aoa_to_sheet([
          ...prefacioMetadatos,
          Object.keys(dataMapaCalor[0]),
          ...dataMapaCalor.map(obj => Object.values(obj))
        ]);
        const colWidths = [{ wch: 15 }];
        listaHorarios.forEach(() => colWidths.push({ wch: 10 }));
        wsMapa['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(wb, wsMapa, "Mapa de Calor");
      }

      // Pestaña 4: Cuentas Suspendidas
      const sancionadosFiltrados = reporte.sancionados?.filter(user => !motivosOcultos.includes(user.motivo)) || [];
      let wsSanciones;
      if (sancionadosFiltrados.length > 0) {
        const dataSanciones = sancionadosFiltrados.map(user => ({
          "Nombre del Alumno": user.nombre,
          "Motivo de Suspensión": user.motivo,
          "Inicio de Suspensión": user.fecha_inicio
        }));
        wsSanciones = XLSX.utils.aoa_to_sheet([
          ...prefacioMetadatos,
          Object.keys(dataSanciones[0]),
          ...dataSanciones.map(obj => Object.values(obj))
        ]);
        wsSanciones['!cols'] = [{ wch: 30 }, { wch: 45 }, { wch: 25 }];
      } else {
        wsSanciones = XLSX.utils.aoa_to_sheet([
          ...prefacioMetadatos,
          ["Estado"],
          ["No se registraron suspensiones en este período."]
        ]);
        wsSanciones['!cols'] = [{ wch: 50 }];
      }
      XLSX.utils.book_append_sheet(wb, wsSanciones, "Cuentas Suspendidas");

      XLSX.writeFile(wb, filename);

    } else if (formato === 'pdf') {
      const doc = new jsPDF();
      let currentY = 14;

      const checkPageBreak = (espacioNecesario) => {
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        if (currentY + espacioNecesario >= pageHeight - 10) { doc.addPage(); currentY = 14; }
      };

      // TÍTULO Y SUBTÍTULO CON RANGO DE FECHAS
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(`Reporte de Clientes y Asistencias ${anioActual}`, 14, currentY);
      currentY += 7;

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Gris suave (#64748b)
      doc.text(subTextoRango, 14, currentY);
      currentY += 8;
      
      if (filtroEspecialidad) {
        doc.setFontSize(10);
        doc.setTextColor(15, 118, 110);
        doc.text(`Filtro aplicado: ${filtroEspecialidad}`, 14, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 8;
      } else {
        currentY += 2;
      }

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Ausentismo Promedio: ${reporte.resumen.tasa_ausentismo}%`, 14, currentY); currentY += 6;
      doc.text(`Nuevos Registros: ${reporte.resumen.nuevos_registros || 0}`, 14, currentY); currentY += 6;
      doc.text(`Clientes Suspendidos: ${reporte.resumen.clientes_suspendidos_rango || 0}`, 14, currentY); currentY += 14;

      const baseTableStyles = {
        theme: 'striped',
        headStyles: { fillColor: [15, 118, 110], fontSize: 11, halign: 'center' },
        bodyStyles: { fontSize: 10, valign: 'middle' },
        styles: { cellPadding: 5, overflow: 'linebreak' },
        margin: { top: 14 }
      };

      checkPageBreak(40);
      doc.setFontSize(14);
      doc.text("Concurrencia y Cancelaciones", 14, currentY);
      
      const bodyConcurrencia = clasesFiltradas.map(c => [
        c.nombre_clase || c.tipo, c.cant_clases, c.cupos_iniciales, c.asistencias, c.inasistencias, c.cancelaciones, c.lista_espera
      ]);
      bodyConcurrencia.push([{ content: 'TOTALES', styles: { fontStyle: 'bold', textColor: [15, 118, 110] } }, totales.clases, totales.cupos, totales.asistencias, totales.inasistencias, totales.cancelaciones, totales.espera]);

      autoTable(doc, {
        ...baseTableStyles,
        startY: currentY + 4,
        head: [['Especialidad / Clase', 'Clases', 'Cupos', 'Asist.', 'Inasist.', 'Cancel.', 'Espera']],
        body: bodyConcurrencia,
        styles: { ...baseTableStyles.styles, fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 35 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' } }
      });
      currentY = doc.lastAutoTable.finalY + 14;

      if (reporte.mapa_calor && listaHorarios.length > 0) {
        checkPageBreak(50);
        doc.setFontSize(14);
        doc.text("Mapa de Calor: Ocupación (%)", 14, currentY);
        
        const bodyMapa = reporte.mapa_calor.map(row => {
          const celdasHoras = listaHorarios.map(h => {
            const cellData = row.horas[h];
            return `${filtroEspecialidad ? (cellData?.[filtroEspecialidad] ?? 0.0) : (cellData?.general ?? 0.0)}%`;
          });
          return [{ content: row.dia, styles: { fontStyle: 'bold' } }, ...celdasHoras];
        });

        autoTable(doc, {
          ...baseTableStyles,
          startY: currentY + 4,
          head: [['Día', ...listaHorarios.map(h => h)]],
          body: bodyMapa,
          styles: { ...baseTableStyles.styles, fontSize: 8, cellPadding: 2, halign: 'center' }, 
          headStyles: { ...baseTableStyles.headStyles, fontSize: 8 },
          columnStyles: { 0: { halign: 'left', cellWidth: 20 } }
        });
        currentY = doc.lastAutoTable.finalY + 14;
      }

      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Cuentas Suspendidas por Inasistencia", 14, currentY);
      currentY += 6;
      
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Desglose -> 3 Faltas: ${statsSanciones.tresFaltas} | >50% Ausencia: ${statsSanciones.cincuentaPorciento} | Otros: ${statsSanciones.otrosMotivos} | Reincidentes: ${statsSanciones.reincidentes}`, 14, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 8;

      const sancionadosFiltrados = reporte.sancionados?.filter(user => !motivosOcultos.includes(user.motivo)) || [];
      if (sancionadosFiltrados.length > 0) {
        autoTable(doc, {
          ...baseTableStyles,
          startY: currentY,
          head: [['Nombre', 'Motivo', 'Fecha Inicio']],
          body: sancionadosFiltrados.map(user => [user.nombre, user.motivo, user.fecha_inicio]),
          columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 80 } }
        });
        currentY = doc.lastAutoTable.finalY + 14;
      } else {
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139);
        doc.text("No se registraron suspensiones en este período para listar.", 14, currentY + 4);
        doc.setTextColor(0, 0, 0);
        currentY += 14;
      }

      doc.save(filename);
    }
  };

  return (
    <div style={s.contenedor}>
      <ReportesHeader 
        titulo="Control de Clientes y Asistencias"
        bajada="Monitoreo del comportamiento de los alumnos y la deserción."
        fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
        fechaFin={fechaFin} setFechaFin={setFechaFin}
        manejarSubmit={manejarGeneracionManual}
        cargando={cargando} errorValidacion={errorValidacion} consultarFechas={consultarFechas}
      />

      {reporte && (
        <>
          <div style={s.gridResumen}>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Ausentismo Promedio (En Período)</span>
              <p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>{reporte.resumen.tasa_ausentismo}%</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Nuevos Registros (En Período)</span>
              <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>{reporte.resumen.nuevos_registros || 0}</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Clientes Suspendidos (En Período)</span>
              <p style={{ ...s.valorMini, color: 'var(--color-texto)' }}>{reporte.resumen.clientes_suspendidos_rango || 0}</p>
            </div>
          </div>

          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Cuentas Suspendidas por Inasistencia
              <span style={s.badgeGlobalTitulo}>Global</span>
            </h2>
            <p style={s.bajada}>Análisis de deserción y motivos de penalización automática.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-borde)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)' }}>POR +3 FALTAS</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--color-primario-oscuro)' }}>{statsSanciones.tresFaltas}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-borde)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)' }}>AUSENCIA &gt; 50%</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--color-primario-oscuro)' }}>{statsSanciones.cincuentaPorciento}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-borde)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)' }}>OTROS MOTIVOS</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--color-texto)' }}>{statsSanciones.otrosMotivos}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-borde)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)' }}>REINCIDENTES (2+)</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--color-texto)' }}>{statsSanciones.reincidentes}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', background: '#f0fbfb', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-borde)', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-texto-suave)', display: 'block' }}>Récord más antiguo:</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-texto)' }}>
                  {statsSanciones.masAntiguo.nombre !== '-' ? `${statsSanciones.masAntiguo.nombre} (${statsSanciones.masAntiguo.fecha})` : '-'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-texto-suave)', display: 'block' }}>Suspensión más reciente:</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-texto)' }}>
                  {statsSanciones.masReciente.nombre !== '-' ? `${statsSanciones.masReciente.nombre} (${statsSanciones.masReciente.fecha})` : '-'}
                </span>
              </div>
            </div>

            <div style={s.wrapperTabla}>
             <table style={s.tabla}>
              <thead>
                <tr>
                  <th style={s.thOrdenable}>Nombre</th>
                  <th style={s.thOrdenable}>Motivo de la Suspensión</th>
                  <th style={s.thOrdenable}>Inicio de Suspensión</th>
                </tr>
              </thead>
              <tbody>
                {reporte.sancionados
                  ?.filter(user => !motivosOcultos.includes(user.motivo)) 
                  .map((user, idx) => (
                    <tr key={idx}>
                      <td style={s.td}><strong>{user.nombre}</strong></td>
                      <td style={s.td}>{user.motivo}</td>
                      <td style={s.td}>
                        <span style={{...s.badgePorcentaje, background: '#f1f5f9', color: '#475569'}}>{user.fecha_inicio}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            </div>
          </div>
                  
          <div style={{ ...s.cardFiltros, background: 'var(--color-primario-suave, #f0fbfb)', border: '1px solid var(--color-primario)' }}>
            <div style={s.grupo}>
              <label style={{ ...s.label, color: 'var(--color-primario-oscuro)', fontWeight: '700' }} htmlFor="filtroEsp">Filtrar Segmento Operativo / Especialidad</label>
              <select id="filtroEsp" style={s.select} value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
                <option value="">Mostrar todo (Perspectiva Global)</option>
                {reporte?.clase ? [...new Set(reporte.clase.map(c => c.tipo))].sort().map((op, i) => <option key={i} value={op}>{op}</option>) : null}
              </select>
            </div>
          </div>

          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Control de Concurrencia y Cancelaciones
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
            </h2>
            
            {hayDatos ? (
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('tipo')}>Especialidad</th>
                      <th style={s.thOrdenable}>Clases</th>
                      <th style={s.thOrdenable}>Cupos Iniciales</th>
                      <th style={s.thOrdenable}>Asistencias</th>
                      <th style={s.thOrdenable}>Inasistencias</th>
                      <th style={s.thOrdenable}>Cancelaciones</th>
                      <th style={s.thOrdenable}>Lista de Espera</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clasesFiltradas.map((c, i) => {
                      if (!c.cant_clases || c.cant_clases === 0) return null;
                      return (
                        <tr key={i}>
                          <td style={s.td}><strong>{c.nombre_clase || c.tipo}</strong></td>
                          <td style={s.td}>{c.cant_clases}</td>
                          <td style={s.td}>{c.cupos_iniciales}</td>
                          <td style={s.td}><span style={{ ...s.badgePorcentaje, background: '#dcfce7', color: '#166534' }}>{c.asistencias}</span></td>
                          <td style={s.td}>{c.inasistencias}</td>
                          <td style={s.td}><span style={{ ...s.badgePorcentaje, background: '#fee2e2', color: '#b91c1c' }}>{c.cancelaciones}</span></td>
                          <td style={s.td}>{c.lista_espera}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ fontWeight: 'bold', background: '#f8fafc', borderTop: '2px solid var(--color-borde)' }}>
                      <td style={{...s.td, color: 'var(--color-primario-oscuro)'}}>TOTALES</td>
                      <td style={s.td}>{totales.clases}</td>
                      <td style={s.td}>{totales.cupos}</td>
                      <td style={s.td}><span style={{ ...s.badgePorcentaje, background: '#dcfce7', color: '#166534' }}>{totales.asistencias}</span></td>
                      <td style={s.td}>{totales.inasistencias}</td>
                      <td style={s.td}><span style={{ ...s.badgePorcentaje, background: '#fee2e2', color: '#b91c1c' }}>{totales.cancelaciones}</span></td>
                      <td style={s.td}>{totales.espera}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <ReportesEmptyState entidad="clases programadas" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Mapa de Calor: Concurrencia de Alumnos (Grid)
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
            </h2>
            <p style={s.bajada}>Ocupación real basada en el flujo de asistencia sobre cupos ofertados (08:00 a 20:00 hs).</p>
            
            {hayDatos ? (
              <div style={s.wrapperTabla}>
                <div style={s.gridCalorDinamico(listaHorarios.length)}>
                  <div style={s.celdaCalorCabecera}>Día / Módulo</div>
                  {listaHorarios.map((h, i) => <div key={i} style={s.celdaCalorCabecera}>{h} hs</div>)}
                  {reporte.mapa_calor.map((row, i) => (
                    <React.Fragment key={i}>
                      <div style={s.celdaCalorDia}><strong>{row.dia}</strong></div>
                      {listaHorarios.map((h, idx) => {
                        const cellData = row.horas[h];
                        const valorPct = filtroEspecialidad ? (cellData?.[filtroEspecialidad] ?? 0.0) : (cellData?.general ?? 0.0);
                        return <div key={idx} style={s.celdaBloque(valorPct)}>{valorPct}%</div>;
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <ReportesEmptyState entidad="flujos de asistencia" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          <ReportesExportar tipoReporte="Clientes" onExport={handleExport} />
        </>
      )}
    </div>
  );
}