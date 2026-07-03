// reportesStyles.js
export const s = {
  contenedor: { padding: '32px 24px', boxSizing: 'border-box', maxWidth: '1100px', margin: '0 auto' },
  titulo: { fontSize: '32px', fontWeight: '800', color: 'var(--color-texto)', marginBottom: '8px', letterSpacing: '-0.5px' },
  bajada: { fontSize: '15px', color: 'var(--color-texto-suave)', marginBottom: '28px', lineHeight: 1.5 },
  contenedorPills: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  pillRapida: { padding: '8px 16px', background: 'var(--color-primario-suave, #f0fbfb)', color: 'var(--color-primario-oscuro, #0d7377)', border: '1px solid var(--color-borde)', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
  cardFiltros: { background: '#fff', border: '1px solid var(--color-borde)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--sombra)', marginBottom: '20px' },
  filaFiltros: { display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' },
  grupo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--color-texto-suave)' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', fontSize: '14px', color: 'var(--color-texto)', outline: 'none' },
  select: { padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', fontSize: '14px', color: 'var(--color-texto)', outline: 'none', minWidth: '240px', cursor: 'pointer' },
  boton: { border: 'none', color: '#fff', background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))', borderRadius: '8px', padding: '11px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', height: '42px' },
  botonCargando: { border: 'none', color: '#fff', background: '#cbd5e1', borderRadius: '8px', padding: '11px 24px', fontSize: '14px', fontWeight: '700', cursor: 'not-allowed', height: '42px' },
  error: { padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: '500' },
  gridResumen: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' },
  tarjetaMini: { background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-borde)', boxShadow: 'var(--sombra)', display: 'flex', flexDirection: 'column', gap: '4px' },
  labelMini: { fontSize: '11px', fontWeight: '700', color: 'var(--color-primario)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  valorMini: { fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--color-texto)', letterSpacing: '-0.5px' },
  seccionReporte: { background: '#fff', padding: '28px', borderRadius: '14px', border: '1px solid var(--color-borde)', boxShadow: 'var(--sombra)', marginBottom: '32px' },
  subtitulo: { fontSize: '20px', fontWeight: '800', color: 'var(--color-texto)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  wrapperTabla: { overflowX: 'auto', marginTop: '12px' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  thOrdenable: { textAlign: 'left', padding: '14px 16px', background: 'var(--color-primario-suave, #f0fbfb)', color: 'var(--color-primario-oscuro, #0d7377)', fontSize: '13px', fontWeight: '700', borderBottom: '2px solid var(--color-borde)', cursor: 'pointer', userSelect: 'none', transition: 'background 0.2s' },
  td: { padding: '14px 16px', borderBottom: '1px solid var(--color-borde)', color: 'var(--color-texto)', fontSize: '14px' },
  gridDividido: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '32px' },
  badgePorcentaje: { background: 'var(--color-secundario-suave, #fff7ed)', color: 'var(--color-secundario-oscuro, #c2410c)', padding: '4px 10px', borderRadius: '999px', fontSize: '13px', fontWeight: '700', display: 'inline-block' },
  badgeFiltroTitulo: { background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' },
  badgeGlobalTitulo: { background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' },
  bannerFiltroActivo: { background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px', boxShadow: 'var(--sombra)' },
  contenedorGrafico: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '220px', borderLeft: '2px solid var(--color-borde)', borderBottom: '2px solid var(--color-borde)', padding: '16px 8px 0 8px', marginTop: '20px', position: 'relative' },
  columnaBarra: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px', height: '100%', justifyContent: 'flex-end' },
  barraFisica: (pct, colorGrad) => ({ width: '60%', maxWidth: '40px', height: `${Math.max(parseFloat(pct) || 0, 4)}%`, background: colorGrad, borderRadius: '6px 6px 0 0', position: 'relative', display: 'flex', justifyContent: 'center', transition: 'all 0.3s ease' }),
  tooltipVolatil: { position: 'absolute', top: '-26px', fontSize: '11px', fontWeight: '700', color: 'var(--color-texto)', background: '#fff', border: '1px solid var(--color-borde)', padding: '2px 6px', borderRadius: '4px', boxShadow: 'var(--sombra)' },
  etiquetaX: { fontSize: '11px', fontWeight: '600', color: 'var(--color-texto-suave)', textAlign: 'center', marginTop: '4px' },
  gridCalorDinamico: (columnas) => ({ display: 'grid', gridTemplateColumns: `120px repeat(${columnas}, minmax(60px, 1fr))`, gap: '6px', marginTop: '16px' }),
  celdaCalorCabecera: { fontWeight: '700', fontSize: '12px', color: 'var(--color-texto)', padding: '10px 4px', textAlign: 'center', background: '#f8fafc', borderRadius: '4px' },
  celdaCalorDia: { fontWeight: '600', fontSize: '13px', color: 'var(--color-texto)', padding: '8px', display: 'flex', alignItems: 'center' },
  celdaBloque: (sat) => {
    let bg = '#f1f5f9'; let color = 'var(--color-texto-suave)';
    if (sat > 80) { bg = '#115e59'; color = '#fff'; }       
    else if (sat > 50) { bg = '#0d9488'; color = '#fff'; }
    else if (sat > 25) { bg = '#2dd4bf'; color = '#115e59'; }
    else if (sat > 0) { bg = '#ccfbf1'; color = '#134e4a'; }
    return { background: bg, color: color, padding: '12px 4px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: '700', border: '1px solid rgba(0,0,0,0.01)', transition: 'background 0.2s' };
  },
  botonRedireccion: { display: 'inline-block', marginTop: '16px', padding: '8px 16px', background: '#e2e8f0', color: '#0f172a', borderRadius: '6px', fontSize: '13px', fontWeight: '700', textDecoration: 'none', cursor: 'pointer', border: 'none' }
};