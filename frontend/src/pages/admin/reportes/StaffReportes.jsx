import React, { useState } from 'react';
import { getStaffReport } from '../../../services/reportsService';
import { s } from './reportesStyles';
import ReportesHeader from './components/ReportesHeader';
import ReportesExportar from './components/ReportesExportar';
import ReportesEmptyState from './components/ReportesEmptyState';

// IMPORTACIONES PARA EXPORTACIÓN
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function StaffReportes() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [sortProfesores, setSortProfesores] = useState({ llave: null, direccion: 'asc' });

  const consultarFechas = async (inicio, fin) => {
    setErrorValidacion(''); setReporte(null); setFiltroEspecialidad('');
    try {
      setCargando(true);
      const data = await getStaffReport(inicio, fin);
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
    const direccion = sortProfesores.llave === llave && sortProfesores.direccion === 'asc' ? 'desc' : 'asc';
    setSortProfesores({ llave, direccion });
  };

  const procesarOrdenamiento = (datos, configuracion, llaveEspecialidad = null) => {
    if (!configuracion.llave) return datos;
    const copia = [...datos];
    copia.sort((a, b) => {
      let valA = a[configuracion.llave]; let valB = b[configuracion.llave];
      if (llaveEspecialidad && configuracion.llave === 'porcentaje_ocupacion_clases') {
        valA = a.por_especialidad?.[llaveEspecialidad]?.uso_cupos ?? 0; 
        valB = b.por_especialidad?.[llaveEspecialidad]?.uso_cupos ?? 0;
      } else if (llaveEspecialidad && configuracion.llave === 'total_alumnos_atendidos') {
        valA = a.por_especialidad?.[llaveEspecialidad]?.atendidos ?? 0; 
        valB = b.por_especialidad?.[llaveEspecialidad]?.atendidos ?? 0;
      } else if (llaveEspecialidad && configuracion.llave === 'total_cancelaciones_recibidas') {
        valA = a.por_especialidad?.[llaveEspecialidad]?.cancelados ?? 0; 
        valB = b.por_especialidad?.[llaveEspecialidad]?.cancelados ?? 0;
      } else if (llaveEspecialidad && configuracion.llave === 'cantidad_clases_dictadas') {
        valA = a.por_especialidad?.[llaveEspecialidad]?.cantidad_clases_dictadas ?? 0; 
        valB = b.por_especialidad?.[llaveEspecialidad]?.cantidad_clases_dictadas ?? 0;
      }
      if (typeof valA === 'string') return configuracion.direccion === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return configuracion.direccion === 'asc' ? valA - valB : valB - valA;
    });
    return copia;
  };

  const opcionesEspecialidades = reporte?.clases_lista ? [...new Set(reporte.clases_lista.map(c => c.tipo))].sort() : [];
  const profesoresOrdenados = reporte ? procesarOrdenamiento(reporte.profesores_mayor_concurrencia, sortProfesores, filtroEspecialidad) : [];
  
  let totalAtendidosGlobal = 0;
  let totalCanceladosGlobal = 0;
  let totalClasesDictadasGlobal = 0;
  let sumaCupos = 0;
  let countProfesConClases = 0;

  profesoresOrdenados.forEach((p) => {
    const atendidos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.atendidos ?? 0) : p.total_alumnos_atendidos;
    const cancelados = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cancelados ?? 0) : p.total_cancelaciones_recibidas;
    const cupos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.uso_cupos ?? 0.0) : p.porcentaje_ocupacion_clases;
    const clasesDictadas = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cantidad_clases_dictadas ?? 0) : p.cantidad_clases_dictadas;
    
    if (clasesDictadas > 0) {
      totalAtendidosGlobal += atendidos;
      totalCanceladosGlobal += cancelados;
      totalClasesDictadasGlobal += clasesDictadas;
      sumaCupos += cupos;
      countProfesConClases++;
    }
  });

  const promedioCuposGlobal = countProfesConClases > 0 ? (sumaCupos / countProfesConClases).toFixed(1) : 0;
  const hayDatos = totalClasesDictadasGlobal > 0;

  const profesoresRetencionFiltrados = reporte?.retencion?.filter(r => {
    return filtroEspecialidad ? r.especialidad === filtroEspecialidad : true;
  }).slice(0, 10);

  const absentismoFiltrado = reporte?.absentismo?.filter(a => {
    return filtroEspecialidad ? a.especialidad === filtroEspecialidad : true;
  }) || [];


  // ─────────────────────────────────────────────────────────
  // LÓGICA DE EXPORTACIÓN DETALLADA (PDF / EXCEL)
  // ─────────────────────────────────────────────────────────
  const handleExport = (formato) => {
    if (!reporte) return;
    const anioActual = new Date().getFullYear();
    const tituloFiltro = filtroEspecialidad ? `_${filtroEspecialidad}` : '_Global';
    const filename = `Reporte_Staff${tituloFiltro}_${anioActual}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;

    if (formato === 'excel') {
      const wb = XLSX.utils.book_new();

      // Pestaña 1: Resumen General
      const wsResumen = XLSX.utils.json_to_sheet([
        { "Métrica": "Prof. Tren Superior", "Valor": reporte.resumen?.tren_superior || 0 },
        { "Métrica": "Prof. Tren Inferior", "Valor": reporte.resumen?.tren_inferior || 0 },
        { "Métrica": "Prof. Tren Medio", "Valor": reporte.resumen?.tren_medio || 0 },
      ]);
      wsResumen['!cols'] = [{ wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

      // Pestaña 2: Concurrencia de Profesores
      const dataConcurrencia = profesoresOrdenados
        .filter(p => {
          const clasesDictadas = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cantidad_clases_dictadas ?? 0) : p.cantidad_clases_dictadas;
          return !filtroEspecialidad || clasesDictadas > 0;
        })
        .map(p => {
          const atendidos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.atendidos ?? 0) : p.total_alumnos_atendidos;
          const cancelados = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cancelados ?? 0) : p.total_cancelaciones_recibidas;
          const cupos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.uso_cupos ?? 0.0) : p.porcentaje_ocupacion_clases;
          const clasesDictadas = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cantidad_clases_dictadas ?? 0) : p.cantidad_clases_dictadas;
          return {
            "Kinesiólogo": p.nombre,
            "Alumnos Atendidos": atendidos,
            "Ausencias": cancelados,
            "Clases Dadas": clasesDictadas,
            "Uso de Cupos": `${cupos}%`
          };
        });
      dataConcurrencia.push({
        "Kinesiólogo": "TOTALES / PROMEDIOS",
        "Alumnos Atendidos": totalAtendidosGlobal,
        "Ausencias": totalCanceladosGlobal,
        "Clases Dadas": totalClasesDictadasGlobal,
        "Uso de Cupos": `${promedioCuposGlobal}%`
      });
      const wsConcurrencia = XLSX.utils.json_to_sheet(dataConcurrencia);
      wsConcurrencia['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsConcurrencia, "Concurrencia");

      // Pestaña 3: Absentismo (Faltas)
      if (absentismoFiltrado.length > 0) {
        const dataAbsentismo = absentismoFiltrado.map(a => ({
          "Profesor": a.profesor,
          "Clase Ausentada": a.clase,
          "Fecha Actividad": a.fecha_actividad,
          "Especialidad": a.especialidad,
          "Última Acción (Baja)": a.fecha_baja ? String(a.fecha_baja).split('.')[0] : '-'
        }));
        const wsAbsentismo = XLSX.utils.json_to_sheet(dataAbsentismo);
        wsAbsentismo['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, wsAbsentismo, "Absentismo");
      } else {
        const wsAbsentismo = XLSX.utils.json_to_sheet([{ "Estado": "No se registraron faltas en este período." }]);
        wsAbsentismo['!cols'] = [{ wch: 50 }];
        XLSX.utils.book_append_sheet(wb, wsAbsentismo, "Absentismo");
      }

      // Pestaña 4: Retención (Dinámica Real)
      if (profesoresRetencionFiltrados.length > 0) {
        const dataRetencion = profesoresRetencionFiltrados.map(r => {
          const fila = {
            "Profesor": r.profesor,
            "Clase / Especialidad": r.clase
          };
          for (let i = 0; i < 4; i++) {
            const sesion = r.sesiones?.[i];
            fila[`Sesión ${i + 1}`] = sesion ? `${sesion.presentes} asist. (${sesion.fecha})` : "-";
          }
          return fila;
        });
        const wsRetencion = XLSX.utils.json_to_sheet(dataRetencion);
        wsRetencion['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, wsRetencion, "Evolución Retención");
      } else {
        const wsRetencion = XLSX.utils.json_to_sheet([{ "Estado": "No hay clases fijas para analizar retención en este rango." }]);
        wsRetencion['!cols'] = [{ wch: 60 }];
        XLSX.utils.book_append_sheet(wb, wsRetencion, "Evolución Retención");
      }

      // Pestaña 5: Bajas
      if (reporte.profesores_eliminados?.length > 0) {
        const dataBajas = reporte.profesores_eliminados.map(p => ({
          "Nombre": p.nombre,
          "Fecha de Baja": new Date(p.fecha_baja).toLocaleDateString()
        }));
        const wsBajas = XLSX.utils.json_to_sheet(dataBajas);
        wsBajas['!cols'] = [{ wch: 35 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsBajas, "Profesores de Baja");
      }

      XLSX.writeFile(wb, filename);

    } else if (formato === 'pdf') {
      const doc = new jsPDF();
      let currentY = 14;

      const checkPageBreak = (espacioNecesario) => {
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        if (currentY + espacioNecesario >= pageHeight - 10) { doc.addPage(); currentY = 14; }
      };

      // Título
      doc.setFontSize(18);
      doc.text(`Reporte de Staff y Rendimiento ${anioActual}`, 14, currentY);
      currentY += 8;

      if (filtroEspecialidad) {
        doc.setFontSize(11);
        doc.setTextColor(15, 118, 110);
        doc.text(`Filtro aplicado: ${filtroEspecialidad}`, 14, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 8;
      } else {
        currentY += 4;
      }

      // Resumen Global
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Resumen de Staff", 14, currentY);
      currentY += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Prof. Tren Superior: ${reporte.resumen?.tren_superior || 0}`, 14, currentY); currentY += 6;
      doc.text(`Prof. Tren Inferior: ${reporte.resumen?.tren_inferior || 0}`, 14, currentY); currentY += 6;
      doc.text(`Prof. Tren Medio: ${reporte.resumen?.tren_medio || 0}`, 14, currentY); currentY += 10;

      const baseTableStyles = {
        theme: 'striped',
        headStyles: { fillColor: [15, 118, 110], fontSize: 10, halign: 'center' },
        bodyStyles: { fontSize: 9, valign: 'middle' },
        styles: { cellPadding: 3, overflow: 'linebreak' },
        margin: { top: 10 }
      };

      // Tabla de Concurrencia
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.text("Concurrencia de Profesores", 14, currentY);
      
      const bodyConcurrencia = profesoresOrdenados
        .filter(p => {
          const clasesDictadas = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cantidad_clases_dictadas ?? 0) : p.cantidad_clases_dictadas;
          return !filtroEspecialidad || clasesDictadas > 0;
        })
        .map(p => {
          const atendidos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.atendidos ?? 0) : p.total_alumnos_atendidos;
          const cancelados = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cancelados ?? 0) : p.total_cancelaciones_recibidas;
          const cupos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.uso_cupos ?? 0.0) : p.porcentaje_ocupacion_clases;
          const clasesDictadas = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cantidad_clases_dictadas ?? 0) : p.cantidad_clases_dictadas;
          return [p.nombre, atendidos, cancelados, clasesDictadas, `${cupos}%`];
        });

      bodyConcurrencia.push([{ content: 'TOTALES / PROMEDIOS', styles: { fontStyle: 'bold', textColor: [15, 118, 110] } }, totalAtendidosGlobal, totalCanceladosGlobal, totalClasesDictadasGlobal, `${promedioCuposGlobal}%`]);

      autoTable(doc, {
        ...baseTableStyles,
        startY: currentY + 4,
        head: [['Kinesiólogo', 'Alumnos', 'Ausencias', 'Clases', 'Cupos (%)']],
        body: bodyConcurrencia,
        columnStyles: { 0: { cellWidth: 50 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } }
      });
      currentY = doc.lastAutoTable.finalY + 14;

      // Absentismo
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.text("Absentismo del Staff (Registro de Faltas)", 14, currentY);
      
      if (absentismoFiltrado.length > 0) {
        autoTable(doc, {
          ...baseTableStyles,
          startY: currentY + 4,
          head: [['Profesor', 'Clase', 'Fecha Actividad', 'Última Acción (Baja)']],
          body: absentismoFiltrado.map(a => [a.profesor, a.clase, a.fecha_actividad, a.fecha_baja ? String(a.fecha_baja).split('.')[0] : '-']),
          columnStyles: { 0: { cellWidth: 45 } }
        });
        currentY = doc.lastAutoTable.finalY + 14;
      } else {
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139);
        doc.text("No se registraron faltas en este período.", 14, currentY + 6);
        doc.setTextColor(0, 0, 0);
        currentY += 16;
      }

      // Retención Dinámica
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.text("Retención de Alumno por Profesor (Evolución)", 14, currentY);
      
      if (profesoresRetencionFiltrados.length > 0) {
        autoTable(doc, {
          ...baseTableStyles,
          startY: currentY + 4,
          head: [['Profesor', 'Clase/Esp.', 'Sesión 1', 'Sesión 2', 'Sesión 3', 'Sesión 4']],
          body: profesoresRetencionFiltrados.map(r => [
            r.profesor, 
            r.clase, 
            r.sesiones?.[0] ? `${r.sesiones[0].presentes}\n(${r.sesiones[0].fecha})` : '-',
            r.sesiones?.[1] ? `${r.sesiones[1].presentes}\n(${r.sesiones[1].fecha})` : '-',
            r.sesiones?.[2] ? `${r.sesiones[2].presentes}\n(${r.sesiones[2].fecha})` : '-',
            r.sesiones?.[3] ? `${r.sesiones[3].presentes}\n(${r.sesiones[3].fecha})` : '-'
          ]),
          styles: { ...baseTableStyles.styles, cellPadding: 2, fontSize: 8 },
          columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 35 }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' } }
        });
        currentY = doc.lastAutoTable.finalY + 14;
      } else {
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139);
        doc.text("No hay clases fijas para analizar retención en este rango.", 14, currentY + 6);
        doc.setTextColor(0, 0, 0);
        currentY += 16;
      }

      // Profesores Dados de Baja
      if (reporte.profesores_eliminados?.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.text("Profesores Dados de Baja (Histórico)", 14, currentY);
        autoTable(doc, {
          ...baseTableStyles,
          startY: currentY + 4,
          head: [['Nombre', 'Fecha de Baja']],
          body: reporte.profesores_eliminados.map(p => [p.nombre, new Date(p.fecha_baja).toLocaleDateString()]),
          columnStyles: { 0: { cellWidth: 80 } }
        });
      }

      doc.save(filename);
    }
  };

  return (
    <div style={s.contenedor}>
      <ReportesHeader 
        titulo="Concurrencia y Performance de Profesores"
        bajada="Auditoría del personal médico, carga de trabajo y rendimiento por cupos."
        fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
        fechaFin={fechaFin} setFechaFin={setFechaFin}
        manejarSubmit={manejarGeneracionManual}
        cargando={cargando} errorValidacion={errorValidacion} consultarFechas={consultarFechas}
      />

      {reporte && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Prof. Tren Superior</span>
              <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>{reporte.resumen?.tren_superior || 0}</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Prof. Tren Inferior</span>
              <p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>{reporte.resumen?.tren_inferior || 0}</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Prof. Tren Medio</span>
              <p style={{ ...s.valorMini, color: '#0f766e' }}>{reporte.resumen?.tren_medio || 0}</p>
            </div>
          </div>

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
              Concurrencia de Profesores
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
            </h2>
            
            {hayDatos ? (
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('nombre')}>Kinesiólogo</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('total_alumnos_atendidos')}>Alumnos Atendidos</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('total_cancelaciones_recibidas')}>Ausencias</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('cantidad_clases_dictadas')}>Clases Dadas</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('porcentaje_ocupacion_clases')}>Uso de Cupos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profesoresOrdenados.map((p, i) => {
                      const atendidos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.atendidos ?? 0) : p.total_alumnos_atendidos;
                      const cancelados = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cancelados ?? 0) : p.total_cancelaciones_recibidas;
                      const cupos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.uso_cupos ?? 0.0) : p.porcentaje_ocupacion_clases;
                      const clasesDictadas = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cantidad_clases_dictadas ?? 0) : p.cantidad_clases_dictadas;
                      
                      const matchesFiltro = !filtroEspecialidad || clasesDictadas > 0;
                      if (!matchesFiltro && filtroEspecialidad) return null;

                      return (
                        <tr key={i} style={{ background: filtroEspecialidad ? '#f0fdf4' : 'transparent' }}>
                          <td style={s.td}><strong>{p.nombre}</strong></td>
                          <td style={s.td}>{atendidos}</td>
                          <td style={s.td}>{cancelados}</td>
                          <td style={s.td}>{clasesDictadas}</td>
                          <td style={s.td}>
                            <span style={{ ...s.badgePorcentaje, background: '#eff6ff', color: '#1d4ed8' }}>{cupos}%</span>
                          </td>
                        </tr>
                      );
                    })}

                    <tr style={{ background: '#f8fafc', borderTop: '2px solid var(--color-borde)', fontWeight: 'bold' }}>
                      <td style={{ ...s.td, color: 'var(--color-primario-oscuro)' }}><strong>Totales / Promedios</strong></td>
                      <td style={s.td}>{totalAtendidosGlobal}</td>
                      <td style={s.td}>{totalCanceladosGlobal}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badgePorcentaje, background: '#e0f2fe', color: '#0369a1' }}>
                          {totalClasesDictadasGlobal}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.badgePorcentaje, background: '#eff6ff', color: '#1d4ed8' }}>
                          {promedioCuposGlobal}%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <ReportesEmptyState entidad="clases dictadas por los profesionales" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Absentismo del Staff (Registro de Faltas)
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
            </h2>
            <p style={s.bajada}>Muestra a los profesionales que tomaron una actividad pero finalizaron dándose de baja (sin volver a recuperarla).</p>
            
            {absentismoFiltrado.length > 0 ? (
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable}>Profesor</th>
                      <th style={s.thOrdenable}>Clase Ausentada</th>
                      <th style={s.thOrdenable}>Fecha Actividad</th>
                      <th style={s.thOrdenable}>Especialidad</th>
                      <th style={s.thOrdenable}>Última Acción (Baja)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentismoFiltrado.map((a, i) => (
                      <tr key={i}>
                        <td style={s.td}><strong>{a.profesor}</strong></td>
                        <td style={s.td}>{a.clase}</td>
                        <td style={s.td}>
                          <span style={{ fontSize: '13px', color: '#475569' }}>{a.fecha_actividad}</span>
                        </td>
                        <td style={s.td}>{a.especialidad}</td>
                        <td style={s.td}>
                          <span style={{ ...s.badgePorcentaje, background: '#fee2e2', color: '#b91c1c' }}>
                            {a.fecha_baja ? String(a.fecha_baja).split('.')[0] : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ReportesEmptyState entidad="faltas registradas en el personal" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          {reporte?.profesores_eliminados?.length > 0 && (
            <div style={s.seccionReporte}>
              <h2 style={s.subtitulo}>Profesores Dados de Baja (Histórico)</h2>
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable}>Nombre</th>
                      <th style={s.thOrdenable}>Fecha de Baja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.profesores_eliminados.map((p, i) => (
                      <tr key={i}>
                        <td style={s.td}>{p.nombre}</td>
                        <td style={s.td}>{new Date(p.fecha_baja).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Retención de Alumno por Profesor (Evolución de Sesiones)
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Dinámico en Rango</span>}
            </h2>
            <p style={s.bajada}>Muestra hasta 4 sesiones consecutivas de una clase para medir la fluctuación de alumnos. Las sesiones sombreadas en gris cayeron fuera de tu rango de fechas seleccionado.</p>
            
            {profesoresRetencionFiltrados?.length > 0 ? (
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable}>Profesor</th>
                      <th style={s.thOrdenable}>Clase / Esp.</th>
                      <th style={{...s.thOrdenable, textAlign: 'center'}}>Sesión 1</th>
                      <th style={{...s.thOrdenable, textAlign: 'center'}}>Sesión 2</th>
                      <th style={{...s.thOrdenable, textAlign: 'center'}}>Sesión 3</th>
                      <th style={{...s.thOrdenable, textAlign: 'center'}}>Sesión 4</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profesoresRetencionFiltrados.map((r, i) => (
                      <tr key={i}>
                        <td style={s.td}><strong>{r.profesor}</strong></td>
                        <td style={s.td}>{r.clase}</td>
                        
                        {/* Iteramos para dibujar las 4 sesiones posibles */}
                        {[0, 1, 2, 3].map(index => {
                          const sesion = r.sesiones?.[index];
                          return (
                            <td key={index} style={{ ...s.td, textAlign: 'center' }}>
                              {sesion ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                  <span style={{
                                    ...s.badgePorcentaje, 
                                    background: sesion.in_range ? '#e0f2fe' : '#f1f5f9', 
                                    color: sesion.in_range ? '#0369a1' : '#64748b'
                                  }}>
                                    {sesion.presentes} asist.
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                                    {sesion.fecha}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ReportesEmptyState entidad="clases fijas para analizar retención en este rango" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          <ReportesExportar tipoReporte="Staff" onExport={handleExport} />
        </>
      )}
    </div>
  );
}