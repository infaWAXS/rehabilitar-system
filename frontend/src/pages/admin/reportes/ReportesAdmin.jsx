import React, { useState } from 'react';
import { getStatisticsReport } from '../../../services/reportsService';

// Estilos siguiendo la estructura exacta de SolicitarReintegro.jsx
const s = {
  contenedor: { padding: '30px', background: 'var(--color-fondo)', minHeight: '100vh', boxSizing: 'border-box' },
  titulo: { fontSize: '26px', fontWeight: '700', color: 'var(--color-texto)', marginBottom: '20px' },
  cardFiltros: { background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--sombra)', marginBottom: '24px' },
  filaFiltros: { display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' },
  grupo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '6px', color: 'var(--color-texto)' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', fontSize: '14px' },
  boton: { padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '6px', height: '40px' },
  botonCargando: { padding: '10px 20px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'not-allowed', height: '40px' },
  error: { padding: '12px', background: '#f8d7da', color: '#721c24', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', fontWeight: '500' },
  gridResumen: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' },
  tarjetaMini: { background: 'var(--color-fondo-card)', padding: '20px', borderRadius: '10px', boxShadow: 'var(--sombra)', textAlign: 'center' },
  valorMini: { fontSize: '24px', fontWeight: '700', margin: '8px 0 0 0', color: 'var(--color-texto)' },
  seccionReporte: { background: 'var(--color-fondo-card)', padding: '24px', borderRadius: '12px', boxShadow: 'var(--sombra)', marginBottom: '30px' },
  subtitulo: { fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-texto)' },
  tabla: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  th: { textAlign: 'left', padding: '12px', background: '#f1f3f5', color: '#495057', fontWeight: '600', borderBottom: '2px solid #dee2e6' },
  td: { padding: '12px', borderBottom: '1px solid #dee2e6', color: 'var(--color-texto)' }
};

export default function ReportesAdmin() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');

  const manejarGeneracion = async (e) => {
    e.preventDefault();
    setErrorValidacion('');
    setReporte(null);

    // Validación del Escenario 2: Rango de fechas inválido o incompleto
    if (!fechaInicio || !fechaFin) {
      setErrorValidacion('Por favor, selecciona ambas fechas.');
      return;
    }

    if (fechaInicio > fechaFin) {
      setErrorValidacion('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    try {
      setCargando(true);
      const data = await getStatisticsReport(fechaInicio, fechaFin);
      setReporte(data);
    } catch (err) {
      setErrorValidacion(err.message || 'Hubo un error al procesar el reporte en el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={s.contenedor}>
      <h1 style={s.titulo}>Reportes Estadísticos de Negocio</h1>

      {/* Formulario de Filtros por Rango de Fechas */}
      <div style={s.cardFiltros}>
        <form onSubmit={manejarGeneracion} style={s.filaFiltros}>
          <div style={s.grupo}>
            <label style={s.label} htmlFor="fechaInicio">Desde</label>
            <input
              id="fechaInicio"
              type="date"
              style={s.input}
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div style={s.grupo}>
            <label style={s.label} htmlFor="fechaFin">Hasta</label>
            <input
              id="fechaFin"
              type="date"
              style={s.input}
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          <button type="submit" style={cargando ? s.botonCargando : s.boton} disabled={cargando}>
            {cargando ? 'Generando...' : 'Generar Reporte'}
          </button>
        </form>
      </div>

      {/* Alerta de Error (Escenario 2 u otros fallos) */}
      {errorValidacion && <div style={s.error}>{errorValidacion}</div>}

      {/* Renderizado de Resultados (Escenario 1) */}
      {reporte && (
        <>
          {/* Bloque 1: Tarjetas de Resumen Rápido */}
          <div style={s.gridResumen}>
            <div style={s.tarjetaMini}>
              <span style={s.label}>Nuevos Registros</span>
              <p style={s.valorMini}>{reporte.resumen.nuevos_registros}</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.label}>Ingresos Totales</span>
              <p style={s.valorMini}>${reporte.resumen.ingresos_totales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div style={s.tarjetaMini}>
              <span style={s.label}>Clientes Suspendidos</span>
              <p style={s.valorMini}>{reporte.resumen.clientes_suspendidos}</p>
            </div>
          </div>

          {/* Bloque 2: Tabla Desglosada de Clases y Trenes */}
          <div style={s.seccionReporte}>
            <h2 style={s.subtitulo}>Rendimiento por Tipo de Clase</h2>
            <table style={s.tabla}>
              <thead>
                <tr>
                  <th style={s.th}>Tipo de Tren</th>
                  <th style={s.th}>Asistencias Fijas</th>
                  <th style={s.th}>Asistencias Indiv.</th>
                  <th style={s.th}>Cant. Fijas Ofertadas</th>
                  <th style={s.th}>Cant. Indiv. Ofertadas</th>
                  <th style={s.th}>Cancelaciones Fijas</th>
                  <th style={s.th}>Cancelaciones Indiv.</th>
                </tr>
              </thead>
              <tbody>
                {reporte.clase.map((c, index) => (
                  <tr key={index}>
                    <td style={s.td}><strong>{c.tipo}</strong></td>
                    <td style={s.td}>{c.asistencias_fijas}</td>
                    <td style={s.td}>{c.asistencias_individuales}</td>
                    <td style={s.td}>{c.cant_fijas}</td>
                    <td style={s.td}>{c.cant_individuales}</td>
                    <td style={s.td}>{c.cancelaciones_fijas}</td>
                    <td style={s.td}>{c.cancelaciones_individuales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bloque 3: Ocupación de Aulas y Profesores */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flexWrap: 'wrap' }}>
            
            <div style={s.seccionReporte}>
              <h2 style={s.subtitulo}>Ocupación de Aulas</h2>
              <table style={s.tabla}>
                <thead>
                  <tr>
                    <th style={s.th}>Aula</th>
                    <th style={s.th}>% de Ocupación</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.ocupacion_aulas.map((a, index) => (
                    <tr key={index}>
                      <td style={s.td}>{a.aula}</td>
                      <td style={s.td}><strong>{a.porcentaje_ocupacion}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={s.seccionReporte}>
              <h2 style={s.subtitulo}>Rendimiento de Profesores</h2>
              <table style={s.tabla}>
                <thead>
                  <tr>
                    <th style={s.th}>Profesor</th>
                    <th style={s.th}>Alumnos</th>
                    <th style={s.th}>Cancelaciones</th>
                    <th style={s.th}>% Ocupación</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.profesores_mayor_concurrencia.map((p, index) => (
                    <tr key={index}>
                      <td style={s.td}>{p.nombre}</td>
                      <td style={s.td}>{p.total_alumnos_atendidos}</td>
                      <td style={s.td}>{p.total_cancelaciones_recibidas}</td>
                      <td style={s.td}><strong>{p.porcentaje_ocupacion_clases}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </>
      )}
    </div>
  );
}