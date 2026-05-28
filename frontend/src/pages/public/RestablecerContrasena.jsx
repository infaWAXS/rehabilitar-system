// HU Restablecer contraseña - Responsable: Francis
// Como usuario o empleado registrado quiero restablecer la contraseña para poder acceder a mi cuenta.
// Regla de negocio: la contraseña debe tener al menos 6 caracteres.
// E1: token válido + contraseña válida + contraseñas coinciden → registra nueva contraseña y redirige a /login
// E2: contraseña < 6 caracteres → informa que la contraseña debe tener al menos 6 caracteres
// E3: contraseñas no coinciden → informa "Las contraseñas no coinciden."
// E4: token inválido o ausente en URL → informa que el enlace es inválido o ha expirado
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LayoutPublico from '../../layouts/LayoutPublico';
import { resetPassword } from '../../services/authService';

const s = {
  campo: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--color-texto)' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', fontSize: '14px', background: 'var(--color-fondo)',
  },
  boton: {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
    color: '#fff', fontWeight: '700', fontSize: '15px', marginTop: '8px', cursor: 'pointer',
  },
  botonDisabled: {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    background: '#ccc', color: '#fff', fontWeight: '700', fontSize: '15px', marginTop: '8px', cursor: 'not-allowed',
  },
  desc: { fontSize: '13px', color: 'var(--color-texto-suave)', marginBottom: '20px' },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
    padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px',
  },
  exito: {
    background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px',
    padding: '10px 14px', color: '#16a34a', fontSize: '13px', marginBottom: '16px',
  },
  tokenFaltante: {
    background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px',
    padding: '14px', color: '#c2410c', fontSize: '13px',
  },
  enlaceVolver: { display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--color-primario)', textDecoration: 'none' },
};

function RestablecerContrasena() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenURL = searchParams.get('token');

  const [form, setForm] = useState({ nueva: '', confirmar: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const cambio = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');

    if (form.nueva.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (form.nueva !== form.confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      await resetPassword(tokenURL, form.nueva, form.confirmar);
      navigate('/login', { state: { mensaje: 'Contraseña actualizada. Podés iniciar sesión.' } });
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña. El enlace puede haber expirado.');
    } finally {
      setCargando(false);
    }
  };

  if (!tokenURL) {
    return (
      <LayoutPublico>
        <div style={s.tokenFaltante}>
          El enlace de restablecimiento es inválido o ha expirado.
          Solicitá uno nuevo desde <a href="/recuperar-contrasena">Recuperar contraseña</a>.
        </div>
      </LayoutPublico>
    );
  }

  return (
    <LayoutPublico>
      <p style={s.desc}>Ingresá tu nueva contraseña.</p>
      <form onSubmit={enviar}>
        {error && <div style={s.error}>{error}</div>}
        <div style={s.campo}>
          <label style={s.label}>Nueva contraseña <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(mín. 6 caracteres)</span></label>
          <input style={s.input} type="password" name="nueva" value={form.nueva} onChange={cambio} required />
        </div>
        <div style={s.campo}>
          <label style={s.label}>Confirmar contraseña</label>
          <input style={s.input} type="password" name="confirmar" value={form.confirmar} onChange={cambio} required />
        </div>
        <button type="submit" style={cargando ? s.botonDisabled : s.boton} disabled={cargando}>
          {cargando ? 'Guardando...' : 'Restablecer contraseña'}
        </button>
        <a href="/login" style={s.enlaceVolver}>← Volver al login</a>
      </form>
    </LayoutPublico>
  );
}

export default RestablecerContrasena;
