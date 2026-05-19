import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LayoutPublico from '../../layouts/LayoutPublico';

const s = {
  campo: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--color-texto)' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--color-borde)', fontSize: '14px', outline: 'none',
    background: 'var(--color-fondo)',
  },
  boton: {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(90deg, var(--color-primario), var(--color-secundario))',
    color: '#fff', fontWeight: '700', fontSize: '15px', marginTop: '8px', cursor: 'pointer',
  },
  enlace: { display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '13px' },
};

function Login() {
  const [form, setForm] = useState({ email: '', contrasena: '' });
  const cambio = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = (e) => {
    e.preventDefault();
    // TODO: conectar con servicio de autenticación
    alert('Implementar lógica de login');
  };

  return (
    <LayoutPublico>
      <form onSubmit={enviar}>
        <div style={s.campo}>
          <label style={s.label}>Correo electrónico</label>
          <input style={s.input} type="email" name="email" value={form.email} onChange={cambio} required placeholder="ejemplo@mail.com" />
        </div>
        <div style={s.campo}>
          <label style={s.label}>Contraseña</label>
          <input style={s.input} type="password" name="contrasena" value={form.contrasena} onChange={cambio} required placeholder="••••••••" />
        </div>
        <button type="submit" style={s.boton}>Iniciar sesión</button>
        <a href="/recuperar-contrasena" style={s.enlace}>¿Olvidaste tu contraseña?</a>
        <a href="/registro" style={{ ...s.enlace, color: 'var(--color-texto-suave)' }}>¿No tenés cuenta? Registrarse</a>
      </form>
    </LayoutPublico>
  );
}

export default Login;
