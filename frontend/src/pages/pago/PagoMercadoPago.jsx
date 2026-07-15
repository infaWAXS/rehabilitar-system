// Ventana independiente que simula el checkout de Mercado Pago.
// Se abre con window.open() desde el flujo de inscripción a actividad
// y desde el flujo de suscripción a un plan. Al terminar, reporta el
// resultado a la ventana que la abrió via postMessage y se cierra sola.
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const MP_ORIGEN = 'mp-simulador';

const ESCENARIOS = [
  { value: 'success', label: 'Pago exitoso', desc: 'Saldo disponible, la operación se aprueba.', icon: '✅' },
  { value: 'insufficient_funds', label: 'Fondos insuficientes', desc: 'El banco rechaza el pago por falta de saldo.', icon: '❌' },
  { value: 'connection_error', label: 'Error de conexión', desc: 'Falla la comunicación con el servidor del banco.', icon: '⚠️' },
];

const s = {
  page: {
    minHeight: '100vh', background: '#EBF6FB', fontFamily: "'Poppins', sans-serif",
    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 40px',
  },
  header: {
    width: '100%', background: '#009EE3', color: '#fff', padding: '18px 24px',
    display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '18px',
    marginBottom: '28px',
  },
  card: {
    width: '100%', maxWidth: '380px', background: '#fff', borderRadius: '14px',
    boxShadow: '0 4px 18px rgba(0,0,0,0.10)', padding: '26px 26px 30px', margin: '0 16px',
  },
  resumen: {
    background: '#F7FAFC', borderRadius: '10px', padding: '16px 18px', marginBottom: '22px',
  },
  resumenLabel: { fontSize: '12px', color: '#6b7f7f', marginBottom: '4px' },
  resumenDesc: { fontSize: '14px', fontWeight: '600', color: '#1A2E2E', marginBottom: '10px' },
  monto: { fontSize: '28px', fontWeight: '800', color: '#1A2E2E' },
  seccionTitulo: { fontSize: '13px', fontWeight: '700', color: '#1A2E2E', marginBottom: '10px' },
  opcion: (sel) => ({
    display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px',
    borderRadius: '10px', marginBottom: '8px', cursor: 'pointer',
    border: sel ? '2px solid #009EE3' : '1px solid #e2e8f0',
    background: sel ? '#EBF6FB' : '#fff',
  }),
  opcionIcono: { fontSize: '18px', lineHeight: 1 },
  opcionLabel: { fontSize: '13px', fontWeight: '700', color: '#1A2E2E' },
  opcionDesc: { fontSize: '12px', color: '#6b7f7f', marginTop: '2px' },
  botonPagar: {
    width: '100%', padding: '13px', borderRadius: '8px', border: 'none',
    background: '#009EE3', color: '#fff', fontWeight: '700', fontSize: '15px',
    cursor: 'pointer', marginTop: '18px',
  },
  botonCancelar: {
    width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #d1d5db',
    background: '#fff', color: '#4A6868', fontWeight: '600', fontSize: '13px',
    cursor: 'pointer', marginTop: '10px',
  },
  estadoBox: { textAlign: 'center', padding: '20px 4px' },
  estadoIcono: { fontSize: '52px', marginBottom: '14px' },
  estadoTitulo: { fontSize: '17px', fontWeight: '700', color: '#1A2E2E', marginBottom: '8px' },
  estadoDesc: { fontSize: '13px', color: '#4A6868', lineHeight: 1.5 },
  spinner: {
    width: '42px', height: '42px', margin: '10px auto 18px',
    border: '4px solid #e5e7eb', borderTopColor: '#009EE3',
    borderRadius: '50%', animation: 'mp-spin 0.9s linear infinite',
  },
};

const MENSAJES_RESULTADO = {
  success: { icon: '✅', titulo: 'Pago aprobado', desc: 'La operación fue aprobada correctamente.' },
  insufficient_funds: { icon: '❌', titulo: 'Pago rechazado', desc: 'Fondos insuficientes en la cuenta.' },
  connection_error: { icon: '⚠️', titulo: 'Error de conexión', desc: 'No se pudo conectar con el servidor del banco.' },
};

function enviarResultado(scenario) {
  if (window.opener) {
    window.opener.postMessage({ source: MP_ORIGEN, type: 'resultado', scenario }, window.location.origin);
  }
}

function enviarCancelado() {
  if (window.opener) {
    window.opener.postMessage({ source: MP_ORIGEN, type: 'cancelado' }, window.location.origin);
  }
}

export default function PagoMercadoPago() {
  const [searchParams] = useSearchParams();
  const monto = Number(searchParams.get('monto') || 0);
  const descripcion = searchParams.get('descripcion') || 'Pago';

  const [escenario, setEscenario] = useState('success');
  const [estado, setEstado] = useState('form'); // form | procesando | resultado

  function handlePagar() {
    setEstado('procesando');
    setTimeout(() => {
      setEstado('resultado');
      setTimeout(() => {
        enviarResultado(escenario);
        window.close();
      }, 1300);
    }, 1100);
  }

  function handleCancelar() {
    enviarCancelado();
    window.close();
  }

  const resultado = MENSAJES_RESULTADO[escenario];

  return (
    <div style={s.page}>
      <style>{'@keyframes mp-spin { to { transform: rotate(360deg); } }'}</style>
      <div style={s.header}>
        <span>💳</span> Mercado Pago
      </div>

      <div style={s.card}>
        {estado === 'form' && (
          <>
            <div style={s.resumen}>
              <div style={s.resumenLabel}>Vas a pagar</div>
              <div style={s.resumenDesc}>{descripcion}</div>
              <div style={s.monto}>${monto.toLocaleString('es-AR')}</div>
            </div>

            <div style={s.seccionTitulo}>Elegí un escenario para simular</div>
            {ESCENARIOS.map((op) => (
              <div key={op.value} style={s.opcion(escenario === op.value)} onClick={() => setEscenario(op.value)}>
                <span style={s.opcionIcono}>{op.icon}</span>
                <div>
                  <div style={s.opcionLabel}>{op.label}</div>
                  <div style={s.opcionDesc}>{op.desc}</div>
                </div>
              </div>
            ))}

            <button style={s.botonPagar} onClick={handlePagar}>Pagar ${monto.toLocaleString('es-AR')}</button>
            <button style={s.botonCancelar} onClick={handleCancelar}>Cancelar</button>
          </>
        )}

        {estado === 'procesando' && (
          <div style={s.estadoBox}>
            <div style={s.spinner} />
            <div style={s.estadoTitulo}>Procesando pago...</div>
            <div style={s.estadoDesc}>No cierres esta ventana.</div>
          </div>
        )}

        {estado === 'resultado' && (
          <div style={s.estadoBox}>
            <div style={s.estadoIcono}>{resultado.icon}</div>
            <div style={s.estadoTitulo}>{resultado.titulo}</div>
            <div style={s.estadoDesc}>{resultado.desc}</div>
          </div>
        )}
      </div>
    </div>
  );
}
