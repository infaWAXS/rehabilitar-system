// Responsable: Francis
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutPrivado from '../../../layouts/LayoutPrivado';
import { changePassword, clearUserData } from '../../../services/authService';
import { deleteMyAccount } from '../../../services/usersService';

const s = {
  seccion: {
    background: 'var(--color-fondo-card)', borderRadius: '12px',
    padding: '24px', marginBottom: '24px', boxShadow: 'var(--sombra)',
  },
  titulo: { fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--color-texto)' },
  campo: { marginBottom: '14px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--color-texto)' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', fontSize: '14px', background: 'var(--color-fondo)',
    boxSizing: 'border-box',
  },
  fila: { display: 'flex', gap: '12px' },
  boton: {
    padding: '10px 24px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
    color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
  botonDisabled: {
    padding: '10px 24px', borderRadius: '8px', border: 'none',
    background: '#ccc', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'not-allowed',
  },
  botonPeligro: {
    padding: '10px 24px', borderRadius: '8px', border: 'none',
    background: '#dc2626', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
    padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '14px',
  },
  exito: {
    background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px',
    padding: '10px 14px', color: '#16a34a', fontSize: '13px', marginBottom: '14px',
  },
  peligroLabel: { fontSize: '13px', color: 'var(--color-texto-suave)', marginBottom: '16px', lineHeight: 1.5 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px 32px', maxWidth: '380px', width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.18)' },
  modalTitulo: { fontSize: '18px', fontWeight: '700', marginBottom: '10px', color: 'var(--color-texto)' },
  modalTexto: { fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '24px', lineHeight: 1.5 },
  modalBotones: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  modalCancelar: { padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--color-borde)', background: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '600', color: 'var(--color-texto)' },
  modalConfirmar: { padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '700' },
};

function GestionCuentaCliente() {
  const navigate = useNavigate();

  // ── Cambiar contraseña ──────────────────────────
  const [passForm, setPassForm] = useState({ nueva: '', confirmar: '' });
  const [passError, setPassError] = useState('');
  const [passExito, setPassExito] = useState('');
  const [passCargando, setPassCargando] = useState(false);

  // ── Eliminar cuenta ─────────────────────────────
  const [modalEliminar, setModalEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // ── Solicitar reintegro ────────────────────────
  const [reintegroExito, setReintegroExito] = useState('');
  const [reintegroError, setReintegroError] = useState('');
  const [reintegroCargando, setReintegroCargando] = useState(false);

  const cambioCampo = (e) => setPassForm({ ...passForm, [e.target.name]: e.target.value });

  const enviarCambioPassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassExito('');

    if (passForm.nueva.length < 6) {
      setPassError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (passForm.nueva !== passForm.confirmar) {
      setPassError('Las contraseñas no coinciden.');
      return;
    }

    setPassCargando(true);
    try {
      await changePassword(passForm.nueva, passForm.confirmar);
      // E1: exito → cerrar sesion y redirigir al login
      clearUserData();
      navigate('/login', { state: { mensaje: 'Contrasena actualizada. Inicia sesion con tu nueva contrasena.' } });
    } catch (err) {
      setPassError(err.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setPassCargando(false);
    }
  };

  const confirmarEliminarCuenta = async () => {
    setEliminando(true);
    try {
      await deleteMyAccount();
      clearUserData();
      navigate('/');
    } catch (err) {
      setEliminando(false);
      setModalEliminar(false);
    }
  };

  const solicitarReintegro = async (e) => {
    e.preventDefault();
    setReintegroError('');
    setReintegroExito('');
    setReintegroCargando(true);

    try {
      // Aquí iría la llamada al endpoint de reintegro cuando esté disponible
      // await requestReintegration();
      setReintegroExito('Tu solicitud de reintegro ha sido enviada. Un administrador la revisará pronto.');
      setTimeout(() => setReintegroExito(''), 5000);
    } catch (err) {
      setReintegroError(err.message || 'No se pudo enviar la solicitud de reintegro.');
    } finally {
      setReintegroCargando(false);
    }
  };

  return (
    <LayoutPrivado titulo="Mi Cuenta">

      {/* ── Cambiar contraseña ─────────────────────── */}
      <div style={s.seccion}>
        <p style={s.titulo}>Cambiar contraseña</p>
        <form onSubmit={enviarCambioPassword} style={{ maxWidth: '420px' }}>
          {passError && <div style={s.error}>{passError}</div>}
          {passExito && <div style={s.exito}>{passExito}</div>}
          <div style={s.campo}>
            <label style={s.label}>
              Nueva contraseña{' '}
              <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(mín. 6 caracteres)</span>
            </label>
            <input style={s.input} type="password" name="nueva" value={passForm.nueva} onChange={cambioCampo} required />
          </div>
          <div style={s.campo}>
            <label style={s.label}>Confirmar contraseña</label>
            <input style={s.input} type="password" name="confirmar" value={passForm.confirmar} onChange={cambioCampo} required />
          </div>
          <div style={s.fila}>
            <button type="submit" style={passCargando ? s.botonDisabled : s.boton} disabled={passCargando}>
              {passCargando ? 'Guardando...' : 'Confirmar'}
            </button>
            <button
              type="button"
              onClick={() => { setPassForm({ nueva: '', confirmar: '' }); setPassError(''); setPassExito(''); }}
              style={{ ...s.boton, background: 'transparent', color: 'var(--color-texto-suave)', border: '1px solid var(--color-borde)' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* ── Solicitar reintegro de cuenta ──────────── */}
      <div style={s.seccion}>
        <p style={s.titulo}>Solicitar reintegro de cuenta</p>
        <p style={{ fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '16px', lineHeight: 1.5 }}>
          Si tu cuenta ha sido suspendida y creés que fue un error, puedes solicitar que un administrador la revise para reintegrarte al sistema.
        </p>
        <form onSubmit={solicitarReintegro}>
          {reintegroError && <div style={s.error}>{reintegroError}</div>}
          {reintegroExito && <div style={s.exito}>{reintegroExito}</div>}
          <button type="submit" style={reintegroCargando ? s.botonDisabled : s.boton} disabled={reintegroCargando}>
            {reintegroCargando ? 'Enviando...' : 'Solicitar reintegro'}
          </button>
        </form>
      </div>

      {/* ── Zona de peligro ───────────────────────── */}
      <div style={{ ...s.seccion, borderTop: '3px solid #dc2626' }}>
        <p style={{ ...s.titulo, color: '#dc2626' }}>Zona de peligro</p>
        <p style={s.peligroLabel}>
          Eliminar tu cuenta es una acción permanente. Se borrarán todos tus datos y no podrás volver a acceder al sistema con esta cuenta.
        </p>
        <button style={s.botonPeligro} onClick={() => setModalEliminar(true)}>
          Eliminar mi cuenta
        </button>
      </div>

      {/* ── Modal confirmar eliminación ────────────── */}
      {modalEliminar && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <p style={s.modalTitulo}>Eliminar cuenta</p>
            <p style={s.modalTexto}>
              ¿Estás seguro de que querés eliminar tu cuenta? Esta acción no se puede deshacer.
            </p>
            <div style={s.modalBotones}>
              <button style={s.modalCancelar} onClick={() => setModalEliminar(false)} disabled={eliminando}>
                Cancelar
              </button>
              <button style={s.modalConfirmar} onClick={confirmarEliminarCuenta} disabled={eliminando}>
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutPrivado>
  );
}

export default GestionCuentaCliente;
