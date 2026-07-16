import React from 'react';

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(10, 20, 20, 0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000, backdropFilter: 'blur(2px)',
  },
  card: {
    background: '#fff', borderRadius: '16px', padding: '36px 40px',
    width: '100%', maxWidth: '380px', textAlign: 'center',
    boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
  },
  spinner: {
    width: '48px', height: '48px', margin: '0 auto 20px',
    border: '4px solid #e5e7eb', borderTopColor: '#009EE3',
    borderRadius: '50%', animation: 'mp-spin 0.9s linear infinite',
  },
  titulo: { fontSize: '17px', fontWeight: '700', color: '#1A2E2E', marginBottom: '6px' },
  subtitulo: { fontSize: '13px', color: '#4A6868', lineHeight: 1.5, marginBottom: '22px' },
  boton: {
    padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db',
    background: '#fff', color: '#4A6868', fontWeight: '600', fontSize: '14px',
    cursor: 'pointer',
  },
};

export default function OverlayEsperandoPago({ visible, onCancelar }) {
  if (!visible) return null;

  return (
    <div style={s.overlay}>
      <style>{'@keyframes mp-spin { to { transform: rotate(360deg); } }'}</style>
      <div style={s.card}>
        <div style={s.spinner} />
        <div style={s.titulo}>Esperando pago…</div>
        <div style={s.subtitulo}>
          Completá el pago en la ventana de Mercado Pago que se abrió.
        </div>
        <button style={s.boton} onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
}
