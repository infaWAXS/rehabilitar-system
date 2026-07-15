import React, { useState } from 'react';
import { getStaffReport } from '../../../services/reportsService';
import { s } from './reportesStyles';
import ReportesHeader from './components/ReportesHeader';
import ReportesExportar from './components/ReportesExportar';
import ReportesEmptyState from './components/ReportesEmptyState';

// IMPORTACIONES PARA EXPORTACIÓN
import { baseTableStyles, inicializarPDF, generarPrefacioExcel, exportarAExcel } from './utils/reportesUtils';
import ReportesAlertaModal from './components/ReportesAlertaModal';
import autoTable from 'jspdf-autotable';

export default function StaffReportes() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [sortProfesores, setSortProfesores] = useState({ llave: null, direccion: 'asc' });
  const [alertaCustom, setAlertaCustom] = useState({ visible: false, mensaje: "" });

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


  const handleExport = (formato) => {
    if (!reporte) return;

    // 🚨 NUEVO: Declarar la constante para que no tire ReferenceError
    const tieneDatosParaExportar = totalClasesDictadasGlobal > 0;

    // Bloqueo preventivo si no hay datos de asistencia o clases dadas
    if (!tieneDatosParaExportar) {
      setAlertaCustom({
        visible: true,
        mensaje: "No se puede exportar el reporte porque no hay datos de clases dadas o asistencia registrados para el período o la especialidad seleccionada."
      });
      return;
    }

    const anioActual = new Date().getFullYear();
    const tituloFiltro = filtroEspecialidad ? `_${filtroEspecialidad}` : '_Global';
    const filename = `Reporte_Staff${tituloFiltro}_${anioActual}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;

    const fechaInicioLegible = reporte.rango_fechas?.inicio || fechaInicio.split('-').reverse().join('/');
    const fechaFinLegible = reporte.rango_fechas?.fin || fechaFin.split('-').reverse().join('/');
    const subTextoRango = `Período auditado: del ${fechaInicioLegible} al ${fechaFinLegible}`;

    if (formato === 'excel') {
      const prefacio = generarPrefacioExcel("REPORTE DE DESEMPEÑO DE STAFF Y PROFESIONALES", subTextoRango);

      // Pestaña 1: Resumen General
      const dataResumenRaw = [
        { "Métrica": "Profesionales Activos (Tren Superior)", "Valor": reporte.resumen?.tren_superior || 0 },
        { "Métrica": "Profesionales Activos (Tren Inferior)", "Valor": reporte.resumen?.tren_inferior || 0 },
        { "Métrica": "Profesionales Activos (Tren Medio)", "Valor": reporte.resumen?.tren_medio || 0 }
      ];

      // Pestaña 2: Concurrencia de Profesores
      const dataConcurrenciaRaw = profesoresOrdenados
        .map((p) => {
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
        })
        .filter(p => p["Clases Dadas"] > 0);

      dataConcurrenciaRaw.push({
        "Kinesiólogo": "TOTALES / PROMEDIOS",
        "Alumnos Atendidos": totalAtendidosGlobal,
        "Ausencias": totalCanceladosGlobal,
        "Clases Dadas": totalClasesDictadasGlobal,
        "Uso de Cupos": `${promedioCuposGlobal}%`
      });

      // Pestaña 3: Absentismo de Profesores
      const dataAbsentismoRaw = absentismoFiltrado.map(a => ({
        "Profesor": a.profesor,
        "Clase Ausentada": a.clase,
        "Fecha Actividad": a.fecha_actividad,
        "Especialidad": a.especialidad,
        "Última Acción (Baja)": a.fecha_baja ? String(a.fecha_baja).split('.')[0] : '-'
      }));

      // Pestaña 4: Retención por Profesor
      const dataRetencionRaw = profesoresRetencionFiltrados?.map(r => ({
        "Profesor": r.profesor,
        "Clase / Esp.": r.clase,
        "Sesión 1": r.sesiones?.[0] ? `${r.sesiones[0].presentes} asist. (${r.sesiones[0].fecha})` : '-',
        "Sesión 2": r.sesiones?.[1] ? `${r.sesiones[1].presentes} asist. (${r.sesiones[1].fecha})` : '-',
        "Sesión 3": r.sesiones?.[2] ? `${r.sesiones[2].presentes} asist. (${r.sesiones[2].fecha})` : '-',
        "Sesión 4": r.sesiones?.[3] ? `${r.sesiones[3].presentes} asist. (${r.sesiones[3].fecha})` : '-'
      })) || [];

      // Pestaña 5: Profesores de Baja (Histórico)
      const dataBajasRaw = reporte.profesores_eliminados?.map(p => ({
        "Nombre del Profesional": p.nombre,
        "Fecha de Baja": new Date(p.fecha_baja).toLocaleDateString()
      })) || [];

      const laminas = [
        {
          nombre: "Resumen General",
          cols: [{ wch: 40 }, { wch: 15 }],
          data: [
            ...prefacio,
            Object.keys(dataResumenRaw[0]),
            ...dataResumenRaw.map(obj => Object.values(obj))
          ]
        },
        {
          nombre: "Concurrencia Staff",
          incluir: dataConcurrenciaRaw.length > 1, // Se incluye si hay profesores además de la fila final de Totales
          cols: [{ wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 18 }],
          data: [
            ...prefacio,
            Object.keys(dataConcurrenciaRaw[0] || {}),
            ...dataConcurrenciaRaw.map(obj => Object.values(obj))
          ]
        },
        {
          nombre: "Absentismo",
          incluir: dataAbsentismoRaw.length > 0,
          cols: [{ wch: 30 }, { wch: 25 }, { wch: 18 }, { wch: 20 }, { wch: 25 }],
          data: [
            ...prefacio,
            Object.keys(dataAbsentismoRaw[0] || {}),
            ...dataAbsentismoRaw.map(obj => Object.values(obj))
          ]
        },
        {
          nombre: "Retención Alumnos",
          incluir: dataRetencionRaw.length > 0,
          cols: [{ wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }],
          data: [
            ...prefacio,
            Object.keys(dataRetencionRaw[0] || {}),
            ...dataRetencionRaw.map(obj => Object.values(obj))
          ]
        },
        {
          nombre: "Historial de Bajas",
          incluir: dataBajasRaw.length > 0 && !filtroEspecialidad, // Solo en global
          cols: [{ wch: 30 }, { wch: 20 }],
          data: [
            ...prefacio,
            Object.keys(dataBajasRaw[0] || {}),
            ...dataBajasRaw.map(obj => Object.values(obj))
          ]
        }
      ];

      exportarAExcel(filename, laminas);

    } else if (formato === 'pdf') {
      const { doc, currentY: startY } = inicializarPDF("Reporte de Desempeño del Staff", subTextoRango, filtroEspecialidad);
      let currentY = startY;

      const checkPageBreak = (espacioNecesario) => {
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        if (currentY + espacioNecesario >= pageHeight - 10) { doc.addPage(); currentY = 14; }
      };

      // Resumen
      doc.setFontSize(11);
      doc.text(`Profesionales en Tren Superior: ${reporte.resumen?.tren_superior || 0}`, 14, currentY); currentY += 6;
      doc.text(`Profesionales en Tren Inferior: ${reporte.resumen?.tren_inferior || 0}`, 14, currentY); currentY += 6;
      doc.text(`Profesionales en Tren Medio: ${reporte.resumen?.tren_medio || 0}`, 14, currentY); currentY += 14;

      // Tabla 1: Concurrencia[cite: 12]
      if (profesoresOrdenados.length > 0) {
        checkPageBreak(50);
        doc.setFontSize(13);
        doc.text("Concurrencia y Uso de Cupos por Profesional", 14, currentY);

        const bodyConcurrencia = profesoresOrdenados
          .map((p) => {
            const atendidos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.atendidos ?? 0) : p.total_alumnos_atendidos;
            const cancelados = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cancelados ?? 0) : p.total_cancelaciones_recibidas;
            const cupos = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.uso_cupos ?? 0.0) : p.porcentaje_ocupacion_clases;
            const clasesDictadas = filtroEspecialidad ? (p.por_especialidad?.[filtroEspecialidad]?.cantidad_clases_dictadas ?? 0) : p.cantidad_clases_dictadas;
            return [p.nombre, atendidos, cancelados, clasesDictadas, `${cupos}%`];
          })
          .filter(p => p[3] > 0);

        bodyConcurrencia.push([{ content: 'Totales / Promedios', styles: { fontStyle: 'bold', textColor: [15, 118, 110] } }, totalAtendidosGlobal, totalCanceladosGlobal, totalClasesDictadasGlobal, `${promedioCuposGlobal}%`]);

        autoTable(doc, {
          ...baseTableStyles,
          startY: currentY + 4,
          head: [['Kinesiólogo', 'Alumnos Atend.', 'Ausencias', 'Clases Dadas', 'Uso Cupos']],
          body: bodyConcurrencia,
          columnStyles: {
            0: { cellWidth: 50 },
            1: { halign: 'center', cellWidth: 30 },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'center', cellWidth: 25 },
            4: { halign: 'center', cellWidth: 25 }
          }
        });
        currentY = doc.lastAutoTable.finalY + 14;
      }

      // Tabla 2: Absentismo[cite: 12]
      if (absentismoFiltrado.length > 0) {
        checkPageBreak(50);
        doc.setFontSize(13);
        doc.text("Absentismo del Staff (Registro de Faltas)", 14, currentY);

        const bodyAbsentismo = absentismoFiltrado.map(a => [
          a.profesor,
          a.clase,
          a.fecha_actividad,
          a.especialidad,
          a.fecha_baja ? String(a.fecha_baja).split('.')[0] : '-'
        ]);

        autoTable(doc, {
          ...baseTableStyles,
          startY: currentY + 4,
          head: [['Profesor', 'Clase Ausentada', 'Fecha Actividad', 'Especialidad', 'Fecha Baja']],
          body: bodyAbsentismo,
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 35 },
            2: { halign: 'center', cellWidth: 25 },
            3: { cellWidth: 35 },
            4: { halign: 'center', cellWidth: 35 }
          }
        });
        currentY = doc.lastAutoTable.finalY + 14;
      }

      // Tabla 3: Retención[cite: 12]
      if (profesoresRetencionFiltrados?.length > 0) {
        checkPageBreak(60);
        doc.setFontSize(13);
        doc.text("Retención de Alumno por Profesor", 14, currentY);

        const bodyRetencion = profesoresRetencionFiltrados.map(r => [
          r.profesor,
          r.clase,
          r.sesiones?.[0] ? `${r.sesiones[0].presentes} asist. (${r.sesiones[0].fecha})` : '-',
          r.sesiones?.[1] ? `${r.sesiones[1].presentes} asist. (${r.sesiones[1].fecha})` : '-',
          r.sesiones?.[2] ? `${r.sesiones[2].presentes} asist. (${r.sesiones[2].fecha})` : '-',
          r.sesiones?.[3] ? `${r.sesiones[3].presentes} asist. (${r.sesiones[3].fecha})` : '-'
        ]);

        autoTable(doc, {
          ...baseTableStyles,
          startY: currentY + 4,
          head: [['Profesor', 'Clase / Esp.', 'Sesión 1', 'Sesión 2', 'Sesión 3', 'Sesión 4']],
          body: bodyRetencion,
          styles: { ...baseTableStyles.styles, fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 35 },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'center', cellWidth: 25 },
            4: { halign: 'center', cellWidth: 25 },
            5: { halign: 'center', cellWidth: 25 }
          }
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

      {/* 🚨 NUEVO: MODAL DE ALERTA PROPIO DEL SISTEMA MODULARIZADO */}
      <ReportesAlertaModal 
        visible={alertaCustom.visible}
        mensaje={alertaCustom.mensaje}
        onClose={() => setAlertaCustom({ visible: false, mensaje: "" })}
      />
    </div>
  );
}