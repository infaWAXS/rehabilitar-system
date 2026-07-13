import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStatisticsReport } from '../../../services/reportsService';
import { s } from './reportesStyles';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function HubReports() {
  const navigate = useNavigate();
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorValidacion, setErrorValidacion] = useState('');

  const [sortSalas, setSortSalas] = useState({ llave: null, direccion: 'asc' });
  const [sortProfesores, setSortProfesores] = useState({ llave: null, direccion: 'asc' });

  const anioActual = new Date().getFullYear();

  useEffect(() => {
    const cargarResumenAnual = async () => {
      try {
        setCargando(true);
        const hoy = new Date();
        const anio = hoy.getFullYear();

        const inicio = `${anio}-01-01`;
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        const fin = `${anio}-${mes}-${dia}`;

        const data = await getStatisticsReport(inicio, fin);
        setReporte(data);
      } catch (err) {
        setErrorValidacion(err.message || 'Error al cargar el resumen anual. (Revisa tu sesión)');
      } finally {
        setCargando(false);
      }
    };

    cargarResumenAnual();
  }, []);

  const cambiarOrden = (llave, estadoActual, setEstado) => {
    const direccion = estadoActual.llave === llave && estadoActual.direccion === 'asc' ? 'desc' : 'asc';
    setEstado({ llave, direccion });
  };

  const renderFlecha = (llave, estado) => {
    if (estado.llave !== llave) return ' ↕';
    return estado.direccion === 'asc' ? ' ▲' : ' ▼';
  };

  const procesarOrdenamiento = (datos, configuracion) => {
    if (!configuracion.llave) return datos;
    const copia = [...datos];
    copia.sort((a, b) => {
      let valA = a[configuracion.llave]; 
      let valB = b[configuracion.llave];
      if (typeof valA === 'string') return configuracion.direccion === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return configuracion.direccion === 'asc' ? valA - valB : valB - valA;
    });
    return copia;
  };

  const salasOrdenadas = reporte ? procesarOrdenamiento(reporte.ocupacion_aulas, sortSalas) : [];
  const profesoresOrdenados = reporte ? procesarOrdenamiento(reporte.profesores_mayor_concurrencia, sortProfesores) : [];
  const listaHorarios = reporte?.mapa_calor?.[0] ? Object.keys(reporte.mapa_calor[0].horas).sort() : [];

  const handleExport = (formato) => {
    if (!reporte) return;
    const filename = `Hub_Estadistico_Completo_${anioActual}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;

    if (formato === 'excel') {
      const wb = XLSX.utils.book_new();

      const wsResumen = XLSX.utils.json_to_sheet([{
        "Métrica": "Clientes Totales", "Valor": reporte.resumen.clientes_totales
      }, {
        "Métrica": "Ingresos por Planes", "Valor": `$${reporte.resumen.ingresos_totales}`
      }, {
        "Métrica": "Staff de Profesores", "Valor": reporte.resumen.profesores_totales
      }, {
        "Métrica": "Tasa de Presentismo Promedio", "Valor": `${100 - reporte.resumen.tasa_ausentismo}%`
      }]);
      wsResumen['!cols'] = [{ wch: 35 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen General");

      if (reporte.mapa_calor && listaHorarios.length > 0) {
        const dataMapaCalor = reporte.mapa_calor.map(row => {
          const fila = { "Día / Módulo": row.dia };
          listaHorarios.forEach(h => {
            fila[`${h} hs`] = `${row.horas[h]?.general ?? 0.0}%`;
          });
          return fila;
        });
        const wsMapa = XLSX.utils.json_to_sheet(dataMapaCalor);
        const colWidths = [{ wch: 15 }];
        listaHorarios.forEach(() => colWidths.push({ wch: 10 }));
        wsMapa['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(wb, wsMapa, "Mapa de Calor");
      }

      const wsSalas = XLSX.utils.json_to_sheet(reporte.ocupacion_aulas.map(a => ({
        "Espacio Físico": a.aula, "Capacidad Máxima": a.capacidad_maxima, "Usos Totales": a.cantidad_usos
      })));
      wsSalas['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsSalas, "Ocupación de Salas");

      const wsProfes = XLSX.utils.json_to_sheet(reporte.profesores_mayor_concurrencia.map(p => ({
        "Kinesiólogo": p.nombre, "Alumnos Atendidos": p.total_alumnos_atendidos, "Clases Dadas": p.cantidad_clases_dictadas
      })));
      wsProfes['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsProfes, "Concurrencia Profesores");

      if (reporte.evolucion_temporal?.datos) {
        const wsFinanzas = XLSX.utils.json_to_sheet(reporte.evolucion_temporal.datos.map(f => ({
          "Mes": f.mes_corto, "Ingresos Brutos": `$${f.ingresos_brutos}`
        })));
        wsFinanzas['!cols'] = [{ wch: 20 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, wsFinanzas, "Evolución Financiera");
      }

      XLSX.writeFile(wb, filename);

    } else if (formato === 'pdf') {
      const doc = new jsPDF();
      let currentY = 14;
      
      const checkPageBreak = (espacioNecesario) => {
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        if (currentY + espacioNecesario >= pageHeight - 10) {
          doc.addPage();
          currentY = 14;
        }
      };

      doc.setFontSize(18);
      doc.text(`Centro de Control: Hub Estadistico ${anioActual}`, 14, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.text(`Clientes Totales: ${reporte.resumen.clientes_totales}`, 14, currentY); currentY += 6;
      doc.text(`Ingresos por Planes: $${Number(reporte.resumen.ingresos_totales).toLocaleString('es-AR')}`, 14, currentY); currentY += 6;
      doc.text(`Staff de Profesores: ${reporte.resumen.profesores_totales}`, 14, currentY); currentY += 6;
      doc.text(`Tasa de Presentismo: ${100 - (reporte.resumen.tasa_ausentismo || 0)}%`, 14, currentY);

      const baseTableStyles = {
        theme: 'striped',
        headStyles: { fillColor: [15, 118, 110], fontSize: 12, halign: 'center' },
        bodyStyles: { fontSize: 10, valign: 'middle' },
        styles: { cellPadding: 5, overflow: 'linebreak' },
        margin: { top: 14 }
      };

      if (reporte.mapa_calor && listaHorarios.length > 0) {
        checkPageBreak(50);
        doc.setFontSize(14);
        doc.text("Mapa de Calor: Ocupacion (%)", 14, currentY);
        
        const bodyMapa = reporte.mapa_calor.map(row => {
          const celdasHoras = listaHorarios.map(h => `${row.horas[h]?.general ?? 0.0}%`);
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

      checkPageBreak(30);
      doc.setFontSize(14);
      doc.text("Ocupacion de Salas", 14, currentY);
      autoTable(doc, {
        ...baseTableStyles,
        startY: currentY + 4,
        head: [['Espacio Físico', 'Capacidad Máxima', 'Usos Totales']],
        body: reporte.ocupacion_aulas.map(a => [a.aula, `${a.capacidad_maxima} alumnos`, a.cantidad_usos]),
        columnStyles: { 0: { cellWidth: 70 }, 1: { halign: 'center' }, 2: { halign: 'center' } }
      });
      currentY = doc.lastAutoTable.finalY + 14;

      checkPageBreak(30);
      doc.setFontSize(14);
      doc.text("Concurrencia de Profesores", 14, currentY);
      autoTable(doc, {
        ...baseTableStyles,
        startY: currentY + 4,
        head: [['Kinesiologo', 'Alumnos Atendidos', 'Clases Dadas']],
        body: reporte.profesores_mayor_concurrencia.map(p => [p.nombre, p.total_alumnos_atendidos, p.cantidad_clases_dictadas]),
        columnStyles: { 0: { cellWidth: 70 }, 1: { halign: 'center' }, 2: { halign: 'center' } }
      });
      currentY = doc.lastAutoTable.finalY + 14;

      if (reporte.evolucion_temporal?.datos) {
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.text("Evolucion Financiera Mensual", 14, currentY);
        autoTable(doc, {
          ...baseTableStyles,
          startY: currentY + 4,
          head: [['Mes', 'Ingresos Brutos']],
          body: reporte.evolucion_temporal.datos.map(f => [f.mes_corto, `$${Number(f.ingresos_brutos).toLocaleString('es-AR')}`]),
          columnStyles: { 0: { halign: 'center', cellWidth: 50 }, 1: { halign: 'center', cellWidth: 60 } }
        });
      }
      doc.save(filename);
    }
  };

  return (
    <div style={s.contenedor}>
      <h1 style={s.titulo}>Centro de Control: Hub Estadístico</h1>
      <p style={s.bajada}>Vista ejecutiva del estado de salud del centro (Resumen Anual {anioActual}).</p>

      {cargando && (
        <p style={{ color: 'var(--color-texto-suave)', fontWeight: '600', fontSize: '15px' }}>
          Cargando métricas anuales...
        </p>
      )}
      
      {errorValidacion && <div style={s.error}>{errorValidacion}</div>}

      {reporte && (
        <>
          <div style={s.gridResumen}>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Clientes Totales</span>
              <p style={s.valorMini}>{reporte.resumen.clientes_totales}</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Ingresos Generales</span>
              <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>
                ${Number(reporte.resumen.ingresos_totales).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Staff de Profesores</span>
              <p style={{ ...s.valorMini, color: '#0369a1' }}>{reporte.resumen.profesores_totales}</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Presentismo Promedio</span>
              <p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>
                {100 - (reporte.resumen.tasa_ausentismo || 0)}%
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '16px', marginBottom: '32px' }}>
            <div style={{ background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))', padding: '2px', borderRadius: '8px' }}>
              <button style={{ ...s.boton, background: '#f4f9f9', color: 'var(--color-primario-oscuro)', width: '100%', border: 'none', margin: 0 }} onClick={() => navigate('/admin/reportes/clientes')}>
                Control registros →
              </button>
            </div>
            <div style={{ background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))', padding: '2px', borderRadius: '8px' }}>
              <button style={{ ...s.boton, background: '#f4f9f9', color: 'var(--color-primario-oscuro)', width: '100%', border: 'none', margin: 0 }} onClick={() => navigate('/admin/reportes/finanzas')}>
                Ir a Finanzas →
              </button>
            </div>
            <div style={{ background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))', padding: '2px', borderRadius: '8px' }}>
              <button style={{ ...s.boton, background: '#f4f9f9', color: 'var(--color-primario-oscuro)', width: '100%', border: 'none', margin: 0 }} onClick={() => navigate('/admin/reportes/staff')}>
                Auditoría de Staff →
              </button>
            </div>
            <div style={{ background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))', padding: '2px', borderRadius: '8px' }}>
              <button style={{ ...s.boton, background: '#f4f9f9', color: 'var(--color-primario-oscuro)', width: '100%', border: 'none', margin: 0 }} onClick={() => navigate('/admin/reportes/salas')}>
                Logística de Salas →
              </button>
            </div>
          </div>

          {reporte.mapa_calor && (
            <div style={s.seccionReporte}>
              <h2 style={s.subtitulo}>
                Mapa de Calor: Concurrencia de Alumnos (Grid)
                <span style={s.badgeGlobalTitulo}>{anioActual}</span>
              </h2>
              <p style={s.bajada}>Ocupación real anual basada en el flujo de asistencia sobre cupos ofertados (08:00 a 20:00 hs).</p>
              <div style={s.wrapperTabla}>
                <div style={s.gridCalorDinamico(listaHorarios.length)}>
                  <div style={s.celdaCalorCabecera}>Día / Módulo</div>
                  {listaHorarios.map((h, i) => <div key={i} style={s.celdaCalorCabecera}>{h} hs</div>)}
                  {reporte.mapa_calor.map((row, i) => (
                    <React.Fragment key={i}>
                      <div style={s.celdaCalorDia}><strong>{row.dia}</strong></div>
                      {listaHorarios.map((h, idx) => {
                        const valorPct = row.horas[h]?.general ?? 0.0;
                        return <div key={idx} style={s.celdaBloque(valorPct)}>{valorPct}%</div>;
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <button style={{ ...s.boton, width: '100%', marginTop: '24px' }} onClick={() => navigate('/admin/reportes/clientes')}>
                Control Alumnos →
              </button>
            </div>
          )}

          <div style={s.gridDividido}>
            <div style={s.seccionReporte}>
              <h2 style={s.subtitulo}>
                Ocupación de Salas
                <span style={s.badgeGlobalTitulo}>{anioActual}</span>
              </h2>
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('aula', sortSalas, setSortSalas)}>Espacio Físico{renderFlecha('aula', sortSalas)}</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('capacidad_maxima', sortSalas, setSortSalas)}>Capacidad{renderFlecha('capacidad_maxima', sortSalas)}</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('cantidad_usos', sortSalas, setSortSalas)}>Usos Totales{renderFlecha('cantidad_usos', sortSalas)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salasOrdenadas.map((a, i) => (
                      <tr key={i}>
                        <td style={s.td}>{a.aula}</td>
                        <td style={s.td}>{a.capacidad_maxima} alumnos</td>
                        <td style={s.td}>
                          <span style={{ fontSize: '14px', color: 'var(--color-primario-oscuro)', fontWeight: '700' }}>
                            {a.cantidad_usos} {a.cantidad_usos === 1 ? 'uso' : 'usos'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button style={{ ...s.boton, width: '100%', marginTop: '24px' }} onClick={() => navigate('/admin/reportes/salas')}>
                Reporte Salas →
              </button>
            </div>

            <div style={s.seccionReporte}>
              <h2 style={s.subtitulo}>
                Concurrencia de Profesores
                <span style={s.badgeGlobalTitulo}>{anioActual}</span>
              </h2>
              <div style={s.wrapperTabla}>
                <table style={s.tabla}>
                  <thead>
                    <tr>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('nombre', sortProfesores, setSortProfesores)}>Kinesiólogo{renderFlecha('nombre', sortProfesores)}</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('total_alumnos_atendidos', sortProfesores, setSortProfesores)}>Alumnos{renderFlecha('total_alumnos_atendidos', sortProfesores)}</th>
                      <th style={s.thOrdenable} onClick={() => cambiarOrden('cantidad_clases_dictadas', sortProfesores, setSortProfesores)}>Clases Dadas{renderFlecha('cantidad_clases_dictadas', sortProfesores)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profesoresOrdenados.map((p, i) => (
                      <tr key={i}>
                        <td style={s.td}><strong>{p.nombre}</strong></td>
                        <td style={s.td}>{p.total_alumnos_atendidos}</td>
                        <td style={s.td}>
                          <span style={{ fontSize: '14px', color: 'var(--color-primario-oscuro)', fontWeight: '700' }}>
                            {p.cantidad_clases_dictadas} {p.cantidad_clases_dictadas === 1 ? 'clase dada' : 'clases dadas'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button style={{ ...s.boton, width: '100%', marginTop: '24px' }} onClick={() => navigate('/admin/reportes/staff')}>
                Reporte Staff →
              </button>
            </div>
          </div>

          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Evolución Financiera Mensual
              <span style={s.badgeGlobalTitulo}>{anioActual}</span>
            </h2>
            <p style={s.bajada}>Ganancias brutas (Planes y Transacciones individuales) generadas por mes durante el año.</p>
            
            <div style={s.contenedorGrafico}>
              {reporte.evolucion_temporal?.datos && (() => {
                const datosMeses = reporte.evolucion_temporal.datos;
                const maxIngreso = Math.max(...datosMeses.map(d => d.ingresos_brutos), 1); 

                return datosMeses.map((d, i) => {
                  const alturaPorcentaje = (d.ingresos_brutos / maxIngreso) * 100;
                  const textoTooltip = d.ingresos_brutos >= 1000 
                    ? `$${(d.ingresos_brutos / 1000).toFixed(1)}k` 
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

            <button style={{ ...s.boton, width: '100%', marginTop: '40px' }} onClick={() => navigate('/admin/reportes/finanzas')}>
              Reporte Financiero →
            </button>
          </div>

          <div style={{ ...s.seccionReporte, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h2 style={s.subtitulo}>Exportar Datos del Hub</h2>
            <p style={s.bajada}>Descarga todas las estadísticas mostradas unificadas en un solo archivo.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontWeight: '600', color: 'var(--color-texto)' }}>Exportar Todas las Estadísticas</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleExport('pdf')} style={{ ...s.boton, padding: '8px 16px', fontSize: '13px', height: 'auto', background: '#ef4444' }}>PDF</button>
                  <button onClick={() => handleExport('excel')} style={{ ...s.boton, padding: '8px 16px', fontSize: '13px', height: 'auto', background: '#10b981' }}>EXCEL</button>
                </div>
              </div>
            </div>
          </div>

        </>
      )}
    </div>
  );
}