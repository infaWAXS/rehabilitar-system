import React from 'react';
import { s } from '../reportesStyles';

export default function ReportesExportar({ tipoReporte, onExport }) {
  return (
    <div style={{ ...s.seccionReporte, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <h2 style={s.subtitulo}>Exportar Datos</h2>
      <p style={s.bajada}>Descarga el reporte completo en formato PDF o Excel para su análisis externo o impresión.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', flexWrap: 'wrap', gap: '16px' }}>
          <span style={{ fontWeight: '600', color: 'var(--color-texto)' }}>
            Exportar reporte de {tipoReporte}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => onExport('pdf')} 
              style={{ ...s.boton, padding: '8px 16px', fontSize: '13px', height: 'auto', background: '#ef4444' }}
            >
              PDF
            </button>
            <button 
              onClick={() => onExport('excel')} 
              style={{ ...s.boton, padding: '8px 16px', fontSize: '13px', height: 'auto', background: '#10b981' }}
            >
              EXCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}