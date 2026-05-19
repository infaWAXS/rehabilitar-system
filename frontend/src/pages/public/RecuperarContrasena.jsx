import React, { useState } from 'react';
import LayoutPublico from '../../layouts/LayoutPublico';

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
  enlace: { display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '13px' },
  desc: { fontSize: '13px', color: 'var(--color-texto-suave)', marginBottom: '20px' },
};

function RecuperarContrasena() {
  const [email, setEmail] = useState('');

  const enviar = (e) => {
    e.preventDefault();
    // TODO: conectar con servicio de recuperación
    alert('Implementar envío de mail de recuperación');
  };

  return (
    <LayoutPublico>
      <p style={s.desc}>
        Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>
      <form onSubmit={enviar}>
        <div style={s.campo}>
          <label style={s.label}>Correo electrónico</label>
          <input style={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ejemplo@mail.com" />
        </div>
        <button type="submit" style={s.boton}>Enviar enlace</button>
        <a href="/login" style={s.enlace}>Volver al login</a>
      </form>
    </LayoutPublico>
  );
}

export default RecuperarContrasena;
