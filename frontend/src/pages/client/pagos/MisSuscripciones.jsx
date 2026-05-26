// Responsable: Ezequiel
// HU: Ver suscripciones + Pagar Mercado Pago
import React, { useState, useEffect } from 'react';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getPlans, mercadoPagoCheckout } from '../../../services/paymentsService';

const DURACION = (dias) => {
  if (dias === 30)  return '1 mes';
  if (dias === 90)  return '3 meses';
  if (dias === 180) return '6 meses';
  if (dias === 365) return '1 año';
  return `${dias} días`;
};

const ESCENARIOS = [
  { value: 'success',            label: 'Pago exitoso (saldo disponible)' },
  { value: 'insufficient_funds', label: 'Saldo insuficiente' },
  { value: 'connection_error',   label: 'Error de conexión con el banco' },
];

const s = {
  titulo: { fontSize: '22px', fontWeight: '700', color: 'var(--color-texto)', marginBottom: '8px' },
  subtitulo: { fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '16px' },
  card: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '20px', boxShadow: 'var(--sombra)',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  cardNombre: { fontSize: '16px', fontWeight: '700', color: 'var(--color-texto)' },
  cardDesc: { fontSize: '13px', color: 'var(--color-texto-suave)', flex: 1 },
  cardPrecio: { fontSize: '22px', fontWeight: '800', color: 'var(--color-primario)' },
  cardDetalle: { fontSize: '12px', color: 'var(--color-texto-suave)' },
  botonPagar: {
    marginTop: '8px', padding: '10px', borderRadius: '8px', border: 'none',
    background: 'var(--color-primario)', color: '#fff',
    fontWeight: '600', fontSize: '14px', cursor: 'pointer', width: '100%',
  },
  vacio: {
    textAlign: 'center', padding: '48px 24px', color: 'var(--color-texto-suave)',
    fontSize: '14px', background: 'var(--color-fondo-card)', borderRadius: '12px',
  },
  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
  },
  modal: {
    background: '#fff', borderRadius: '16px', padding: '28px 32px',
    width: '100%', maxWidth: '440px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  modalTitulo: { fontSize: '18px', fontWeight: '700', marginBottom: '4px', color: 'var(--color-texto)' },
  modalSubtitulo: { fontSize: '13px', color: 'var(--color-texto-suave)', marginBottom: '20px' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--color-texto)', marginBottom: '6px', display: 'block' },
  select: {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontSize: '14px', marginBottom: '16px',
  },
  botonConfirmar: {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    background: 'var(--color-primario)', color: '#fff',
    fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginBottom: '10px',
  },
  botonCancelar: {
    width: '100%', padding: '10px', borderRadius: '8px',
    border: '1px solid #d1d5db', background: '#fff',
    fontWeight: '600', fontSize: '14px', cursor: 'pointer', color: 'var(--color-texto)',
  },
  alerta: (tipo) => ({
    padding: '12px 14px', borderRadius: '8px', marginBottom: '14px',
    fontSize: '13px', lineHeight: '1.5',
    ...(tipo === 'success' ? { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' } : {}),
    ...(tipo === 'error'   ? { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' } : {}),
    ...(tipo === 'warn'    ? { background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706' } : {}),
  }),
  mpLogo: { fontSize: '28px', marginBottom: '4px' },
};

export default function MisSuscripciones() {
  const [planes, setPlanes]         = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // Modal
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [escenario, setEscenario]               = useState('success');
  const [pagando, setPagando]                   = useState(false);
  const [resultado, setResultado]               = useState(null); // { tipo, mensaje }

  useEffect(() => {
    getPlans()
      .then(setPlanes)
      .catch(() => setErrorCarga('No se pudieron cargar los planes.'))
      .finally(() => setCargando(false));
  }, []);

  function abrirModal(plan) {
    setResultado(null);
    setEscenario('success');
    setPlanSeleccionado(plan);
  }

  function cerrarModal() {
    if (pagando) return;
    setPlanSeleccionado(null);
    setResultado(null);
  }

  async function handlePagar() {
    if (!planSeleccionado) return;
    setPagando(true);
    setResultado(null);
    try {
      const res = await mercadoPagoCheckout(planSeleccionado.id, escenario);
      setResultado({ tipo: res.success ? 'success' : 'warn', mensaje: res.message });
    } catch (err) {
      const detalle = err?.detail || 'Error de conexión con el servidor del banco. Intente nuevamente.';
      setResultado({ tipo: 'error', mensaje: detalle });
    } finally {
      setPagando(false);
    }
  }

  return (
    <LayoutPrivado>
      <h1 style={s.titulo}>Planes y Abonos</h1>
      <p style={s.subtitulo}>Comparar opciones disponibles y suscribirse al plan que mejor se adapte a tus necesidades.</p>

      {errorCarga && <div style={s.alerta('error')}>{errorCarga}</div>}

      {cargando ? (
        <div style={s.vacio}>Cargando planes...</div>
      ) : planes.length === 0 ? (
        <div style={s.vacio}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontWeight: '600', marginBottom: '6px', color: 'var(--color-texto)' }}>
            No hay planes disponibles
          </div>
          <div>En este momento no hay planes activos. Volvé más tarde.</div>
        </div>
      ) : (
        <div style={s.grid}>
          {planes.map((plan) => (
            <div key={plan.id} style={s.card}>
              <div style={s.cardNombre}>{plan.name}</div>
              {plan.description && <div style={s.cardDesc}>{plan.description}</div>}
              <div style={s.cardPrecio}>${Number(plan.price).toLocaleString('es-AR')}</div>
              <div style={s.cardDetalle}>Duración: {DURACION(plan.duration_days)}</div>
              <div style={s.cardDetalle}>Cobertura: {plan.coverage_type}</div>
              <button style={s.botonPagar} onClick={() => abrirModal(plan)}>
                Suscribirse
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de pago */}
      {planSeleccionado && (
        <div style={s.overlay} onClick={cerrarModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.mpLogo}>💳</div>
            <div style={s.modalTitulo}>Pagar con Mercado Pago</div>
            <div style={s.modalSubtitulo}>
              {planSeleccionado.name} · ${Number(planSeleccionado.price).toLocaleString('es-AR')}
            </div>

            {resultado && (
              <div style={s.alerta(resultado.tipo)}>{resultado.mensaje}</div>
            )}

            {!resultado && (
              <>
                <label style={s.label}>Escenario de prueba</label>
                <select
                  style={s.select}
                  value={escenario}
                  onChange={(e) => setEscenario(e.target.value)}
                  disabled={pagando}
                >
                  {ESCENARIOS.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                <button style={s.botonConfirmar} onClick={handlePagar} disabled={pagando}>
                  {pagando ? 'Procesando...' : 'Pagar'}
                </button>
              </>
            )}

            <button style={s.botonCancelar} onClick={cerrarModal} disabled={pagando}>
              {resultado ? 'Cerrar' : 'Cancelar'}
            </button>
          </div>
        </div>
      )}
    </LayoutPrivado>
  );
}

