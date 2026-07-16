import React, { useState } from 'react';
import { getClientsReport } from '../../../services/reportsService';
import { s } from './reportesStyles';
import ReportesHeader from './components/ReportesHeader';
import ReportesExportar from './components/ReportesExportar';
import ReportesEmptyState from './components/ReportesEmptyState';
import ReportesAlertaModal from './components/ReportesAlertaModal';

import { baseTableStyles, inicializarPDF, generarPrefacioExcel, exportarAExcel } from './utils/reportesUtils';
import autoTable from 'jspdf-autotable';

export default function ClientesReportes() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [alertaCustom, setAlertaCustom] = useState({ visible: false, mensaje: "" });

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

  // Listado oficial de especializaciones permitidas en el sistema
  const ESPECIALIZACIONES = [
    'Kinesiologia deportiva', 'Fisioterapia', 'Kinesiologia neurologica',
    'Rehabilitacion cardiovascular', 'Kinesiologia traumatologica', 'Pilates terapeutico',
    'Kinesiologia pediatrica', 'Osteopatia', 'Acupuntura', 'Masoterapia',
    'Kinesiologia respiratoria', 'Rehabilitacion post-quirurgica',
    'Kinesiologia gerontologica', 'Electroterapia',
  ];

  const opcionesEspecialidades = [...ESPECIALIZACIONES].sort();

  const clasesFiltradas = reporte 
    ? (filtroEspecialidad 
        ? reporte.clase.filter(c => c.tipo === filtroEspecialidad && c.is_clase_individual === true) 
        : reporte.clase.filter(c => c.is_clase_individual === false)) 
    : [];

  const listaHorarios = reporte?.mapa_calor?.[0] ? Object.keys(reporte.mapa_calor[0].horas).sort() : [];
  
  const totales = clasesFiltradas.reduce((acc, c) => ({
    clases: acc.clases + (c.cant_clases || 0),
    cupos: acc.cupos + (c.cupos_iniciales || 0),
    asistencias: acc.asistencias + (c.asistencias || 0),
    inasistencias: acc.inasistencias + (c.inasistencias || 0),
    cancelaciones: acc.cancelaciones + (c.cancelaciones || 0),
    espera: acc.espera + (c.lista_espera || 0)
  }), { clases: 0, cupos: 0, asistencias: 0, inasistencias: 0, cancelaciones: 0, espera: 0 });

  // 🚨 1. DECLARACIONES GLOBALES CORREGIDAS
  const motivosOcultos = ["Acumulación De 3 Faltas Consecutivas", "Inasistencia mayor al 50%"];
  
  const sancionadosFiltrados = reporte?.sancionados || [];

  const statsSanciones = React.useMemo(() => {
    // 🟢 Cambiado para usar sancionadosFiltrados en lugar del pool global del reporte
    if (!sancionadosFiltrados || sancionadosFiltrados.length === 0) {
      return {
        tresFaltas: 0, cincuentaPorciento: 0, otrosMotivos: 0, reincidentes: 0,
        masAntiguo: { nombre: '-', fecha: '' }, masReciente: { nombre: '-', fecha: '' }
      };
    }

    const contadores = { tresFaltas: 0, cincuentaPorciento: 0, otrosMotivos: 0 };
    let registroMasAntiguo = null;
    let registroMasReciente = null;

    sancionadosFiltrados.forEach(user => {
      // 1. Clasificación por motivo
      const motivoStr = user.motivo?.toLowerCase() || '';
      if (motivoStr.includes('3 faltas') || motivoStr.includes('tres faltas') || motivoStr.includes('3_faltas')) {
        contadores.tresFaltas++;
      } else if (motivoStr.includes('50%') || motivoStr.includes('cincuenta')) {
        contadores.cincuentaPorciento++;
      } else {
        contadores.otrosMotivos++;
      }

      // 2. Parseo de fechas (asumiendo formato DD/MM/YYYY que viene en user.fecha_inicio)
      if (user.fecha_inicio) {
        const partes = user.fecha_inicio.split('/');
        const fechaObj = new Date(partes[2], partes[1] - 1, partes[0]);

        if (!registroMasAntiguo || fechaObj < registroMasAntiguo.fechaObj) {
          registroMasAntiguo = { nombre: user.nombre, fecha: user.fecha_inicio, fechaObj };
        }
        if (!registroMasReciente || fechaObj > registroMasReciente.fechaObj) {
          registroMasReciente = { nombre: user.nombre, fecha: user.fecha_inicio, fechaObj };
        }
      }
    });

    return { 
      ...contadores,
      reincidentes: reporte.sanciones_estadisticas?.reincidentes || 0,
      masAntiguo: registroMasAntiguo ? { nombre: registroMasAntiguo.nombre, fecha: registroMasAntiguo.fecha } : { nombre: '-', fecha: '' },
      masReciente: registroMasReciente ? { nombre: registroMasReciente.nombre, fecha: registroMasReciente.fecha } : { nombre: '-', fecha: '' }
    };
  }, [sancionadosFiltrados, reporte]); // Depende de la lista filtrada por fechas

  // 🚨 2. CONTROL REACTIVO DE DATOS
  const tieneDatosConcurrencia = clasesFiltradas.length > 0 && totales.clases > 0;

  const tieneDatosMapa = React.useMemo(() => {
    if (!reporte?.mapa_calor || listaHorarios.length === 0) return false;
    return reporte.mapa_calor.some(row => 
      listaHorarios.some(h => {
        const cellData = row.horas[h];
        const valorPct = filtroEspecialidad ? (cellData?.[filtroEspecialidad] ?? 0.0) : (cellData?.general ?? 0.0);
        return valorPct > 0;
      })
    );
  }, [reporte, listaHorarios, filtroEspecialidad]);

  // Regla estricta: si hay filtro, evalúa solo concurrencia/mapa. Si es global, evalúa también sanciones/resumen.
  const tieneDatosParaExportar = filtroEspecialidad 
    ? (tieneDatosConcurrencia || tieneDatosMapa)
    : (
        tieneDatosConcurrencia || 
        tieneDatosMapa || 
        (reporte?.resumen?.nuevos_registros > 0) || 
        (reporte?.resumen?.clientes_suspendidos_rango > 0) || 
        (sancionadosFiltrados.length > 0)
      );

  // 🚨 3. EXPORTACIÓN LIMPIA Y CONDICIONADA
  const handleExport = (formato) => {
    if (!reporte) return;

    if (!tieneDatosParaExportar) {
      setAlertaCustom({
        visible: true,
        mensaje: "No se puede exportar el reporte porque no hay datos registrados para el período o la especialidad seleccionada."
      });
      return;
    }

    const anioActual = new Date().getFullYear();
    const tituloFiltro = filtroEspecialidad ? `_${filtroEspecialidad}` : '_Global';
    const filename = `Reporte_Clientes_Avanzado${tituloFiltro}_${anioActual}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;

    const fechaInicioLegible = reporte.rango_fechas?.inicio || fechaInicio.split('-').reverse().join('/');
    const fechaFinLegible = reporte.rango_fechas?.fin || fechaFin.split('-').reverse().join('/');
    const subTextoRango = `Período auditado: del ${fechaInicioLegible} al ${fechaFinLegible}`;

    if (formato === 'excel') {
      const prefacio = generarPrefacioExcel("REPORTE DE CLIENTES Y ASISTENCIAS", subTextoRango);

      const dataResumen = [
        ...prefacio,
        ["Métrica", "Valor"],
        ["Ausentismo Promedio", `${reporte.resumen.tasa_ausentismo}%`],
        ["Nuevos Registros", reporte.resumen.nuevos_registros || 0],
        ["Clientes Suspendidos", reporte.resumen.clientes_suspendidos_rango || 0]
      ];

        const dataConcurrenciaRaw = clasesFiltradas
        .filter(c => c.cant_clases > 0) // 💡 Ahora sí filtra las filas vacías antes de mapear
        .map(c => ({
          "Especialidad / Clase": c.nombre_clase || c.tipo,
          "Clases": c.cant_clases,
          "Cupos Iniciales": c.cupos_iniciales,
          "Asistencias": c.asistencias,
          "Inasistencias": c.inasistencias,
          "Cancelaciones": c.cancelaciones,
          "Lista Espera": c.lista_espera
        }));
      if (tieneDatosConcurrencia) {
        dataConcurrenciaRaw.push({
          "Especialidad / Clase": "TOTALES",
          "Clases": totales.clases,
          "Cupos Iniciales": totales.cupos,
          "Asistencias": totales.asistencias,
          "Inasistencias": totales.inasistencias,
          "Cancelaciones": totales.cancelaciones,
          "Lista Espera": totales.espera
        });
      }

        const dataMapaCalor = tieneDatosMapa ? reporte.mapa_calor.map(row => {
        const fila = { "Día / Módulo": row.dia };
        listaHorarios.forEach(h => {
          const cellData = row.horas[h];
          const val = filtroEspecialidad ? cellData?.[filtroEspecialidad] : cellData?.general;
          fila[`${h} hs`] = (val === null || val === undefined) ? "-" : `${val}%`;
        });
        return fila;
      }) : [];

      const dataSanciones = sancionadosFiltrados.length > 0 
        ? sancionadosFiltrados.map(user => ({
            "Nombre del Alumno": user.nombre,
            "Motivo de Suspensión": user.motivo,
            "Inicio de Suspensión": user.fecha_inicio
          }))
        : [];

      // Control estricto de inclusión de pestañas en Excel
      const laminas = [
        {
          nombre: "Resumen General",
          cols: [{ wch: 35 }, { wch: 20 }],
          data: dataResumen
        },
        {
          nombre: "Concurrencia",
          incluir: tieneDatosConcurrencia, 
          cols: [{ wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }],
          data: tieneDatosConcurrencia ? [
            ...prefacio,
            Object.keys(dataConcurrenciaRaw[0] || {}),
            ...dataConcurrenciaRaw.map(obj => Object.values(obj))
          ] : []
        },
        {
          nombre: "Mapa de Calor",
          incluir: tieneDatosMapa, 
          cols: [{ wch: 15 }, ...listaHorarios.map(() => ({ wch: 10 }))],
          data: tieneDatosMapa ? [
            ...prefacio,
            Object.keys(dataMapaCalor[0] || {}),
            ...dataMapaCalor.map(obj => Object.values(obj))
          ] : []
        },
        {
          nombre: "Cuentas Suspendidas",
          incluir: sancionadosFiltrados.length > 0 && !filtroEspecialidad,
          cols: [{ wch: 30 }, { wch: 45 }, { wch: 25 }],
          data: sancionadosFiltrados.length > 0 ? [
            ...prefacio,
            Object.keys(dataSanciones[0] || {}),
            ...dataSanciones.map(obj => Object.values(obj))
          ] : []
        }
      ];

      exportarAExcel(filename, laminas);

    } else if (formato === 'pdf') {
      const { doc, currentY: startY } = inicializarPDF("Reporte de Clientes y Asistencias", subTextoRango, filtroEspecialidad);
      let currentY = startY;

      const checkPageBreak = (espacioNecesario) => {
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        if (currentY + espacioNecesario >= pageHeight - 10) { doc.addPage(); currentY = 14; }
      };

      // Resumen General
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Ausentismo Promedio: ${reporte.resumen.tasa_ausentismo}%`, 14, currentY); currentY += 6;
      doc.text(`Nuevos Registros: ${reporte.resumen.nuevos_registros || 0}`, 14, currentY); currentY += 6;
      doc.text(`Clientes Suspendidos: ${reporte.resumen.clientes_suspendidos_rango || 0}`, 14, currentY); currentY += 14;

      // Concurrencia
      if (tieneDatosConcurrencia) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.text("Concurrencia y Cancelaciones", 14, currentY);
        
       const bodyConcurrencia = clasesFiltradas
          .filter(c => c.cant_clases > 0) // 💡 Filtra las filas vacías también para el PDF
          .map(c => [
            c.nombre_clase || c.tipo, 
            c.cant_clases, 
            c.cupos_iniciales, 
            c.asistencias, 
            c.inasistencias, 
            c.cancelaciones, 
            c.lista_espera
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
      }

      // Mapa de Calor
      if (tieneDatosMapa && reporte.mapa_calor && listaHorarios.length > 0) {
        checkPageBreak(50);
        doc.setFontSize(14);
        doc.text("Mapa de Calor: Ocupación (%)", 14, currentY);
        
          const bodyMapa = reporte.mapa_calor.map(row => {
          const celdasHoras = listaHorarios.map(h => {
            const cellData = row.horas[h];
            const val = filtroEspecialidad ? cellData?.[filtroEspecialidad] : cellData?.general;
            return (val === null || val === undefined) ? "-" : `${val}%`;
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

      // Sanciones (Solo renderiza si hay suspendidos y no hay filtro aplicado)
      if (sancionadosFiltrados.length > 0 && !filtroEspecialidad) {
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

        autoTable(doc, {
          ...baseTableStyles,
          startY: currentY,
          head: [['Nombre', 'Motivo', 'Fecha Inicio']],
          body: sancionadosFiltrados.map(user => [user.nombre, user.motivo, user.fecha_inicio]),
          columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 80 } }
        });
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
          {/* 2. TARJETAS DE RESUMEN (Siempre visibles) */}
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

          {/* 3. MÓDULO SANCIONES (Maneja su propio Empty State) */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Cuentas Suspendidas por Inasistencia
              <span style={s.badgeGlobalTitulo}>Global</span>
            </h2>
              <p style={s.bajada}>Análisis de deserción y motivos de penalización automática.</p>
              
              {sancionadosFiltrados.length > 0 ? (
                <>
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
                        {sancionadosFiltrados.map((user, idx) => (
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
                </>
              ) : (
                <ReportesEmptyState entidad="cuentas suspendidas" filtroEspecialidad="" />
              )}
            </div>
          
           {/* 1. FILTRO POR ESPECIALIDAD */}
          <div style={{ ...s.cardFiltros, background: 'var(--color-primario-suave, #f0fbfb)', border: '1px solid var(--color-primario)', marginBottom: '24px' }}>
            <div style={s.grupo}>
              <label style={{ ...s.label, color: 'var(--color-primario-oscuro)', fontWeight: '700' }} htmlFor="filtroEsp">Filtrar Segmento Operativo / Especialidad</label>
              <select id="filtroEsp" style={s.select} value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
                <option value="">Mostrar todo (Perspectiva Global)</option>
                {opcionesEspecialidades.map((op, i) => <option key={i} value={op}>{op}</option>)}
              </select>
            </div>
          </div>

          {/* 4. MÓDULO CONCURRENCIA (Maneja su propio Empty State) */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Control de Concurrencia y Cancelaciones
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
            </h2>
            
            {tieneDatosConcurrencia ? (
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

          {/* 5. MÓDULO MAPA DE CALOR (Maneja su propio Empty State) */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Mapa de Calor: Concurrencia de Alumnos (Grid)
              {filtroEspecialidad ? <span style={s.badgeFiltroTitulo}>Filtro: {filtroEspecialidad}</span> : <span style={s.badgeGlobalTitulo}>Global</span>}
            </h2>
            <p style={s.bajada}>Ocupación real basada en el flujo de asistencia sobre cupos ofertados (08:00 a 20:00 hs).</p>
            
            {tieneDatosMapa ? (
              <div style={s.wrapperTabla}>
                <div style={s.gridCalorDinamico(listaHorarios.length)}>
                  <div style={s.celdaCalorCabecera}>Día / Módulo</div>
                  {listaHorarios.map((h, i) => <div key={i} style={s.celdaCalorCabecera}>{h} hs</div>)}
                  {reporte.mapa_calor.map((row, i) => (
                    <React.Fragment key={i}>
                      <div style={s.celdaCalorDia}><strong>{row.dia}</strong></div>
                      {listaHorarios.map((h, idx) => {
                        const cellData = row.horas[h];
                        const valorRaw = filtroEspecialidad ? cellData?.[filtroEspecialidad] : cellData?.general;
                        const esNulo = valorRaw === null || valorRaw === undefined;
                        const valorVisual = esNulo ? "-" : `${valorRaw}%`;
                        return (
                          <div key={idx} style={s.celdaBloque(esNulo ? 0 : valorRaw)}>
                            {valorVisual}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <ReportesEmptyState entidad="flujos de asistencia" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          {/* Exportador de Datos */}
          <ReportesExportar tipoReporte="Clientes" onExport={handleExport} />
        </>
      )}

      {/* MODAL DE ALERTA PROPIO DEL SISTEMA MODULARIZADO */}
      <ReportesAlertaModal 
        visible={alertaCustom.visible}
        mensaje={alertaCustom.mensaje}
        onClose={() => setAlertaCustom({ visible: false, mensaje: "" })}
      />
    </div>
  );
}