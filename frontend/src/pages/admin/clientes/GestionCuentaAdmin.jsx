// HU Suspender cuenta (Nahuel)
// E1: motivo ingresado → cuenta pasa a "suspended"
// E2: cancelar → modal se cierra sin cambios
// E3: motivo vacío → error de validación (frontend + backend)
// HU Reintegrar cuenta (Nahuel)
// E1: con solicitud pendiente → admin aprueba, cuenta → "active"
// E2: sin solicitud → admin reintegra directamente, cuenta → "active"
// E3: rechazar solicitud → cuenta vuelve a "suspended"
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { getUserById } from '../../../services/usersService';
import { suspendClient, reinstateClient, rejectReintegration } from '../../../services/clientsService';
import { getRole } from '../../../services/authService';

const ESTADO_LABEL = {
  active: 'Activo',
  suspended: 'Suspendido',
  pending_reintegration: 'Reintegro pendiente',
  disabled: 'Deshabilitado',
};

const s = {
  card: { background: 'var(--color-fondo-card)', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: 'var(--sombra)' },
  fila: { display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--color-texto-suave)', minWidth: '100px' },
  valor: { fontSize: '14px', color: 'var(--color-texto)' },
  chipEstado: (estado) => {
    const colores = {
      active: { bg: '#dcfce7', color: '#15803d' },
      suspended: { bg: '#fef2f2', color: '#dc2626' },
      pending_reintegration: { bg: '#fef9c3', color: '#92400e' },
      disabled: { bg: '#f3f4f6', color: '#6b7280' },
    };
    const c = colores[estado] || { bg: '#f3f4f6', color: '#374151' };
    return { display: 'inline-block', padding: '3px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', background: c.bg, color: c.color };
  },
  seccionAcciones: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' },
  botonSuspender: { padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
  botonReintegrar: { padding: '10px 22px', borderRadius: '8px', border: 'none', background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
  botonRechazar: { padding: '10px 22px', borderRadius: '8px', border: '1px solid #dc2626', background: 'transparent', color: '#dc2626', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
  botonVolver: { padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '600', color: 'var(--color-texto)', marginBottom: '20px' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '14px' },
  exito: { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 14px', color: '#16a34a', fontSize: '13px', marginBottom: '14px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px 32px', maxWidth: '420px', width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.18)' },
  modalTitulo: { fontSize: '18px', fontWeight: '700', marginBottom: '10px', color: 'var(--color-texto)' },
  modalTexto: { fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '16px', lineHeight: 1.5 },
  modalLabel: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--color-texto)' },
  modalInput: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-borde)', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' },
  modalBotones: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  modalCancelar: { padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '600', color: 'var(--color-texto)' },
  modalConfirmar: (danger) => ({ padding: '9px 18px', borderRadius: '8px', border: 'none', background: danger ? '#dc2626' : 'var(--color-primario)', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '700' }),
  cargando: { textAlign: 'center', padding: '40px', color: 'var(--color-texto-suave)' },
  infoReintegro: { background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#713f12' },
};

function GestionCuentaAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Modal suspend
  const [modalSuspender, setModalSuspender] = useState(false);
  const [motivoSuspender, setMotivoSuspender] = useState('');
  const [errMotivo, setErrMotivo] = useState('');
  const [suspendiendo, setSuspendiendo] = useState(false);

  // Modal reinstate
  const [modalReintegrar, setModalReintegrar] = useState(false);
  const [motivoReintegrar, setMotivoReintegrar] = useState('');
  const [reintegrando, setReintegrando] = useState(false);

  // Modal rechazar
  const [modalRechazar, setModalRechazar] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [errMotivoRechazo, setErrMotivoRechazo] = useState('');
  const [rechazando, setRechazando] = useState(false);

  useEffect(() => {
    setCargando(true);
    getUserById(Number(id))
      .then((data) => setCliente(data))
      .catch(() => setError('No se pudo cargar el cliente.'))
      .finally(() => setCargando(false));
  }, [id]);

  // HU Suspender — E1: confirmar con motivo → suspend
  const confirmarSuspender = async () => {
    if (!motivoSuspender.trim()) { setErrMotivo('El motivo es obligatorio.'); return; }
    setSuspendiendo(true);
    setError('');
    try {
      const updated = await suspendClient(Number(id), motivoSuspender.trim());
      setCliente((prev) => ({ ...prev, account_status: updated.account_status || 'suspended' }));
      setExito('La cuenta fue suspendida correctamente.');
      setModalSuspender(false);
      setMotivoSuspender('');
      setErrMotivo('');
    } catch (err) {
      setError(err.message || 'No se pudo suspender la cuenta.');
    } finally {
      setSuspendiendo(false);
    }
  };

  // HU Reintegrar — E1/E2: aprobar con motivo opcional → active
  const confirmarReintegrar = async () => {
    setReintegrando(true);
    setError('');
    try {
      const updated = await reinstateClient(Number(id), motivoReintegrar.trim() || null);
      setCliente((prev) => ({ ...prev, account_status: updated.account_status || 'active' }));
      setExito('La cuenta fue reintegrada correctamente.');
      setModalReintegrar(false);
      setMotivoReintegrar('');
    } catch (err) {
      setError(err.message || 'No se pudo reintegrar la cuenta.');
    } finally {
      setReintegrando(false);
    }
  };

  // HU Reintegrar — E3: rechazar solicitud con motivo obligatorio → suspended
  const confirmarRechazar = async () => {
    if (!motivoRechazo.trim()) { setErrMotivoRechazo('El motivo del rechazo es obligatorio.'); return; }
    setRechazando(true);
    setError('');
    try {
      const updated = await rejectReintegration(Number(id), motivoRechazo.trim());
      setCliente((prev) => ({ ...prev, account_status: updated.account_status || 'suspended' }));
      setExito('La solicitud de reintegro fue rechazada.');
      setModalRechazar(false);
      setMotivoRechazo('');
      setErrMotivoRechazo('');
    } catch (err) {
      setError(err.message || 'No se pudo rechazar el reintegro.');
    } finally {
      setRechazando(false);
    }
  };

  if (cargando) return <LayoutPrivado titulo="Gestión de Cuenta"><div style={s.cargando}>Cargando...</div></LayoutPrivado>;

  return (
    <LayoutPrivado titulo="Gestión de Cuenta">
      <button style={s.botonVolver} onClick={() => navigate(getRole() === 'admin' ? '/admin/clientes' : '/recepcionista/clientes')}>← Volver</button>

      {error && <div style={s.error}>{error}</div>}
      {exito && <div style={s.exito}>{exito}</div>}

      {cliente && (
        <>
          <div style={s.card}>
            <div style={s.fila}>
              <span style={s.label}>Nombre</span>
              <span style={s.valor}>{cliente.name} {cliente.lastname}</span>
            </div>
            <div style={s.fila}>
              <span style={s.label}>Email</span>
              <span style={s.valor}>{cliente.email}</span>
            </div>
            <div style={s.fila}>
              <span style={s.label}>DNI</span>
              <span style={s.valor}>{cliente.dni || '—'}</span>
            </div>
            <div style={s.fila}>
              <span style={s.label}>Estado</span>
              <span style={s.chipEstado(cliente.account_status)}>
                {ESTADO_LABEL[cliente.account_status] || cliente.account_status}
              </span>
            </div>
          </div>

          {cliente.account_status === 'pending_reintegration' && (
            <div style={s.infoReintegro}>
              Este cliente tiene una solicitud de reintegro pendiente de resolución.
            </div>
          )}

          <div style={s.seccionAcciones}>
            {/* Suspender — solo si la cuenta está activa o disabled */}
            {(cliente.account_status === 'active' || cliente.account_status === 'disabled') && (
              <button style={s.botonSuspender} onClick={() => { setMotivoSuspender(''); setErrMotivo(''); setModalSuspender(true); }}>
                Suspender cuenta
              </button>
            )}
            {/* Reintegrar — si suspendida o pendiente de reintegro */}
            {(cliente.account_status === 'suspended' || cliente.account_status === 'pending_reintegration') && (
              <button style={s.botonReintegrar} onClick={() => { setMotivoReintegrar(''); setModalReintegrar(true); }}>
                Reintegrar cuenta
              </button>
            )}
            {/* Rechazar — solo si hay solicitud pendiente */}
            {cliente.account_status === 'pending_reintegration' && (
              <button style={s.botonRechazar} onClick={() => setModalRechazar(true)}>
                Rechazar solicitud
              </button>
            )}
          </div>
        </>
      )}

      {/* Modal suspender — E2: cancelar cierra sin cambios */}
      {modalSuspender && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <p style={s.modalTitulo}>Suspender cuenta</p>
            <p style={s.modalTexto}>
              Ingresá el motivo de la suspensión. El cliente será notificado.
            </p>
            <label style={s.modalLabel}>Motivo *</label>
            <textarea
              style={s.modalInput}
              value={motivoSuspender}
              onChange={(e) => { setMotivoSuspender(e.target.value); setErrMotivo(''); }}
              placeholder="Escribí el motivo..."
            />
            {errMotivo && <div style={{ ...s.error, marginBottom: '12px' }}>{errMotivo}</div>}
            <div style={s.modalBotones}>
              <button style={s.modalCancelar} onClick={() => setModalSuspender(false)} disabled={suspendiendo}>Cancelar</button>
              <button style={s.modalConfirmar(true)} onClick={confirmarSuspender} disabled={suspendiendo}>
                {suspendiendo ? 'Suspendiendo...' : 'Confirmar suspensión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal reintegrar */}
      {modalReintegrar && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <p style={s.modalTitulo}>Reintegrar cuenta</p>
            <p style={s.modalTexto}>
              La cuenta del cliente pasará a estado activo. Podés agregar un motivo opcional.
            </p>
            <label style={s.modalLabel}>Motivo (opcional)</label>
            <textarea
              style={s.modalInput}
              value={motivoReintegrar}
              onChange={(e) => setMotivoReintegrar(e.target.value)}
              placeholder="Motivo de reintegro..."
            />
            <div style={s.modalBotones}>
              <button style={s.modalCancelar} onClick={() => setModalReintegrar(false)} disabled={reintegrando}>Cancelar</button>
              <button style={s.modalConfirmar(false)} onClick={confirmarReintegrar} disabled={reintegrando}>
                {reintegrando ? 'Reintegrando...' : 'Confirmar reintegro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal rechazar reintegro */}
      {modalRechazar && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <p style={s.modalTitulo}>Rechazar solicitud de reintegro</p>
            <p style={s.modalTexto}>
              La solicitud será rechazada y la cuenta permanecerá suspendida.
              Ingresá el motivo del rechazo: el cliente será notificado.
            </p>
            <label style={s.modalLabel}>Motivo del rechazo *</label>
            <textarea
              style={s.modalInput}
              value={motivoRechazo}
              onChange={(e) => { setMotivoRechazo(e.target.value); setErrMotivoRechazo(''); }}
              placeholder="Escribí el motivo del rechazo..."
            />
            {errMotivoRechazo && <div style={{ ...s.error, marginBottom: '12px' }}>{errMotivoRechazo}</div>}
            <div style={s.modalBotones}>
              <button style={s.modalCancelar} onClick={() => setModalRechazar(false)} disabled={rechazando}>Cancelar</button>
              <button style={s.modalConfirmar(true)} onClick={confirmarRechazar} disabled={rechazando}>
                {rechazando ? 'Rechazando...' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutPrivado>
  );
}

export default GestionCuentaAdmin;

