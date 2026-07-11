import React, { useState } from 'react';
import { getClientsReport } from '../../../services/reportsService';
import { s } from './reportesStyles';
import ReportesHeader from './components/ReportesHeader';
import ReportesExportar from './components/ReportesExportar';
import ReportesEmptyState from './components/ReportesEmptyState';

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

  const clasesFiltradas = reporte ? (filtroEspecialidad ? reporte.clase.filter(c => c.tipo === filtroEspecialidad) : reporte.clase) : [];
  const listaHorarios = reporte?.mapa_calor?.[0] ? Object.keys(reporte.mapa_calor[0].horas).sort() : [];
  
  const totales = clasesFiltradas.reduce((acc, c) => ({
    inscripciones: acc.inscripciones + (c.asistencias_fijas + c.asistencias_individuales + c.cancelaciones_fijas + c.cancelaciones_individuales),
    cancelaciones: acc.cancelaciones + (c.cancelaciones_fijas + c.cancelaciones_individuales),
    asistencias: acc.asistencias + (c.asistencias_fijas + c.asistencias_individuales),
    inasistencias: acc.inasistencias + (c.cancelaciones_fijas + c.cancelaciones_individuales)
  }), { inscripciones: 0, cancelaciones: 0, asistencias: 0, inasistencias: 0 });

  const hayDatos = totales.inscripciones > 0;

// LECTURA DINÁMICA Y CÁLCULO DE SANCIONES
  const statsSanciones = React.useMemo(() => {
    // 1. Si la tabla está vacía en este rango, forzamos todo a 0 y vacío
    if (!reporte?.sancionados || reporte.sancionados.length === 0) {
      return {
        tresFaltas: 0,
        cincuentaPorciento: 0,
        otrosMotivos: 0,
        reincidentes: 0,
        masAntiguo: { nombre: '-', fecha: '' },
        masReciente: { nombre: '-', fecha: '' }
      };
    }

    // 2. Si hay datos, calculamos los contadores
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

    // 3. Retornamos los contadores + los récords del backend
    return { 
      ...contadores,
      reincidentes: reporte.sanciones_estadisticas?.reincidentes || 0,
      masAntiguo: reporte.sanciones_estadisticas?.masAntiguo || { nombre: '-', fecha: '' },
      masReciente: reporte.sanciones_estadisticas?.masReciente || { nombre: '-', fecha: '' }
    };
  }, [reporte]);


  const motivosOcultos = ["Acumulación De 3 Faltas Consecutivas", "Inasistencia mayor al 50%"];

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
          {/* Tarjetas Resumen Reactivas al Rango */}
          <div style={s.gridResumen}>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Ausentismo Promedio (En Período)</span>
              <p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>
                {reporte.resumen.tasa_ausentismo}%
              </p>
            </div>
            
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Nuevos Registros (En Período)</span>
              <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>
                {reporte.resumen.nuevos_registros || 0}
              </p>
            </div>

            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Clientes Suspendidos (En Período)</span>
              <p style={{ ...s.valorMini, color: 'var(--color-texto)' }}>
                {reporte.resumen.clientes_suspendidos_rango || 0}
              </p>
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

          {/* TABLA DE CONCURRENCIA */}
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
                      <th style={s.thOrdenable}>Cantidad de Alumnos</th>
                      <th style={s.thOrdenable}>Inscripciones a Clases</th>
                      <th style={s.thOrdenable}>Cancelaciones</th>
                      <th style={s.thOrdenable}>Lista de Espera</th>
                      <th style={s.thOrdenable}>Asistencias</th>
                      <th style={s.thOrdenable}>Inasistencias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clasesFiltradas.map((c, i) => {
                      const inscripcionesTotales = c.asistencias_fijas + c.asistencias_individuales + c.cancelaciones_fijas + c.cancelaciones_individuales;
                      if (inscripcionesTotales === 0) return null;
                      const cancelacionesTotales = c.cancelaciones_fijas + c.cancelaciones_individuales;
                      const asistenciasTotales = c.asistencias_fijas + c.asistencias_individuales;
                      const alumnosUnicos = Math.floor(inscripcionesTotales * 0.6); 

                      return (
                        <tr key={i}>
                          <td style={s.td}><strong>{c.tipo}</strong></td>
                          <td style={s.td}>{alumnosUnicos}</td>
                          <td style={s.td}>{inscripcionesTotales}</td>
                          <td style={s.td}>{cancelacionesTotales}</td>
                          <td style={s.td}>0</td>
                          <td style={s.td}>{asistenciasTotales}</td>
                          <td style={s.td}>{cancelacionesTotales}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ fontWeight: 'bold', background: '#f8fafc', borderTop: '2px solid var(--color-borde)' }}>
                      <td style={{...s.td, color: 'var(--color-primario-oscuro)'}}>TOTALES</td>
                      <td style={s.td}>{Math.floor(totales.inscripciones * 0.6)}</td>
                      <td style={s.td}>{totales.inscripciones}</td>
                      <td style={s.td}>{totales.cancelaciones}</td>
                      <td style={s.td}>0</td>
                      <td style={s.td}><span style={{ ...s.badgePorcentaje, background: '#dcfce7', color: '#166534' }}>{totales.asistencias}</span></td>
                      <td style={s.td}><span style={{ ...s.badgePorcentaje, background: '#f1f5f9', color: '#475569' }}>{totales.inasistencias}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <ReportesEmptyState entidad="asistencias ni cancelaciones" filtroEspecialidad={filtroEspecialidad} />
            )}
          </div>

          {/* MAPA DE CALOR */}
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
          {/* SECCIÓN SANCIONADOS */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Cuentas Suspendidas por Inasistencia
              <span style={s.badgeGlobalTitulo}>Global</span>
            </h2>
            <p style={s.bajada}>Análisis de deserción y motivos de penalización automática.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-borde)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)' }}>POR +3 FALTAS</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--color-primario-oscuro)' }}>
                  {statsSanciones.tresFaltas}
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-borde)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)' }}>AUSENCIA &gt; 50%</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--color-primario-oscuro)' }}>
                  {statsSanciones.cincuentaPorciento}
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-borde)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)' }}>OTROS MOTIVOS</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--color-texto)' }}>
                  {statsSanciones.otrosMotivos}
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-borde)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-texto-suave)' }}>REINCIDENTES (2+)</span>
                <p style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--color-texto)' }}>
                  {statsSanciones.reincidentes}
                </p>
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
                {/* Aplicamos el filtro aquí mismo */}
                {reporte.sancionados
                  ?.filter(user => !motivosOcultos.includes(user.motivo)) 
                  .map((user, idx) => (
                    <tr key={idx}>
                      <td style={s.td}><strong>{user.nombre}</strong></td>
                      <td style={s.td}>{user.motivo}</td>
                      <td style={s.td}>
                        <span style={{...s.badgePorcentaje, background: '#f1f5f9', color: '#475569'}}>
                          {user.fecha_inicio}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            </div>
          </div>

          <ReportesExportar tipoReporte="Clientes" />
        </>
      )}
    </div>
  );
}