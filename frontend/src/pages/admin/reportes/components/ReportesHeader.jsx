import React from 'react';
import { useNavigate } from 'react-router-dom';
import { s } from '../reportesStyles';

export default function ReportesHeader({ 
  titulo, 
  bajada, 
  fechaInicio, 
  setFechaInicio, 
  fechaFin, 
  setFechaFin, 
  manejarSubmit, 
  cargando, 
  errorValidacion,
  consultarFechas // Recibe la función para los atajos
}) {
  const navigate = useNavigate();

  const formatearFecha = (d) => {
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  };

  const setearHistorialCompleto = () => {
    const sIni = "2026-01-01"; 
    const sFin = formatearFecha(new Date());
    setFechaInicio(sIni); setFechaFin(sFin); consultarFechas(sIni, sFin);
  };
  
  const setearUltimaSemana = () => {
    const hoy = new Date(); const ini = new Date(); ini.setDate(hoy.getDate() - 7);
    const sIni = formatearFecha(ini); const sFin = formatearFecha(hoy);
    setFechaInicio(sIni); setFechaFin(sFin); consultarFechas(sIni, sFin);
  };
  
  const setearUltimoMes = () => {
    const hoy = new Date(); const ini = new Date(); ini.setMonth(hoy.getMonth() - 1);
    const sIni = formatearFecha(ini); const sFin = formatearFecha(hoy);
    setFechaInicio(sIni); setFechaFin(sFin); consultarFechas(sIni, sFin);
  };

  const setearUltimoAnio = () => {
    const hoy = new Date(); const ini = new Date(); ini.setFullYear(hoy.getFullYear() - 1);
    const sIni = formatearFecha(ini); const sFin = formatearFecha(hoy);
    setFechaInicio(sIni); setFechaFin(sFin); consultarFechas(sIni, sFin);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
        <h1 style={{ ...s.titulo, marginBottom: 0 }}>{titulo}</h1>
        <button 
          style={{ ...s.boton, background: '#e2e8f0', color: '#0f172a', border: '1px solid #cbd5e1' }} 
          onClick={() => navigate('/admin/reportes')}
        >
          Volver al Hub
        </button>
      </div>
      <p style={s.bajada}>{bajada}</p>

      <div style={s.contenedorPills}>
        <button type="button" onClick={setearHistorialCompleto} style={s.pillRapida}>Historial Completo</button>
        <button type="button" onClick={setearUltimaSemana} style={s.pillRapida}>Última semana</button>
        <button type="button" onClick={setearUltimoMes} style={s.pillRapida}>Último mes</button>
        <button type="button" onClick={setearUltimoAnio} style={s.pillRapida}>Último año</button>
      </div>

      <div style={s.cardFiltros}>
        <form onSubmit={manejarSubmit} style={s.filaFiltros}>
          <div style={s.grupo}>
            <label style={s.label} htmlFor="fechaInicio">Fecha de inicio</label>
            <input id="fechaInicio" type="date" style={s.input} value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
          </div>
          <div style={s.grupo}>
            <label style={s.label} htmlFor="fechaFin">Fecha de fin</label>
            <input id="fechaFin" type="date" style={s.input} value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
          </div>
          <button type="submit" style={s.boton}>{cargando ? 'Generando...' : 'Generar Reporte'}</button>
        </form>
      </div>

      {errorValidacion && <div style={s.error}>{errorValidacion}</div>}
    </>
  );
}