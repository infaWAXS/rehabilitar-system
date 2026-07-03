import React from 'react';

export default function ReportesEmptyState({ entidad, filtroEspecialidad }) {
  return (
    <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', padding: '40px 24px', borderRadius: '12px', textAlign: 'center', margin: '16px 0' }}>
      <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-primario-oscuro)', fontSize: '18px', fontWeight: '800' }}>
        No hay resultados
      </h3>
      <p style={{ margin: 0, color: 'var(--color-texto-suave)', fontSize: '15px' }}>
        No se registraron {entidad} para el rango de fechas
        {filtroEspecialidad ? ` y la especialidad "${filtroEspecialidad}"` : '.'}
      </p>
    </div>
  );
}