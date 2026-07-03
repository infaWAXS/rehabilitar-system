import React from 'react';
import { s } from '../reportesStyles';

export default function ReportesExportar({ tipoReporte }) {
  
  const handleExport = (tipo, formato) => {
    const filename = `Exportacion_${tipo}_${new Date().getFullYear()}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
    const blob = new Blob(['Contenido de prueba'], { type: formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div style={{ ...s.seccionReporte, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <h2 style={s.subtitulo}>Exportar Datos</h2>
      <p style={s.bajada}>Descarga los reportes en formato PDF o Excel para su análisis externo o impresión.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', flexWrap: 'wrap', gap: '16px' }}>
          <span style={{ fontWeight: '600', color: 'var(--color-texto)' }}>Exportar estadísticas de {tipoReporte}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleExport(tipoReporte, 'pdf')} style={{ ...s.boton, padding: '8px 16px', fontSize: '13px', height: 'auto', background: '#ef4444' }}>PDF</button>
            <button onClick={() => handleExport(tipoReporte, 'excel')} style={{ ...s.boton, padding: '8px 16px', fontSize: '13px', height: 'auto', background: '#10b981' }}>EXCEL</button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', flexWrap: 'wrap', gap: '16px' }}>
          <span style={{ fontWeight: '600', color: 'var(--color-texto)' }}>Exportar todas las estadísticas</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleExport('Completo', 'pdf')} style={{ ...s.boton, padding: '8px 16px', fontSize: '13px', height: 'auto', background: '#ef4444' }}>PDF</button>
            <button onClick={() => handleExport('Completo', 'excel')} style={{ ...s.boton, padding: '8px 16px', fontSize: '13px', height: 'auto', background: '#10b981' }}>EXCEL</button>
          </div>
        </div>
        
      </div>
    </div>
  );
}