import React from 'react';

export default function ReportesAlertaModal({ visible, mensaje, onClose }) {
  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(15, 23, 42, 0.4)', // Fondo oscuro suave
      backdropFilter: 'blur(6px)', // Desenfoque moderno
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000, // Por encima de todo
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: '#ffffff',
        padding: '32px',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        maxWidth: '420px',
        width: '90%',
        textAlign: 'center',
        border: '1px solid #f1f5f9'
      }}>
        {/* Ícono de Advertencia */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#fef2f2',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto 16px auto',
          border: '1px solid #fee2e2'
        }}>
          <span style={{ fontSize: '26px', color: '#ef4444' }}>⚠️</span>
        </div>

        <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>
          No se puede exportar
        </h3>
        
        <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
          {mensaje}
        </p>

        <button 
          onClick={onClose}
          style={{
            background: 'var(--color-primario, #0f766e)',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            width: '100%',
            boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.2)',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#0d5c52'}
          onMouseOut={(e) => e.target.style.background = 'var(--color-primario, #0f766e)'}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}