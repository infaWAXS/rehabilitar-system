import React from 'react';

/* Componente reutilizable de esqueleto para páginas en construcción */
function PaginaEsqueleto({ titulo, descripcion, tags = [] }) {
  const s = {
    wrapper: {
      padding: '0',
    },
    encabezado: {
      marginBottom: '24px',
    },
    titulo: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'var(--color-texto)',
      marginBottom: '6px',
    },
    descripcion: {
      fontSize: '14px',
      color: 'var(--color-texto-suave)',
    },
    tags: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginTop: '12px',
    },
    tag: {
      padding: '4px 10px',
      borderRadius: '20px',
      background: 'var(--color-primario-suave)',
      color: 'var(--color-primario-oscuro)',
      fontSize: '12px',
      fontWeight: '500',
    },
    placeholder: {
      background: 'var(--color-fondo-card)',
      border: '2px dashed var(--color-borde)',
      borderRadius: 'var(--border-radius)',
      padding: '64px 32px',
      textAlign: 'center',
      color: 'var(--color-texto-suave)',
    },
    placeholderIcono: {
      fontSize: '40px',
      marginBottom: '12px',
    },
    placeholderTitulo: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '6px',
    },
    placeholderSub: {
      fontSize: '13px',
    },
  };

  return (
    <div style={s.wrapper}>
      <div style={s.encabezado}>
        <h1 style={s.titulo}>{titulo}</h1>
        {descripcion && <p style={s.descripcion}>{descripcion}</p>}
        {tags.length > 0 && (
          <div style={s.tags}>
            {tags.map((t) => <span key={t} style={s.tag}>{t}</span>)}
          </div>
        )}
      </div>
      <div style={s.placeholder}>
        <div style={s.placeholderIcono}>🔧</div>
        <div style={s.placeholderTitulo}>Página en construcción</div>
        <div style={s.placeholderSub}>Este componente está pendiente de implementación.</div>
      </div>
    </div>
  );
}

export default PaginaEsqueleto;
