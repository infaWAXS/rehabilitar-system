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
  desc: { fontSize: '13px', color: 'var(--color-texto-suave)', marginBottom: '20px' },
};

function RestablecerContrasena() {
  const [form, setForm] = useState({ nueva: '', confirmar: '' });
  const cambio = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = (e) => {
    e.preventDefault();
    // TODO: conectar con servicio de restablecimiento usando token de URL
    alert('Implementar restablecimiento de contraseña');
  };

  return (
    <LayoutPublico>
      <p style={s.desc}>Ingresá tu nueva contraseña.</p>
      <form onSubmit={enviar}>
        <div style={s.campo}>
          <label style={s.label}>Nueva contraseña</label>
          <input style={s.input} type="password" name="nueva" value={form.nueva} onChange={cambio} required />
        </div>
        <div style={s.campo}>
          <label style={s.label}>Confirmar contraseña</label>
          <input style={s.input} type="password" name="confirmar" value={form.confirmar} onChange={cambio} required />
        </div>
        <button type="submit" style={s.boton}>Restablecer contraseña</button>
      </form>
    </LayoutPublico>
  );
}

export default RestablecerContrasena;
