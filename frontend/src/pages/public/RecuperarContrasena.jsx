import React, { useState } from 'react';
import LayoutPublico from '../../layouts/LayoutPublico';
import { requestPasswordRecovery } from '../../services/authService';

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
  enlace: { display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '13px' },
  desc: { fontSize: '13px', color: 'var(--color-texto-suave)', marginBottom: '20px' },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
    padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px',
  },
  exito: {
    background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px',
    padding: '10px 14px', color: '#16a34a', fontSize: '13px', marginBottom: '16px',
  },
};

function RecuperarContrasena() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const data = await requestPasswordRecovery(email);
      setToken(data.token || '');
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('registrado') || msg.toLowerCase().includes('not found')) {
        setError('El correo no está registrado en el sistema.');
      } else {
        setError('Ocurrió un error. Intentá de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <LayoutPublico>
      <p style={s.desc}>
        Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>
      {error && <div style={s.error}>{error}</div>}
      {token ? (
        <div style={s.exito}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>
            ¡Enlace generado! Hacé clic para restablecer tu contraseña:
          </div>
          <a
            href={`/restablecer-contrasena?token=${token}`}
            style={{ color: '#16a34a', wordBreak: 'break-all', fontSize: '12px' }}
          >
            /restablecer-contrasena?token={token.slice(0, 40)}...
          </a>
        </div>
      ) : (
        <form onSubmit={enviar}>
          <div style={s.campo}>
            <label style={s.label}>Correo electrónico</label>
            <input
              style={s.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ejemplo@mail.com"
            />
          </div>
          <button type="submit" style={cargando ? s.botonDisabled : s.boton} disabled={cargando}>
            {cargando ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
      )}
      <a href="/login" style={s.enlace}>Volver al login</a>
    </LayoutPublico>
  );
}

export default RecuperarContrasena;
