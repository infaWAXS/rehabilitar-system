import React, { useState } from 'react';
import { getRoomsReport } from '../../../services/reportsService';
import { s } from './reportesStyles';
import ReportesHeader from './components/ReportesHeader';
import ReportesExportar from './components/ReportesExportar';
import ReportesEmptyState from './components/ReportesEmptyState';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function SalasReportes() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');

  const consultarFechas = async (inicio, fin) => {
    setErrorValidacion(''); setReporte(null); setFiltroEspecialidad('');
    try {
      setCargando(true);
      const data = await getRoomsReport(inicio, fin);
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

  const opcionesEspecialidades = reporte?.ocupacion_aulas?.[0]?.por_especialidad 
    ? Object.keys(reporte.ocupacion_aulas[0].por_especialidad).filter(k => !k.includes('_cantidad_usos')).sort() 
    : [];

  const listaHorarios = reporte?.mapa_calor?.[0]?.horas 
    ? Object.keys(reporte.mapa_calor[0].horas).sort() 
    : [];
  
  const totalUsosGlobal = reporte?.ocupacion_aulas?.reduce((acc, a) => acc + (a.cantidad_usos ?? 0), 0) || 0;
  
  const totalUsosFiltrados = reporte?.ocupacion_aulas?.reduce((acc, a) => {
    const usos = filtroEspecialidad ? (a.por_especialidad?.[`${filtroEspecialidad}_cantidad_usos`] ?? 0) : (a.cantidad_usos ?? 0);
    return acc + usos;
  }, 0) || 0;

  // Filtrado Reactivo para el Top 5
  const topClasesFiltradas = reporte?.top_clases?.filter(c => 
    filtroEspecialidad ? c.especialidad === filtroEspecialidad : true
  ) || [];


/*

    XLSX.writeFile(wb, filename);
  } else {
    // Lógica PDF: usa el mismo patrón de autoTable con checkPageBreak del reporte de clientes
    const doc = new jsPDF();
    doc.text("Reporte de Salas", 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [['Sala', 'Capacidad', 'Usos', 'Reserva %', 'Ocupación %']],
      body: reporte.ocupacion_aulas.map(a => [a.aula, a.capacidad, a.cantidad_usos, `${a.porcentaje_reserva}%`, `${a.porcentaje_ocupacion}%`]),
      styles: { fontSize: 9 }
    });
    doc.save(filename);
  }
}
*/

  // ─────────────────────────────────────────────────────────
  // LÓGICA DE EXPORTACIÓN DETALLADA (PDF / EXCEL)
  // ─────────────────────────────────────────────────────────
  const handleExport = (formato) => {
    if (!reporte) return;
    const anioActual = new Date().getFullYear();
    const tituloFiltro = filtroEspecialidad ? `_${filtroEspecialidad}` : '_Global';
    const filename = `Reporte_Salas${tituloFiltro}_${anioActual}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;

    if (formato === 'excel') {
      const wb = XLSX.utils.book_new();

      // Pestaña 1: Resumen General
      const wsResumen = XLSX.utils.json_to_sheet([
        { "Métrica": "Ocupación Promedio", "Valor": reporte.resumen?.ocupacion_promedio || 0 },
        { "Métrica": "Salas Reservadas", "Valor": reporte.resumen?.salas_reservadas || 0 },
        { "Métrica": "Lista de Espera", "Valor": reporte.resumen?.lista_espera || 0 },
      ]);
      wsResumen['!cols'] = [{ wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

      // Pestaña 2: Mapa de Calor (Ocupación de Infraestructura)
      if (reporte.mapa_infraestructura && listaHorarios.length > 0) {
        const dataMapaInfra = reporte.mapa_infraestructura.map(row => {
          // Definimos la columna fija del grid con el nombre del día
          const fila = { "Día / Módulo": row.dia };
          
          // Iteramos sobre los horarios para capturar el valor en formato "X/Y"
          listaHorarios.forEach(h => {
            // row.horas[h] ya contiene el string "usadas/totales" (ej: "4/364")
            fila[`${h} hs`] = row.horas[h] || "0/0";
          });
          return fila;
        });

        const wsMapa = XLSX.utils.json_to_sheet(dataMapaInfra);

        // Ajuste de legibilidad:
        // La columna del día es más ancha (15)
        // Las columnas de horarios son de 12 para que el texto "XXX/XXX" entre cómodo
        const colWidths = [{ wch: 15 }];
        listaHorarios.forEach(() => colWidths.push({ wch: 12 }));
        
        wsMapa['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, wsMapa, "Mapa Ocupación Aulas");
      }


      // Pestaña: Ocupación de Salas
      const dataSalas = reporte.ocupacion_aulas
        .filter(a => {
          // Aplicamos el filtro si existe
          const pct = filtroEspecialidad ? (a.por_especialidad?.[filtroEspecialidad] ?? 0) : a.porcentaje_ocupacion;
          return !filtroEspecialidad || pct > 0;
        })
        .map(a => {
          const pctRender = filtroEspecialidad ? (a.por_especialidad?.[filtroEspecialidad] ?? 0) : a.porcentaje_ocupacion;
          const usosRender = filtroEspecialidad ? (a.por_especialidad?.[`${filtroEspecialidad}_cantidad_usos`] ?? 0) : a.cantidad_usos;
          
          return {
            "Espacio Físico": a.aula,
            "Capacidad": a.capacidad,
            "Usos Totales": usosRender,
            "Tasa Reserva %": `${a.porcentaje_reserva}%`,
            "Ocupación (Anotados) %": `${pctRender}%`,
            "Presentismo %": `${a.porcentaje_presentes}%`
          };
        });

      const wsSalas = XLSX.utils.json_to_sheet(dataSalas);

      // Ajuste de legibilidad (anchos en caracteres)
      wsSalas['!cols'] = [
        { wch: 20 }, // Espacio Físico
        { wch: 12 }, // Capacidad
        { wch: 12 }, // Usos
        { wch: 15 }, // Tasa Reserva
        { wch: 20 }, // Ocupación %
        { wch: 15 }  // Presentismo
      ];

      XLSX.utils.book_append_sheet(wb, wsSalas, "Ocupación de Salas");

      // Pestaña: Ocupación Fija por Sala
      const dataOcupacionFija = reporte.ocupacion_aulas
        .filter(a => {
          const pct = filtroEspecialidad ? (a.por_especialidad?.[filtroEspecialidad] ?? 0) : a.porcentaje_ocupacion;
          return !filtroEspecialidad || pct > 0;
        })
        .map(a => {
          const pctRender = filtroEspecialidad ? (a.por_especialidad?.[filtroEspecialidad] ?? 0) : a.porcentaje_ocupacion;
          const usosRender = filtroEspecialidad ? (a.por_especialidad?.[`${filtroEspecialidad}_cantidad_usos`] ?? 0) : a.cantidad_usos;
          
          return {
            "Espacio Físico": a.aula,
            "Capacidad": a.capacidad,
            "Usos Totales": usosRender,
            "Tasa Reserva %": `${a.porcentaje_reserva}%`,
            "Ocupación (Anotados) %": `${pctRender}%`,
            "Presentismo %": `${a.porcentaje_presentes}%`
          };
        });

      const wsOcupacion = XLSX.utils.json_to_sheet(dataOcupacionFija);

      // Ajuste de legibilidad: anchos definidos para columnas claras
      wsOcupacion['!cols'] = [
        { wch: 25 }, // Espacio Físico
        { wch: 12 }, // Capacidad
        { wch: 12 }, // Usos
        { wch: 18 }, // Tasa Reserva %
        { wch: 25 }, // Ocupación %
        { wch: 18 }  // Presentismo %
      ];

      XLSX.utils.book_append_sheet(wb, wsOcupacion, "Ocupación por Sala");

    } else if (formato === 'pdf') {
      const doc = new jsPDF();
      let currentY = 14;

      const checkPageBreak = (espacioNecesario) => {
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        if (currentY + espacioNecesario >= pageHeight - 10) { doc.addPage(); currentY = 14; }
      };

      // Título
      doc.setFontSize(18);
      doc.text(`Reporte de Salas ${anioActual}`, 14, currentY);
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
      doc.setFontSize(11);
      doc.text(`Prof. Tren Superior: ${reporte.resumen?.tren_superior || 0}`, 14, currentY); currentY += 6;
      doc.text(`Prof. Tren Inferior: ${reporte.resumen?.tren_inferior || 0}`, 14, currentY); currentY += 6;
      doc.text(`Prof. Tren Medio: ${reporte.resumen?.tren_medio || 0}`, 14, currentY); currentY += 14;

      const baseTableStyles = {
        theme: 'striped',
        headStyles: { fillColor: [15, 118, 110], fontSize: 11, halign: 'center' },
        bodyStyles: { fontSize: 10, valign: 'middle' },
        styles: { cellPadding: 5, overflow: 'linebreak' },
        margin: { top: 14 }
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
        head: [['Kinesiólogo', 'Atendidos', 'Ausencias', 'Clases Dadas', 'Cupos (%)']],
        body: bodyConcurrencia,
        columnStyles: { 0: { cellWidth: 55 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } }
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

      // Retención
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.text("Retención de Alumno por Profesor", 14, currentY);
      
      if (profesoresRetencionFiltrados.length > 0) {
        autoTable(doc, {
          ...baseTableStyles,
          startY: currentY + 4,
          head: [['Profesor', 'Clase/Esp.', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']],
          body: profesoresRetencionFiltrados.map(r => [r.profesor, r.clase, r.semana_1, r.semana_2, r.semana_3, r.semana_4]),
          columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 45 }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' } }
        });
        currentY = doc.lastAutoTable.finalY + 14;
      } else {
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139);
        doc.text("No hay clases fijas para analizar retención.", 14, currentY + 6);
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
        titulo="Logística de Salas y Actividades"
        bajada="Optimización del espacio físico y control de ocupación edilicia."
        fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
        fechaFin={fechaFin} setFechaFin={setFechaFin}
        manejarSubmit={manejarGeneracionManual}
        cargando={cargando} errorValidacion={errorValidacion} consultarFechas={consultarFechas}
      />

      {reporte && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Ocupación Promedio de Salas</span>
              <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>{reporte.resumen?.ocupacion_promedio || 0}%</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Salas Reservadas</span>
              <p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>{reporte.resumen?.salas_reservadas || 0}</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Gente en Lista de Espera</span>
              <p style={{ ...s.valorMini, color: '#e11d48' }}>{reporte.resumen?.lista_espera || 0}</p>
            </div>
          </div>

          {/* MAPA 1: INFRAESTRUCTURA (AHORA ARRIBA DE TODO, ANTES DEL FILTRO) */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Mapa de Calor: Ocupación de Infraestructura (Aulas)
              <span style={s.badgeGlobalTitulo}>Global (Fijo)</span>
            </h2>
            <p style={s.bajada}>Cantidad de espacios físicos utilizados sobre el total de aulas disponibles en el rango.</p>
            {totalUsosGlobal > 0 ? (
              <div style={s.wrapperTabla}>
                <div style={s.gridCalorDinamico(listaHorarios.length)}>
                  <div style={s.celdaCalorCabecera}>Día / Módulo</div>
                  {listaHorarios.map(h => <div key={h} style={s.celdaCalorCabecera}>{h} hs</div>)}
                  {reporte.mapa_infraestructura?.map((row, i) => (
                    <React.Fragment key={i}>
                      <div style={s.celdaCalorDia}><strong>{row.dia}</strong></div>
                      {listaHorarios.map((h, idx) => {
                        const valorVisual = row.horas[h] || "0/0"; 
                        let pctColor = 0;
                        if (typeof valorVisual === 'string' && valorVisual.includes('/')) {
                          const [usadas, totales] = valorVisual.split('/').map(Number);
                          pctColor = totales > 0 ? (usadas / totales) * 100 : 0;
                        }
                        return <div key={idx} style={s.celdaBloque(pctColor)}>{valorVisual}</div>;
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <ReportesEmptyState entidad="usos de infraestructura" filtroEspecialidad="" />
            )}
          </div>

          {/* ÁREA DE FILTRO */}
          <div style={{ ...s.cardFiltros, background: 'var(--color-primario-suave, #f0fbfb)', border: '1px solid var(--color-primario)' }}>
            <div style={s.grupo}>
              <label style={{ ...s.label, color: 'var(--color-primario-oscuro)', fontWeight: '700' }} htmlFor="filtroEsp">Filtrar Segmento Operativo / Especialidad</label>
              <select id="filtroEsp" style={s.select} value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
                <option value="">Mostrar todo (Perspectiva Global)</option>
                {opcionesEspecialidades.map((op, i) => <option key={i} value={op}>{op}</option>)}
              </select>
            </div>
          </div>

          {/* TOP CLASES (AHORA FILTRADO Y DEBAJO DEL SELECT) */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Clases con Mayor Ocupación de Salas
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad} (Top 5)</span> : <span style={s.badgeGlobalTitulo}>Global (Top 5)</span>}
            </h2>
            <p style={s.bajada}>Las clases que más llenan el cupo de su aula asignada.</p>
            
            {topClasesFiltradas.length > 0 ? (
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable}>Nombre de la Clase</th>
                      <th style={s.thOrdenable}>Especialidad</th>
                      <th style={s.thOrdenable}>Aula</th>
                      <th style={s.thOrdenable}>Profesor</th>
                      <th style={s.thOrdenable}>Ocupación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClasesFiltradas.slice(0, 5).map((c, i) => (
                      <tr key={i}>
                        <td style={s.td}><strong>{c.nombre_clase}</strong></td>
                        <td style={s.td}>{c.especialidad}</td>
                        <td style={s.td}>{c.aula}</td>
                        <td style={s.td}>{c.profesor}</td>
                        <td style={s.td}>
                          <span style={{ ...s.badgePorcentaje, background: c.ocupacion > 80 ? '#dcfce7' : '#f1f5f9', color: c.ocupacion > 80 ? '#166534' : '#475569' }}>
                            {c.ocupacion}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
               <ReportesEmptyState entidad="clases reservadas" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          {/* TABLA DE SALAS */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Ocupación Fija por Sala (Métricas del Rango Seleccionado)
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
            </h2>
            <p style={s.bajada}>Rendimiento integral del aula cuando esta ha sido reservada.</p>
            {totalUsosFiltrados > 0 ? (
              <table style={s.tabla}>
                <thead>
                  <tr>
                    <th style={s.thOrdenable}>Espacio Físico</th>
                    <th style={s.thOrdenable}>Capacidad</th>
                    <th style={s.thOrdenable}>Usos</th>
                    <th style={s.thOrdenable}>Tasa Reserva</th>
                    <th style={s.thOrdenable}>Ocupación (Anotados)</th>
                    <th style={s.thOrdenable}>Presentismo</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.ocupacion_aulas?.map((a, i) => {
                    const pctRender = filtroEspecialidad ? (a.por_especialidad?.[filtroEspecialidad] ?? 0) : a.porcentaje_ocupacion;
                    const usosRender = filtroEspecialidad ? (a.por_especialidad?.[`${filtroEspecialidad}_cantidad_usos`] ?? 0) : a.cantidad_usos;
                    const matches = !filtroEspecialidad || pctRender > 0;
                    if (!matches && filtroEspecialidad) return null;

                    return (
                      <tr key={i} style={{ background: filtroEspecialidad ? '#f0fdf4' : 'transparent' }}>
                        <td style={s.td}><strong>{a.aula}</strong></td>
                        <td style={s.td}>{a.capacidad}</td>
                        <td style={s.td}>{usosRender}</td>
                        <td style={s.td}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>{a.porcentaje_reserva}%</span>
                        </td>
                        <td style={s.td}>
                          <span style={s.badgePorcentaje}>{pctRender}%</span> 
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.badgePorcentaje, background: '#dcfce7', color: '#166534' }}>{a.porcentaje_presentes}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <ReportesEmptyState entidad="usos de salas" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          
        </>
      )}
    </div>
  );
}