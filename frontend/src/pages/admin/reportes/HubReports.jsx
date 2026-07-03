import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStatisticsReport } from '../../../services/reportsService';
import { s } from './reportesStyles';

export default function HubReports() {
  const navigate = useNavigate();
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorValidacion, setErrorValidacion] = useState('');

  // Estados de ordenamiento para las tablas
  const [sortSalas, setSortSalas] = useState({ llave: null, direccion: 'asc' });
  const [sortProfesores, setSortProfesores] = useState({ llave: null, direccion: 'asc' });

  const anioActual = new Date().getFullYear();

  // Carga automática del resumen anual al montar el componente
  useEffect(() => {
    const cargarResumenAnual = async () => {
      try {
        setCargando(true);
        const hoy = new Date();
        const anio = hoy.getFullYear();

        // Generamos el rango: 1 de Enero del año actual hasta la fecha de hoy
        const inicio = `${anio}-01-01`;
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        const fin = `${anio}-${mes}-${dia}`;

        const data = await getStatisticsReport(inicio, fin);
        setReporte(data);
      } catch (err) {
        setErrorValidacion(err.message || 'Error al cargar el resumen anual.');
      } finally {
        setCargando(false);
      }
    };

    cargarResumenAnual();
  }, []);

  // Funciones de ordenamiento (simplificadas sin filtros de especialidad)
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

  // Preprocesamiento de datos a renderizar
  const salasOrdenadas = reporte ? procesarOrdenamiento(reporte.ocupacion_aulas, sortSalas) : [];
  const profesoresOrdenados = reporte ? procesarOrdenamiento(reporte.profesores_mayor_concurrencia, sortProfesores) : [];
  const listaHorarios = reporte?.mapa_calor?.[0] ? Object.keys(reporte.mapa_calor[0].horas).sort() : [];

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
          {/* 1. Tarjetas de Resumen */}
          <div style={s.gridResumen}>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Nuevos Registros</span>
              <p style={s.valorMini}>{reporte.resumen.nuevos_registros}</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Ingresos por Planes</span>
              <p style={{ ...s.valorMini, color: 'var(--color-primario-oscuro)' }}>
                ${Number(reporte.resumen.ingresos_totales).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Cuentas Suspendidas Activas</span>
              <p style={{ ...s.valorMini, color: '#dc2626' }}>{reporte.resumen.clientes_suspendidos}</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.labelMini}>Tasa de Ausentismo Promedio</span>
              <p style={{ ...s.valorMini, color: 'var(--color-secundario-oscuro)' }}>{reporte.resumen.tasa_ausentismo}%</p>
            </div>
          </div>

          {/* 2. Botonera de Redirección Superior */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '16px', marginBottom: '32px' }}>
            <div style={{ background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))', padding: '2px', borderRadius: '8px' }}>
              <button 
                style={{ ...s.boton, background: '#f4f9f9', color: 'var(--color-primario-oscuro)', width: '100%', border: 'none', margin: 0 }} 
                onClick={() => navigate('/admin/reportes/clientes')}
              >
                Control registros →
              </button>
            </div>
            
            <div style={{ background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))', padding: '2px', borderRadius: '8px' }}>
              <button 
                style={{ ...s.boton, background: '#f4f9f9', color: 'var(--color-primario-oscuro)', width: '100%', border: 'none', margin: 0 }} 
                onClick={() => navigate('/admin/reportes/finanzas')}
              >
                Ir a Finanzas →
              </button>
            </div>

            <div style={{ background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))', padding: '2px', borderRadius: '8px' }}>
              <button 
                style={{ ...s.boton, background: '#f4f9f9', color: 'var(--color-primario-oscuro)', width: '100%', border: 'none', margin: 0 }} 
                onClick={() => navigate('/admin/reportes/staff')}
              >
                Auditoría de Staff →
              </button>
            </div>
            
            <div style={{ background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))', padding: '2px', borderRadius: '8px' }}>
              <button 
                style={{ ...s.boton, background: '#f4f9f9', color: 'var(--color-primario-oscuro)', width: '100%', border: 'none', margin: 0 }} 
                onClick={() => navigate('/admin/reportes/salas')}
              >
                Logística de Salas →
              </button>
            </div>
          </div>

          {/* 3. MAPA DE CALOR: Concurrencia de Alumnos */}
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
              <button 
                style={{ ...s.boton, width: '100%', marginTop: '24px' }} 
                onClick={() => navigate('/admin/reportes/clientes')}
              >
                Control Alumnos →
              </button>
            </div>
          )}

          {/* 4. Tablas Globales: Ocupación de Salas y Staff */}
          <div style={s.gridDividido}>
            
            {/* Ocupación de Salas */}
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
              <button 
                style={{ ...s.boton, width: '100%', marginTop: '24px' }} 
                onClick={() => navigate('/admin/reportes/salas')}
              >
                Reporte Salas →
              </button>
            </div>

            {/* Concurrencia de Profesores */}
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
              <button 
                style={{ ...s.boton, width: '100%', marginTop: '24px' }} 
                onClick={() => navigate('/admin/reportes/staff')}
              >
                Reporte Staff →
              </button>
            </div>

          </div>

         {/* 5. MÓDULO NUEVO: Evolución Financiera Mensual (Conectado a BD) */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>
              Evolución Financiera Mensual
              <span style={s.badgeGlobalTitulo}>{anioActual}</span>
            </h2>
            <p style={s.bajada}>Ganancias brutas generadas por mes durante el año en curso.</p>
            
            <div style={s.contenedorGrafico}>
              {reporte.evolucion_temporal?.datos && (() => {
                const datosMeses = reporte.evolucion_temporal.datos;
                // Calculamos el ingreso máximo para que la barra más alta sea del 100%
                const maxIngreso = Math.max(...datosMeses.map(d => d.ingresos_brutos), 1); 

                return datosMeses.map((d, i) => {
                  const alturaPorcentaje = (d.ingresos_brutos / maxIngreso) * 100;
                  // Si el ingreso es mayor a 1000, lo mostramos como "Xk", sino el número entero
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

            <button 
              style={{ ...s.boton, width: '100%', marginTop: '40px' }} 
              onClick={() => navigate('/admin/reportes/finanzas')}
            >
              Reporte Financiero →
            </button>
          </div>

        </>
      )}
    </div>
  );
}